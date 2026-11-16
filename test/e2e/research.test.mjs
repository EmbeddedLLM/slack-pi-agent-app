// Deep research end to end: plan card, edit, thread replies, start, progress,
// report delivery, follow-ups, tool clarification, cancel + resume, failures.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { J, finish, ok, sleep, startBot, until } from './harness.mjs';

const bot = await startBot();
const { app, client, calls } = bot;
const blocks = (c) => J(c.a.blocks);
const actionValue = (c) => c.a.blocks.find((b) => b.type === 'actions').elements[0].value;

// 1. A member asking for research gets a normal answer and a note.
await bot.mention('UMEM', 'research vector databases');
const memberAnswer = await until(() => bot.lastUpdate((a) => /normal answer/.test(J(a.blocks))));
ok(bot.ephemerals().some((t) => /only available to admins/.test(t)), 'member: told deep research is admin-only');
ok(!/deep_research|research_ask/.test(blocks(memberAnswer)), 'member: no research tools given');

// 2. An admin gets a plan card.
await bot.mention('UADMIN', 'research: compare open-source vector databases');
const thread = bot.lastTs;
const card = await until(() => bot.lastUpdate((a) => /research_start/.test(J(a.blocks))));
ok(/A few questions first/.test(blocks(card)) && /How many vectors/.test(blocks(card)), 'plan card shows clarifying questions');
ok(/Standard/.test(blocks(card)) && /the whole web/.test(blocks(card)), 'plan card shows depth and sources');
const planId = actionValue(card);

// 3. Only admins can start it.
await bot.click('research_start', planId, 'UMEM');
await sleep(100);
ok(bot.ephemerals().some((t) => /Only admins can start/.test(t)), 'member cannot press Start');

// 4. Edit plan dialog.
await bot.click('research_edit', planId);
const view = await until(() => calls.find((c) => c.m === 'views.open'));
ok(view.a.view.blocks.some((b) => b.block_id === 'notes'), 'Edit plan opens a dialog with an answers field');
await app.h.view.research_edit_submit({
  ack: async () => {},
  client,
  body: { user: { id: 'UADMIN' } },
  view: {
    private_metadata: planId,
    state: {
      values: {
        question: { v: { value: 'Compare open-source vector DBs for RAG.' } },
        cover: { v: { value: '- Latency\n- Cost' } },
        notes: { v: { value: '10M vectors, self-hosted' } },
        depth: { v: { selected_option: { value: 'deep' } } },
        domains: { v: { value: 'https://qdrant.tech/docs, bad domain, milvus.io' } },
      },
    },
  },
});
const edited = await until(() => bot.lastUpdate((a) => /Edited by/.test(J(a.blocks))));
ok(
  /Deep/.test(blocks(edited)) && /qdrant.tech, milvus.io/.test(blocks(edited)) && /10M vectors/.test(blocks(edited)) && !/A few questions first/.test(blocks(edited)),
  'edit applied: depth, cleaned domains, answers; questions cleared'
);

// 5. A tagged reply in the thread updates the plan.
await bot.mention('UADMIN', 'make it Kubernetes only', thread);
const updated = await until(() => bot.lastUpdate((a) => /Updated plan/.test(J(a.blocks))));
ok(calls.some((c) => c.m === 'chat.update' && /Replaced by the updated plan/.test(blocks(c))), 'old card is marked as replaced');
ok(actionValue(updated) !== planId, 'updated plan has a new id');
ok(
  bot.piCalls().filter((c) => /plan a deep web research job/.test(c.prompt)).every((c) => !c.session && c.tools === 'read'),
  'planning runs without a session and with only the read tool'
);

// 6. The replaced plan's buttons no longer work.
await bot.click('research_start', planId);
await sleep(100);
ok(bot.ephemerals().some((t) => /already started, replaced or discarded/.test(t)), 'a replaced plan cannot be started');

// 7. "start" starts it: progress, summary, report files, footer.
bot.setMode('complete');
await bot.mention('UADMIN', 'start', thread);
await until(() => bot.lastUpdate((a) => /Started by Ada Admin/.test(J(a.blocks))));
const footer = await until(() => calls.find((c) => c.m === 'chat.postMessage' && /Research finished/.test(c.a.text || '')));
const run = bot.piCalls().find((c) => c.json);
ok(run.tools === 'deep_research' && run.runs.includes(`C0TEST_${thread.replace('.', '_')}`), 'research run gets only deep_research and a per-thread folder');
ok(/"deep"/.test(run.prompt) && /qdrant.tech/.test(run.prompt) && /answers/.test(run.prompt), 'research prompt carries depth, domains and answers');
const summary = calls.filter((c) => c.m === 'chat.update').map(blocks).find((t) => /Milvus and Qdrant/.test(t));
ok(summary && !/slack-pi-e2e/.test(summary) && /internal path/.test(summary), 'summary is posted with the run folder hidden');
const upload = calls.find((c) => c.m === 'files.uploadV2');
ok(upload && upload.a.file_uploads.map((f) => f.filename).join(',') === 'Vector-DB-comparison.pdf,Vector-DB-comparison.md', 'report uploaded as PDF and Markdown');
ok(/confidence: high/.test(footer.a.text) && /14 of 31 sources/.test(footer.a.text), 'footer shows duration, confidence and sources');
ok(calls.some((c) => c.m === 'chat.update' && /Researching/.test(blocks(c))), 'live progress was shown');

// 8. Follow-ups: research_ask for admins only.
await bot.mention('UADMIN', 'which one is cheapest?', thread);
const adminFollowUp = await until(() => bot.lastUpdate((a) => /normal answer.*research_ask/.test(J(a.blocks))));
ok(/ask_rule=true/.test(blocks(adminFollowUp)) && !/deep_research/.test(blocks(adminFollowUp)), 'admin follow-up: research_ask with its rule, no deep_research');
await bot.mention('UMEM', 'which one is cheapest?', thread);
const memberFollowUp = await until(() => bot.lastUpdate((a) => /ask_rule=false/.test(J(a.blocks))));
ok(!/research_ask/.test(blocks(memberFollowUp)), 'member follow-up: no research_ask');

// 9. The tool asks for clarification -> new plan card with its questions.
const before9 = calls.length;
await bot.mention('UADMIN', 'research EU cloud pricing');
const card2 = await until(() => calls.find((c, i) => i > before9 && c.m === 'chat.update' && /research_start/.test(blocks(c))));
bot.setMode('clarify');
await bot.click('research_start', actionValue(card2));
const clarify = await until(() => bot.lastUpdate((a) => /needs a little more detail/.test(J(a.blocks))));
ok(/Which region/.test(blocks(clarify)) && /EU \/ US/.test(blocks(clarify)), "tool's clarifying questions become a new plan card");

// 10. Cancel mid-run -> Resume button -> resume finishes.
bot.setMode('slow');
const clarifyIdx = calls.indexOf(clarify);
bot.click('research_start', actionValue(clarify));
const running = await until(() => calls.find((c, i) => i > clarifyIdx && c.m === 'chat.postMessage' && /Research queued/.test(c.a.text || '')));
await until(() => existsSync(path.join(bot.dir, 'research')) && bot.piCalls().filter((c) => c.json).length >= 3);
await sleep(800);
const jobId = J(running.a.blocks).match(/"value":"(research:[^"]+)"/)[1];
await app.h.action.cancel_job({ ack: async () => {}, body: { user: { id: 'UADMIN' } }, action: { value: jobId }, client });
const cancelled = await until(() => bot.lastUpdate((a) => /Research cancelled by Ada Admin/.test(J(a.blocks))), 30_000);
ok(/research_resume/.test(blocks(cancelled)), 'cancel offers a Resume button');
bot.setMode('complete');
const resumeValue = actionValue(cancelled);
await bot.click('research_resume', resumeValue, 'UMEM');
await sleep(100);
ok(bot.ephemerals().some((t) => /Only admins can resume/.test(t)), 'member cannot resume');
await bot.click('research_resume', resumeValue, 'UADMIN', cancelled.a.ts);
await until(() => calls.filter((c) => c.m === 'chat.postMessage' && /Research finished/.test(c.a.text || '')).length >= 2, 30_000);
ok(bot.piCalls().filter((c) => c.json).pop().prompt.includes('- resume: '), 'resume passes the checkpoint');

// 11. The model never calls the tool -> one retry, then a clear error.
bot.setMode('notool');
const before11 = calls.length;
await bot.mention('UADMIN', 'research something else');
const card4 = await until(() => calls.find((c, i) => i > before11 && c.m === 'chat.update' && /research_start/.test(blocks(c))));
await bot.click('research_start', actionValue(card4));
ok(Boolean(await until(() => bot.lastUpdate((a) => /did not start the research tool/.test(J(a.blocks))), 30_000)), 'tool never called -> retried, then a clear error');

finish();
