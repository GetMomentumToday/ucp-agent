const API = 'http://localhost:3001/api/chat';

async function sendMessage(messages, sessionId) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, sessionId }),
  });

  const raw = await res.text();
  const lines = raw.split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6));

  let text = '';
  const tools = [];
  const parts = [];

  for (const line of lines) {
    try {
      const d = JSON.parse(line);
      if (d.type === 'text-delta' && d.delta) text += d.delta;
      if (d.type === 'tool-input-available') tools.push(d.toolName);
      if (d.type === 'text-start') parts.push({ type: 'text', text: '' });
      if (d.type === 'text-delta' && parts.length > 0) {
        const last = parts[parts.length - 1];
        if (last.type === 'text') last.text += d.delta;
      }
      if (d.type === 'tool-output-available') {
        parts.push({ type: `tool-${d.toolName}`, toolCallId: d.toolCallId, toolName: d.toolName, state: 'result', output: d.output });
      }
    } catch {}
  }

  return { text: text.trim(), tools, parts };
}

function makeMsg(role, text, id) {
  return { id: String(id), role, parts: [{ type: 'text', text }] };
}

function makeAssistantMsg(text, _parts, id) {
  const msgParts = [];
  if (text) msgParts.push({ type: 'text', text });
  if (msgParts.length === 0) msgParts.push({ type: 'text', text: '(no response)' });
  return { id: String(id), role: 'assistant', parts: msgParts };
}

async function runFullCheckout() {
  const session = `checkout-${Date.now()}`;
  const messages = [];
  let msgId = 0;

  console.log('=== FULL CHECKOUT FLOW ===\n');

  const steps = [
    'hey, I want to buy a yoga bag',
    'Jan Novak, jan@test.com',
    'Hlavna 1, Bratislava, 811 01, SK',
    'yes, place it',
  ];

  for (const userMsg of steps) {
    msgId++;
    messages.push(makeMsg('user', userMsg, msgId));
    process.stdout.write(`USER: ${userMsg}\n`);

    const result = await sendMessage(messages, session);
    msgId++;
    messages.push(makeAssistantMsg(result.text, result.parts, msgId));

    console.log(`AGENT: ${result.text.slice(0, 250)}${result.text.length > 250 ? '...' : ''}`);
    console.log(`TOOLS: ${result.tools.join(', ') || 'none'}`);

    const hasOrder = result.text.match(/#?\d{6,}/);
    if (hasOrder) console.log(`>>> ORDER ID FOUND: ${hasOrder[0]}`);
    console.log('');
  }
}

async function runBrowseAndBuy() {
  const session = `browse-${Date.now()}`;
  const messages = [];
  let msgId = 0;

  console.log('=== BROWSE → COMPARE → BUY ===\n');

  const steps = [
    'show me bags',
    'which one is best for daily commute?',
    'I\'ll take the messenger bag. I\'m Maria Schmidt, maria@example.com, Kaiserstrasse 10, Vienna, 1010, AT',
    'go ahead',
  ];

  for (const userMsg of steps) {
    msgId++;
    messages.push(makeMsg('user', userMsg, msgId));
    process.stdout.write(`USER: ${userMsg}\n`);

    const result = await sendMessage(messages, session);
    msgId++;
    messages.push(makeAssistantMsg(result.text, result.parts, msgId));

    console.log(`AGENT: ${result.text.slice(0, 250)}${result.text.length > 250 ? '...' : ''}`);
    console.log(`TOOLS: ${result.tools.join(', ') || 'none'}`);

    const hasOrder = result.text.match(/#?\d{6,}/);
    if (hasOrder) console.log(`>>> ORDER ID FOUND: ${hasOrder[0]}`);
    console.log('');
  }
}

async function main() {
  await runFullCheckout();
  console.log('\n' + '='.repeat(60) + '\n');
  await runBrowseAndBuy();
}

main().catch(console.error);
