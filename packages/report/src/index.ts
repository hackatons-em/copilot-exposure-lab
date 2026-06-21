/** @cel/report — deterministic Markdown/HTML report generation. No LLM in the rendering path. */
export { buildReportModel } from "./model.js";
export type { ReportModel, ReportFinding, BuildReportInput } from "./model.js";
export { renderMarkdown } from "./markdown.js";
export { renderHtml } from "./html.js";
