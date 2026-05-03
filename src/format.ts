import type { InspectionReport } from "./types.js";

export function formatJson(report: InspectionReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function formatMarkdown(report: InspectionReport): string {
  const lines = [
    "# modelgate inspection",
    "",
    `Providers: ${report.summary.providers} · Models: ${report.summary.models} · Routes: ${report.summary.routes}`,
    `Findings: ${report.summary.findings} (${report.summary.errors} errors, ${report.summary.warnings} warnings)`,
    "",
    "## Route estimates",
    "",
    "| Route | Primary | Fallbacks | Primary USD | Fallback USD | Budget |",
    "|---|---|---:|---:|---:|---|",
    ...report.estimates.map((estimate) => `| ${estimate.routeId} | ${estimate.primary} | ${estimate.fallbackCount} | $${estimate.estimatedPrimaryUsd.toFixed(4)} | $${estimate.estimatedFallbackUsd.toFixed(4)} | ${estimate.budgetStatus} |`),
    "",
    "## Findings",
    ""
  ];

  if (report.findings.length === 0) {
    lines.push("No findings. Nice and tidy.");
  } else {
    for (const finding of report.findings) {
      const context = [finding.routeId, finding.modelId].filter(Boolean).join(" / ");
      lines.push(`- **${finding.severity.toUpperCase()}** \`${finding.code}\`${context ? ` (${context})` : ""}: ${finding.message}`);
    }
  }

  return `${lines.join("\n")}\n`;
}
