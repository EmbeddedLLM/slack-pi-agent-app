// Stands in for the pi CLI.
//   print mode (-p): a research plan as JSON, or a normal answer naming the tools it got.
//   --mode json:     emulates the deep_research tool; the mode comes from mode.txt
//                    (complete | clarify | slow | notool).
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const dir = process.env.FAKE_PI_DIR;
const args = process.argv.slice(2);
const json = args.includes('--mode');
const sIdx = args.indexOf('--session');
const prompt = args[(sIdx >= 0 ? sIdx : args.indexOf('--no-session')) - 1] || '';
const tools = args[args.indexOf('--tools') + 1];
appendFileSync(
  path.join(dir, 'calls.log'),
  JSON.stringify({ json, tools, session: sIdx >= 0, runs: process.env.DEEP_RESEARCH_PI_RUNS || '', prompt: prompt.slice(0, 6000) }) + '\n'
);
const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!json) {
  if (prompt.includes('plan a deep web research job')) {
    if (prompt.includes('replied to the plan')) {
      console.log(
        'Here you go:\n{"title":"Vector DB comparison","question":"Compare open-source vector databases for a 10M-vector RAG workload in 2026, self-hosted on Kubernetes.","cover":["Query latency and recall","Operational cost"],"depth":"deep","domains":["https://milvus.io/docs","qdrant.tech"],"questions":[],"answers":[{"question":"Scale?","answer":"10M vectors"}]}'
      );
    } else {
      console.log(
        '{"title":"Vector DB comparison","question":"Compare open-source vector databases for RAG in 2026.","cover":["Performance","Features","Licensing"],"depth":"standard","domains":[],"questions":[{"question":"How many vectors?","options":["1M","10M","100M+"]},{"question":"Managed or self-hosted?"}],"answers":[]}'
      );
    }
  } else {
    console.log(`normal answer. tools=${tools} ask_rule=${prompt.includes('research_ask tool with run set to')}`);
  }
  process.exit(0);
}

let mode = 'complete';
try {
  mode = readFileSync(path.join(dir, 'mode.txt'), 'utf8').trim();
} catch {
  /* default */
}
out({ type: 'session', version: 3 });
if (mode === 'notool') {
  out({ type: 'message_end', message: { role: 'assistant', content: [{ type: 'text', text: '<deep_research><parameter=question>x</parameter></deep_research>' }] } });
  process.exit(0);
}
const call = { toolCallId: 'c1', toolName: 'deep_research', args: {} };
out({ type: 'tool_execution_start', ...call });
if (mode === 'clarify') {
  out({
    type: 'tool_execution_end',
    ...call,
    isError: false,
    result: {
      content: [{ type: 'text', text: 'The question leaves open what to research. Nothing was searched yet.\nAsk the user:\n1. Which region? (for example: EU / US)\n2. What budget?' }],
      details: { stage: 'clarify' },
    },
  });
  out({ type: 'message_end', message: { role: 'assistant', content: [{ type: 'text', text: '1. Which region?\n2. What budget?' }] } });
  process.exit(0);
}
const runDir = path.join(process.env.DEEP_RESEARCH_PI_RUNS, `2026-11-16-vector-db-${Math.random().toString(36).slice(2, 6)}`);
mkdirSync(runDir, { recursive: true });
for (let i = 1; i <= 3; i++) {
  out({
    type: 'tool_execution_update',
    ...call,
    partialResult: {
      content: [{ type: 'text', text: `Searching sub-topic ${i}/3\nreading ${process.env.DEEP_RESEARCH_PI_RUNS}/x.html` }],
      details: { phase: `Searching (${i}/3)`, sources: i * 7 },
    },
  });
  await sleep(150);
}
writeFileSync(path.join(runDir, 'report.partial.json'), JSON.stringify({ question: 'Compare open-source vector databases for RAG in 2026.', plan: [1] }));
if (mode === 'slow') {
  process.on('SIGTERM', () => process.exit(1));
  await sleep(60_000);
}
const resumed = prompt.includes('- resume:');
writeFileSync(path.join(runDir, 'report.md'), `# Vector DBs\nMilvus and Qdrant lead. ${resumed ? '(resumed)' : ''}\n<iframe src="/etc/passwd"></iframe>`);
writeFileSync(path.join(runDir, 'report.json'), '{}');
writeFileSync(path.join(runDir, 'report.pdf'), '%PDF-1.4 fake');
out({
  type: 'tool_execution_end',
  ...call,
  isError: false,
  result: {
    content: [{ type: 'text', text: `deep-research run complete on TokenVisor/Qwen.\nConfidence: high.\nFact-check: 9 supported.\nSources: 31 retrieved, 14 cited.\nArtifacts: ${runDir}/report.md` }],
    details: { reportPath: path.join(runDir, 'report.md'), jsonPath: path.join(runDir, 'report.json') },
  },
});
out({
  type: 'message_end',
  message: {
    role: 'assistant',
    content: [
      { type: 'thinking', thinking: 'hmm' },
      { type: 'text', text: `**Milvus and Qdrant** lead for RAG. Full report at ${runDir}/report.md\n\n## Key findings\n- Qdrant is fastest [qdrant](https://qdrant.tech)\n\nConfidence: high` },
    ],
  },
});
process.exit(0);
