import { classify } from "./src/classify.ts";

const src = {
  key: 't',
  name: 'T',
  url: 'https://example.com/feed',
  kind: 'en-media' as const,
  lang: 'en' as const,
  enabled: true,
};

// Looking for a real tie-break scenario
const testCases = [
  { title: "MCP release protocol", desc: "MCP (1 match protocol) + release (1 match model-platform)" },
  { title: "agents SDK update", desc: "agents sdk (check which layers match)" },
  { title: "new Claude agents", desc: "claude (1 model-platform) + agents (check others)" },
];

testCases.forEach(({ title, desc }) => {
  const result = classify({ title }, src);
  console.log(`"${title}"`);
  console.log(`  Result: ${result.ecosystemLayer}`);
  console.log(`  Note: ${desc}`);
  console.log();
});
