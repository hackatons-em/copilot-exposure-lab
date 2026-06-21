import type { ExposurePath, RiskScore } from "@cel/types";
import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Postgres schema for Copilot Exposure Lab, mirroring
 * docs/spec/04_ARCHITECTURE/04_DATA_MODEL.md.
 *
 * Rules: source ids are kept for traceability; no full document content is
 * stored; deleting a workspace cascades to all of its data.
 */

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

export const tenantConnections = pgTable("tenant_connections", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(), // demo-seed | live-graph
  tenantName: text("tenant_name").notNull(),
  scopes: jsonb("scopes").$type<string[]>().default([]).notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

export const principals = pgTable("principals", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  sourceId: text("source_id").notNull(),
  kind: text("kind").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  isExternal: boolean("is_external").default(false),
  department: text("department"),
  jobTitle: text("job_title"),
  memberOf: jsonb("member_of").$type<string[]>().default([]).notNull(),
  membershipKind: text("membership_kind"),
  memberCount: integer("member_count"),
  active: boolean("active").default(true).notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  sourceId: text("source_id").notNull(),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  path: text("path"),
  url: text("url"),
  parentId: text("parent_id"),
  ownerPrincipalId: text("owner_principal_id"),
  sensitivityLabel: text("sensitivity_label"),
  sensitivityTags: jsonb("sensitivity_tags").$type<string[]>().default([]).notNull(),
  businessCriticality: text("business_criticality"),
  agentActions: jsonb("agent_actions").$type<string[]>().default([]).notNull(),
  connectors: jsonb("connectors").$type<string[]>().default([]).notNull(),
  authMode: text("auth_mode"),
  publication: text("publication"),
  syncedAt: timestamp("synced_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

export const permissionGrants = pgTable("permission_grants", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  resourceId: text("resource_id").notNull(),
  principalId: text("principal_id").notNull(),
  right: text("right").notNull(),
  via: text("via").notNull(),
  inheritedFromResourceId: text("inherited_from_resource_id"),
  sourcePermissionId: text("source_permission_id"),
  linkScope: text("link_scope"),
  expirationAt: timestamp("expiration_at", { withTimezone: true, mode: "string" }),
});

export const scenarios = pgTable("scenarios", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  actorPrincipalId: text("actor_principal_id"),
  scope: jsonb("scope").$type<string[]>().default([]).notNull(),
  includeAgents: boolean("include_agents").default(false).notNull(),
});

export const scenarioRuns = pgTable("scenario_runs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  scenarioId: text("scenario_id").notNull(),
  runAt: timestamp("run_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  paths: jsonb("paths").$type<unknown[]>().default([]).notNull(),
  findingIds: jsonb("finding_ids").$type<string[]>().default([]).notNull(),
  summary: text("summary").notNull(),
});

export const findings = pgTable("findings", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  scenarioRunId: text("scenario_run_id"),
  ruleId: text("rule_id").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(), // band
  score: integer("score").notNull(),
  risk: jsonb("risk").$type<RiskScore>(),
  status: text("status").notNull().default("open"),
  resourceId: text("resource_id").notNull(),
  actorPrincipalId: text("actor_principal_id"),
  summary: text("summary").notNull(),
  businessImpact: text("business_impact").notNull(),
  remediationTaskId: text("remediation_task_id"),
  exposurePath: jsonb("exposure_path").$type<ExposurePath>(),
  evidenceIds: jsonb("evidence_ids").$type<string[]>().default([]).notNull(),
  scenarioIds: jsonb("scenario_ids").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

export const evidenceItems = pgTable("evidence_items", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  findingId: text("finding_id").notNull(),
  kind: text("kind").notNull(),
  sourceObjectId: text("source_object_id").notNull(),
  sourceObjectType: text("source_object_type").notNull(),
  statement: text("statement").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

export const remediationTasks = pgTable("remediation_tasks", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  findingId: text("finding_id").notNull(),
  title: text("title").notNull(),
  steps: jsonb("steps").$type<string[]>().default([]).notNull(),
  microsoftControl: text("microsoft_control"),
  graphActionHint: text("graph_action_hint"),
  estimatedEffort: text("estimated_effort").notNull(),
  owner: text("owner"),
  status: text("status").notNull().default("todo"),
  fixVerified: boolean("fix_verified"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  generatedAt: timestamp("generated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  format: text("format").notNull(),
  scenarioRunIds: jsonb("scenario_run_ids").$type<string[]>().default([]).notNull(),
  findingIds: jsonb("finding_ids").$type<string[]>().default([]).notNull(),
  llmSummary: text("llm_summary"),
  artifactUrl: text("artifact_url"),
});

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  at: timestamp("at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  detail: jsonb("detail").$type<Record<string, unknown>>(),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // scan | scenario-run | report-gen | cleanup
  status: text("status").notNull().default("queued"),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  checkpoint: jsonb("checkpoint").$type<Record<string, unknown>>(),
  error: text("error"),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }),
  finishedAt: timestamp("finished_at", { withTimezone: true, mode: "string" }),
});

export const schema = {
  workspaces,
  tenantConnections,
  principals,
  resources,
  permissionGrants,
  scenarios,
  scenarioRuns,
  findings,
  evidenceItems,
  remediationTasks,
  reports,
  auditEvents,
  jobs,
};
