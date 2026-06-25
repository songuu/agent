import { CHECKOUT_INCIDENT } from "./scenario";
import { runIncidentResponder } from "./responder";

const report = runIncidentResponder(CHECKOUT_INCIDENT);

console.log(`Incident: ${report.incidentId} (${report.severity})`);
console.log(`Summary: ${report.summary}`);
console.log(`Root cause: ${report.diagnosis.rootCause}`);
console.log(`Runbook: ${report.selectedRunbook}`);
console.log("Actions:");
for (const action of report.actions) {
  console.log(`- [${action.status}] ${action.owner}: ${action.title} -> ${action.command}`);
}
console.log(`Customer message: ${report.customerMessage}`);
console.log(`Postmortem items: ${report.postmortemChecklist.length}`);
console.log(`Estimated context tokens: ${report.estimatedCostTokens}`);
