import { FEEDBACK_BATCH } from "./scenario";
import { analyzeFeedback } from "./intelligence";

const report = analyzeFeedback(FEEDBACK_BATCH);

console.log(`Feedback: ${report.total} items, quarantined ${report.quarantined.length}`);
console.log("Themes:");
for (const theme of report.themes) {
  console.log(`- ${theme.label} (${theme.owner}) score=${theme.weightedScore} count=${theme.count}`);
  console.log(`  ${theme.recommendation}`);
}
console.log("Roadmap tickets:");
for (const ticket of report.roadmapTickets) console.log(`- ${ticket}`);
