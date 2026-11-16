// pi extension: keep the agent's file tools inside the workspace, and stop it
// from installing dependencies at runtime.
//
// Install: copy to ~/.pi/agent/extensions/path-guard.ts (auto-discovered).
//
// - read / ls / grep / find / edit / write: any path that resolves (after
//   following symlinks) outside PI_GUARD_ROOT, or outside the extra folders in
//   PI_GUARD_ALLOW_DIRS (the bot sets this to the request's uploaded files), is
//   blocked. That covers ~/.pi/agent/*.json, /proc/self/environ, /etc, etc.
// - Secret-looking files inside those folders (.env*, auth.json, .pi/) are
//   blocked too.
// - bash is blocked unless PI_GUARD_ALLOW_BASH=1. When it is allowed, package
//   installs (npm/npx/pip/uv/apt/brew/cargo/go/curl|sh, ...) are still blocked.
//   A shell can read anything the pi user can, so this guard does NOT protect
//   secrets once bash is on; use an OS sandbox for that.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = realpathSync(process.env.PI_GUARD_ROOT || process.cwd());
const EXTRA_ROOTS = (process.env.PI_GUARD_ALLOW_DIRS || "")
  .split(path.delimiter)
  .filter(Boolean)
  .map((p) => {
    try {
      return realpathSync(p);
    } catch {
      return path.resolve(p);
    }
  });
const ROOTS = [ROOT, ...EXTRA_ROOTS];

const SECRET_NAMES = /(^|[\\/])(\.env(\.[^\\/]*)?|auth\.json|\.pi|\.ssh|\.netrc|\.npmrc|\.pypirc)([\\/]|$)/i;
const PATH_KEYS = ["path", "file_path", "filePath", "cwd", "dir", "directory"];

// Commands that fetch and install code. Matched anywhere in a shell command
// (after ; && || | ` $( and at the start).
const INSTALL_PATTERNS: RegExp[] = [
  /\bnpm\s+(i|install|add|ci|update|upgrade|exec|x)\b/i,
  /\b(npx|pnpx|bunx|uvx|pipx)\b/i,
  /\bpnpm\s+(i|install|add|update|dlx)\b/i,
  /\byarn(\s+(add|install|dlx|up|upgrade))?\s*($|[;&|)])/i,
  /\byarn\s+(add|install|dlx|up|upgrade)\b/i,
  /\bbun\s+(add|install|i|x)\b/i,
  /\b(pip|pip3)\s+install\b/i,
  /\bpython[\d.]*\s+-m\s+(pip|ensurepip)\b/i,
  /\buv\s+(add|sync|pip\s+install|tool\s+install|run\s+--with)\b/i,
  /\b(poetry|pdm|hatch)\s+(add|install)\b/i,
  /\b(conda|mamba|micromamba)\s+(install|create|update)\b/i,
  /\b(apt|apt-get|aptitude|dnf|yum|zypper|pacman|apk|snap|flatpak)\s+(install|add|-S)\b/i,
  /\bbrew\s+(install|tap|upgrade)\b/i,
  /\bcargo\s+(install|add)\b/i,
  /\bgo\s+(install|get)\b/i,
  /\bgem\s+install\b/i,
  /\bcomposer\s+(require|install|update)\b/i,
  /\b(deno)\s+(install|add)\b/i,
  /\bpi\s+(install|add)\b/i,
  /\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z|da)?sh\b/i,
];

// Resolve a path the way the OS will, even if the last parts don't exist yet.
function resolveReal(p: string): string {
  const expanded = p.replace(/^~(?=$|[\\/])/, os.homedir());
  let cur = path.resolve(ROOT, expanded);
  const tail: string[] = [];
  while (!existsSync(cur)) {
    const parent = path.dirname(cur);
    if (parent === cur) break;
    tail.unshift(path.basename(cur));
    cur = parent;
  }
  try {
    cur = realpathSync(cur);
  } catch {
    /* keep lexical path */
  }
  return path.join(cur, ...tail);
}

function check(p: string): string | null {
  const real = resolveReal(p);
  const root = ROOTS.find((r) => real === r || real.startsWith(r + path.sep));
  if (!root) return `Access outside the workspace is not allowed: ${p}`;
  if (SECRET_NAMES.test(path.relative(root, real))) return `Access to secret files is not allowed: ${p}`;
  return null;
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event) => {
    const input = (event.input ?? {}) as Record<string, unknown>;

    if (event.toolName === "bash") {
      if (process.env.PI_GUARD_ALLOW_BASH !== "1") {
        return { block: true, reason: "Shell commands are disabled in this environment." };
      }
      const command = String(input.command ?? "");
      if (INSTALL_PATTERNS.some((re) => re.test(command))) {
        return {
          block: true,
          reason: "Installing packages or dependencies at runtime is not allowed. Use only what is already installed.",
        };
      }
      return;
    }

    for (const key of PATH_KEYS) {
      const v = input[key];
      if (typeof v === "string" && v) {
        const reason = check(v);
        if (reason) return { block: true, reason };
      }
    }
    for (const v of Array.isArray(input.paths) ? input.paths : []) {
      if (typeof v === "string") {
        const reason = check(v);
        if (reason) return { block: true, reason };
      }
    }
  });
}
