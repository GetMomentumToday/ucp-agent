const API = 'http://localhost:3001/api/chat';

const scenarios = [
  { id: '01', name: 'greeting', msg: 'hey' },
  { id: '02', name: 'search-bags', msg: 'show me bags' },
  { id: '03', name: 'search-jacket-activity', msg: 'I need a jacket for hiking' },
  { id: '04', name: 'search-price-filter', msg: 'what do you have under 40 dollars?' },
  { id: '05', name: 'search-no-results', msg: 'do you have any electric scooters?' },
  { id: '06', name: 'vague-request', msg: 'I need something for the gym' },
  { id: '07', name: 'product-details', msg: 'tell me more about the Joust Duffle Bag' },
  { id: '08', name: 'buy-direct', msg: 'I want to buy the Voyage Yoga Bag' },
  { id: '09', name: 'buy-with-info', msg: 'I want the Wayfarer Messenger Bag. My name is Jan Novak, jan@test.com' },
  { id: '10', name: 'multiple-items', msg: 'I need both a yoga bag and a gym bag' },
  { id: '11', name: 'size-question', msg: 'do you have this jacket in large?' },
  { id: '12', name: 'compare-products', msg: 'which is better, the duffle bag or the messenger bag?' },
  { id: '13', name: 'change-mind', msg: 'actually never mind, I want something else' },
  { id: '14', name: 'order-status', msg: 'can you check order 000000042?' },
  { id: '15', name: 'nonsense', msg: 'what is the meaning of life?' },
];

async function runScenario(scenario) {
  const session = `s-${scenario.id}-${Date.now()}`;
  const body = JSON.stringify({
    messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: scenario.msg }] }],
    sessionId: session,
  });

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const raw = await res.text();
    const lines = raw.split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6));

    let text = '';
    const tools = [];
    let error = null;

    for (const line of lines) {
      try {
        const d = JSON.parse(line);
        if (d.type === 'text-delta' && d.delta) text += d.delta;
        if (d.type === 'tool-input-available') tools.push(d.toolName);
        if (d.type === 'error') error = d.errorText;
      } catch {}
    }

    return { ...scenario, text: text.trim(), tools, error, status: error ? 'ERROR' : text ? 'OK' : 'EMPTY' };
  } catch (e) {
    return { ...scenario, text: '', tools: [], error: e.message, status: 'FAIL' };
  }
}

async function main() {
  const filter = process.argv[2];
  const toRun = filter
    ? scenarios.filter((s) => filter.split(',').includes(s.id))
    : scenarios;

  console.log(`Running ${toRun.length} scenarios...\n`);

  const results = [];
  for (const s of toRun) {
    process.stdout.write(`  [${s.id}] ${s.name}... `);
    const r = await runScenario(s);
    console.log(r.status);
    results.push(r);
  }

  console.log('\n' + '='.repeat(80));
  for (const r of results) {
    console.log(`\n### [${r.id}] ${r.name} — ${r.status}`);
    console.log(`INPUT: ${r.msg}`);
    console.log(`TOOLS: ${r.tools.length > 0 ? r.tools.join(', ') : 'none'}`);
    if (r.error) console.log(`ERROR: ${r.error}`);
    console.log(`RESPONSE: ${r.text.slice(0, 300)}${r.text.length > 300 ? '...' : ''}`);
  }

  const ok = results.filter((r) => r.status === 'OK').length;
  const fail = results.length - ok;
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TOTAL: ${ok}/${results.length} OK, ${fail} failed`);
}

main();
