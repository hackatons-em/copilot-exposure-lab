/**
 * @cel/types — the frozen domain contract for Copilot Exposure Lab.
 *
 * - enums:    closed vocabularies (zod-backed).
 * - entities: seed/ingest inputs + zod schemas (TenantGraph and its parts).
 * - findings: engine-derived outputs (Finding, EvidenceItem, RiskScore, ...).
 */
export * from "./enums.js";
export * from "./entities.js";
export * from "./findings.js";
