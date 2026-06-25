import { LEADS } from "./scenario";
import { researchLeads } from "./researcher";

const briefs = researchLeads(LEADS);

console.log(`Leads: ${briefs.length}`);
for (const brief of briefs) {
  console.log(`- ${brief.name}: ${brief.qualification} total=${brief.score.total}`);
  console.log(`  Talk track: ${brief.talkTrack}`);
  console.log(`  Next: ${brief.nextAction}`);
  console.log(`  Contact: ${brief.safeContactNote}`);
}
