import { z } from "zod";

/**
 * Closed vocabularies for the domain. Defined once as zod enums so the same
 * source backs both runtime validation (seed loading) and the TS types.
 */

export const principalKind = z.enum(["user", "group", "external", "link"]);
export type PrincipalKind = z.infer<typeof principalKind>;

export const membershipKind = z.enum(["security", "m365", "dynamic", "everyone-except-external", "distribution"]);
export type MembershipKind = z.infer<typeof membershipKind>;

export const resourceKind = z.enum(["site", "drive", "file", "folder", "agent", "connector"]);
export type ResourceKind = z.infer<typeof resourceKind>;

export const grantVia = z.enum(["direct", "inherited", "link", "guest", "orgwide"]);
export type GrantVia = z.infer<typeof grantVia>;

export const grantRight = z.enum(["read", "write", "owner", "manage"]);
export type GrantRight = z.infer<typeof grantRight>;

export const linkScope = z.enum(["anyone", "org-wide", "specific"]);
export type LinkScope = z.infer<typeof linkScope>;

export const businessCriticality = z.enum(["low", "medium", "high", "critical"]);
export type BusinessCriticality = z.infer<typeof businessCriticality>;

export const authMode = z.enum(["maker", "service", "delegated"]);
export type AuthMode = z.infer<typeof authMode>;

export const publicationState = z.enum(["managed", "unmanaged", "none"]);
export type PublicationState = z.infer<typeof publicationState>;

export const scenarioKey = z.enum([
  "normal-employee",
  "contractor-guest",
  "broad-sharing",
  "sensitive-file",
  "agent-action",
]);
export type ScenarioKey = z.infer<typeof scenarioKey>;

export const connectionMode = z.enum([
  "demo-seed",
  "live-graph",
  "google-workspace",
  "slack",
  "salesforce",
  "multi-system",
]);
export type ConnectionMode = z.infer<typeof connectionMode>;

/** Severity bands. Stored lowercase; display layer capitalizes. */
export const band = z.enum(["critical", "high", "medium", "low", "info"]);
export type Band = z.infer<typeof band>;

export const findingStatus = z.enum(["open", "acknowledged", "remediating", "resolved", "accepted-risk"]);
export type FindingStatus = z.infer<typeof findingStatus>;

export const evidenceKind = z.enum([
  "sensitivity",
  "permission",
  "link",
  "membership",
  "label",
  "agent-config",
  "ownership",
  "action",
]);
export type EvidenceKind = z.infer<typeof evidenceKind>;

/** Every evidence item points at one of these source-object types. */
export const sourceObjectType = z.enum([
  "file",
  "folder",
  "drive",
  "site",
  "user",
  "group",
  "permission",
  "link",
  "agent",
  "connector",
  "action",
]);
export type SourceObjectType = z.infer<typeof sourceObjectType>;

export const scoreComponentKey = z.enum([
  "sensitivity",
  "exposureBreadth",
  "externalReach",
  "agentActionRisk",
  "governanceGap",
  "businessCriticality",
  "confidence",
]);
export type ScoreComponentKey = z.infer<typeof scoreComponentKey>;

export const estimatedEffort = z.enum(["low", "medium", "high"]);
export type EstimatedEffort = z.infer<typeof estimatedEffort>;

export const remediationStatus = z.enum(["todo", "done"]);
export type RemediationStatus = z.infer<typeof remediationStatus>;

export const reportFormat = z.enum(["markdown", "html"]);
export type ReportFormat = z.infer<typeof reportFormat>;

/** Background job lifecycle (worker + jobs queue). */
export const jobStatus = z.enum(["queued", "running", "completed", "failed", "canceled"]);
export type JobStatus = z.infer<typeof jobStatus>;
