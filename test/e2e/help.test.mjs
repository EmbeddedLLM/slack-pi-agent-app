// Help card, Home tab, capability list in the prompt, and one-time tips.
import { J, finish, ok, sleep, startBot, until } from './harness.mjs';

const bot = await startBot();
const { app, client, calls } = bot;
const since = (i) => calls.slice(i);
const waitForAnswer = (i) => until(() => since(i).some((c) => c.m === 'chat.update' && /normal answer/.test(J(c.a.blocks))));

let i = calls.length;
await bot.mention('UMEM', 'help');
let card = since(i).find((c) => c.m === 'chat.postEphemeral');
ok(card && card.a.user === 'UMEM' && card.a.blocks, 'member help -> private card');
ok(/Search the web/.test(J(card.a.blocks)) && /Read your files/.test(J(card.a.blocks)) && /Make files/.test(J(card.a.blocks)), 'member card: web search, reading and making files');
ok(!/Deep research/.test(J(card.a.blocks)) && !/team workspace/.test(J(card.a.blocks)), 'member card: no deep research, no workspace tools');
ok(/@test-bot summarise this thread/.test(J(card.a.blocks)) && /Your role: \*member\*/.test(J(card.a.blocks)), 'examples use the bot name; role is shown');
ok(!since(i).some((c) => c.m === 'chat.postMessage'), 'help does not run the agent');

i = calls.length;
await bot.mention('UADMIN', 'What can you do?');
card = since(i).find((c) => c.m === 'chat.postEphemeral');
ok(/Deep research/.test(J(card.a.blocks)) && /@test-bot research <topic>/.test(J(card.a.blocks)) && /team workspace/.test(J(card.a.blocks)), 'admin card: deep research command and workspace tools');

i = calls.length;
await bot.mention('UADMIN', '');
ok(since(i).some((c) => c.m === 'chat.postEphemeral' && /here's what I can do/.test(J(c.a.blocks))), 'a bare mention shows the help card');

i = calls.length;
await bot.mention('UNOBODY', 'help');
card = since(i).find((c) => c.m === 'chat.postEphemeral');
ok(/don't have access/.test(J(card.a.blocks)) && /UNOBODY/.test(J(card.a.blocks)), 'no access: explains how to get it, with the member ID');

i = calls.length;
await bot.dm('UMEM', 'hi');
const dm = since(i).find((c) => c.m === 'chat.postMessage');
ok(dm && dm.a.channel === 'D0DM' && /In a direct message with me, just type/.test(J(dm.a.blocks)), 'DM "hi" -> visible help, worded for DMs');

i = calls.length;
await app.h.event.app_home_opened({ event: { type: 'app_home_opened', user: 'UADMIN', tab: 'home' }, client });
const home = since(i).find((c) => c.m === 'views.publish');
ok(home && home.a.view.type === 'home' && /How deep research works/.test(J(home.a.view.blocks)), 'Home tab: admin sees the guide and deep research steps');
const types = home.a.view.blocks.map((b) => b.type);
ok(types.at(-1) === 'context' && types.at(-3) === 'divider', 'Home tab: deep research steps sit above the tips');
i = calls.length;
await app.h.event.app_home_opened({ event: { type: 'app_home_opened', user: 'UMEM', tab: 'home' }, client });
ok(!/How deep research works/.test(J(since(i).find((c) => c.m === 'views.publish').a.view.blocks)), 'Home tab: member does not see deep research');

i = calls.length;
await bot.mention('UMEM', 'can you make a PDF?');
await waitForAnswer(i);
await sleep(100);
const memberPrompt = bot.piCalls().pop().prompt;
ok(/What you can do for Mo Member/.test(memberPrompt) && /Make files/.test(memberPrompt) && !/Deep research/.test(memberPrompt), 'prompt lists what the member can do');
ok(since(i).some((c) => c.m === 'chat.postEphemeral' && /First time here/.test(c.a.text)), 'first answer -> one-time welcome tip');
i = calls.length;
await bot.mention('UMEM', 'and a CSV?');
await waitForAnswer(i);
await sleep(100);
ok(!since(i).some((c) => c.m === 'chat.postEphemeral' && /First time here/.test(c.a.text || '')), 'welcome tip is not repeated');

for (const q of ['hello there friend', 'give me an in-depth comparison of vector databases', 'another deep dive into RAG']) {
  i = calls.length;
  await bot.mention('UADMIN', q);
  await waitForAnswer(i);
  await sleep(100);
}
const tips = calls.filter((c) => c.m === 'chat.postEphemeral' && c.a.user === 'UADMIN' && /fact-checked report/.test(c.a.text || ''));
ok(tips.length === 2 && /@test-bot research <your question>/.test(tips[0].a.text), 'admin asking for an in-depth report -> research tip (at most twice)');
ok(/you cannot start it yourself/.test(bot.piCalls().pop().prompt), 'admin prompt explains how deep research is started');

finish();
