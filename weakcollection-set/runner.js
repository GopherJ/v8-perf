const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const drawBarChart = require('../drawChart');

const BEFORE_D8 = '/p/google2/v8/out.gn/x64.release/d8';
const AFTER_D8 = '/p/google3/v8/out.gn/x64.release/d8';
const BENCH_JS = 'bench.js';
const ITERATIONS = 20;

console.log(`## Benchmark: \`${BENCH_JS}\`

\`\`\`js
${readFileSync(`${__dirname}/${BENCH_JS}`)}
\`\`\`
`)

console.log('## Results\n');
const runBench = (d8Binary, args, variant) => {
  const result = +execSync(`
    for i in {1..${ITERATIONS}}; do
      ${d8Binary} ${__dirname}/${BENCH_JS} ${args} -- ${variant};
    done | st --mean
  `);
  return result.toFixed(2);
};

console.log('|        |  Method  | Before | After | Improvement |');
console.log('|--------|----------|--------|-------|-------------|');

const VARIANTS = {
  'WeakMap-constructor': 'new WeakMap(pairs)',
  'WeakSet-constructor': 'new WeakSet(keys)',
  'WeakMap-set-existing': 'WeakMap.set(existingKey, value)',
  'WeakMap-set-new': 'WeakMap.set(key, value)',
  'WeakSet-add-existing': 'WeakSet.add(existingKey)',
  'WeakSet-add-new': 'WeakSet.add(key)'
}

const ARGS = [
  '--noopt',
  ''
];

const results = [];
for (const arg of ARGS) {
  for (const variant of Object.keys(VARIANTS)) {
    const after = runBench(AFTER_D8, arg, variant);
    const before = runBench(BEFORE_D8, arg, variant);
    console.log(`| ${arg} | ${VARIANTS[variant]} | ${before}ms | ${after}ms | ${(before / after).toFixed(2)}x |`);
    results.push({
      arg,
      variant,
      name: VARIANTS[variant],
      before,
      after
    });
  }
}

drawBarChart(results.filter(r => r.variant.includes('constructor')));
drawBarChart(results.filter(r => !r.variant.includes('constructor')));
