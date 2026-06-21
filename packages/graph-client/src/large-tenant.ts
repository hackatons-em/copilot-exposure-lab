import { parseTenantGraph, type PermissionGrant, type Principal, type Resource, type Scenario, type TenantGraph } from "@cel/types";
import { DEFAULT_SCENARIOS } from "./graph/ms-graph-client.js";

/** Deterministic PRNG (mulberry32) — same seed → same tenant, every run. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LargeTenantOptions {
  seed?: number;
  users?: number;
  groups?: number;
  sites?: number;
  filesPerSite?: number;
}

const SENSITIVE_FILES = [
  "salary_band_review.xlsx",
  "2026_compensation_plan.xlsx",
  "master_services_agreement.pdf",
  "board_minutes.docx",
  "acquisition_model.xlsx",
  "customer_contract_bankco.pdf",
  "api_tokens_rotation.docx",
  "incident_postmortem.docx",
  "payroll_export.csv",
  "legal_settlement_terms.pdf",
];
const GENERIC_FILES = ["roadmap.docx", "meeting_notes.docx", "design_spec.pdf", "budget_draft.xlsx", "onboarding.pptx", "team_sync.docx"];
const SENSITIVE_SITE_NAMES = ["HR Portal", "Finance", "Legal", "Board Room", "Security Team", "Customer Contracts", "Payroll", "M&A"];

/**
 * A seeded, deterministic synthetic enterprise tenant — proof the engine runs at
 * real scale (≈1k users, ≈100 groups, ≈50 sites, ≈3k files, ≈5k grants), with
 * realistic oversharing archetypes so every rule fires many times. Validated
 * against @cel/types. No Math.random / Date — stable output + benchmark numbers.
 */
export function generateLargeTenant(opts: LargeTenantOptions = {}): TenantGraph {
  const r = rng(opts.seed ?? 1337);
  const userCount = opts.users ?? 1000;
  const groupCount = opts.groups ?? 100;
  const siteCount = opts.sites ?? 50;
  const filesPerSite = opts.filesPerSite ?? 100;
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]!;
  const intIn = (lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1));

  const principals: Principal[] = [];
  const everyoneId = "g-everyone";
  principals.push({
    id: everyoneId,
    sourceId: everyoneId,
    kind: "group",
    displayName: "Everyone Except External Users",
    membershipKind: "everyone-except-external",
    memberCount: userCount,
    memberOf: [],
    active: true,
  });

  // Department groups (some large enough to be "broad").
  const deptGroups: string[] = [];
  for (let g = 0; g < groupCount; g += 1) {
    const id = `g-${g}`;
    deptGroups.push(id);
    principals.push({
      id,
      sourceId: id,
      kind: "group",
      displayName: `Dept Group ${g}`,
      membershipKind: g % 3 === 0 ? "m365" : "security",
      memberCount: g < 12 ? intIn(30, 300) : intIn(3, 24),
      memberOf: [],
      active: true,
    });
  }

  // Users: ~5% external guests, ~3% inactive (departed).
  for (let u = 0; u < userCount; u += 1) {
    const external = r() < 0.05;
    const groups = external ? [] : [everyoneId, ...Array.from({ length: intIn(1, 3) }, () => pick(deptGroups))];
    principals.push({
      id: `u-${u}`,
      sourceId: `u-${u}`,
      kind: "user",
      displayName: `User ${u}`,
      email: `user${u}@${external ? "contoso-partners.com" : "bigcorp.com"}`,
      isExternal: external,
      memberOf: [...new Set(groups)],
      active: r() >= 0.03,
    });
  }

  // Sites (some sensitive) + files.
  const resources: Resource[] = [];
  const sensitiveSiteIds: string[] = [];
  for (let s = 0; s < siteCount; s += 1) {
    const sensitive = s < SENSITIVE_SITE_NAMES.length;
    const id = `s-${s}`;
    if (sensitive) sensitiveSiteIds.push(id);
    resources.push({
      id,
      sourceId: id,
      kind: "site",
      name: sensitive ? SENSITIVE_SITE_NAMES[s]! : `Team Site ${s}`,
      path: `/sites/site${s}`,
      sensitivityLabel: sensitive ? "Confidential" : "General",
      sensitivityTags: sensitive ? ["confidential"] : [],
      businessCriticality: sensitive ? "high" : "low",
      agentActions: [],
      connectors: [],
    });
    for (let f = 0; f < filesPerSite; f += 1) {
      const isSensitiveFile = sensitive ? r() < 0.5 : r() < 0.08;
      const name = isSensitiveFile ? pick(SENSITIVE_FILES) : pick(GENERIC_FILES);
      const missingLabel = isSensitiveFile && r() < 0.4;
      resources.push({
        id: `f-${s}-${f}`,
        sourceId: `f-${s}-${f}`,
        kind: "file",
        name,
        path: `/sites/site${s}/${name}`,
        parentId: id,
        sensitivityLabel: missingLabel ? null : isSensitiveFile ? "Confidential" : "General",
        sensitivityTags: isSensitiveFile ? ["confidential"] : [],
        businessCriticality: isSensitiveFile ? "high" : "low",
        agentActions: [],
        connectors: [],
      });
    }
  }

  // Agents — some risky (mail.send / egress connectors) + some departed-owner.
  const departedUser = `u-${intIn(0, userCount - 1)}`;
  principals.push({
    id: "u-departed-maker",
    sourceId: "u-departed-maker",
    kind: "user",
    displayName: "Former Maker",
    memberOf: [],
    active: false,
  });
  for (let a = 0; a < 10; a += 1) {
    const risky = a % 2 === 0;
    resources.push({
      id: `a-${a}`,
      sourceId: `a-${a}`,
      kind: "agent",
      name: `Copilot Agent ${a}`,
      ownerPrincipalId: a % 3 === 0 ? "u-departed-maker" : departedUser,
      sensitivityLabel: null,
      sensitivityTags: ["agent"],
      businessCriticality: "medium",
      agentActions: risky ? ["mail.send", "external.connector"] : ["http.request"],
      connectors: risky ? ["Office365Outlook", "HTTPWebhook", "SQLServer"] : ["HTTPWithAzureAD"],
      authMode: "maker",
      publication: "unmanaged",
    });
  }

  // Grants (~5k): owners, dept reads, org-wide links on sensitive files, broad
  // inherited reads on sensitive sites, stale guest access.
  const grants: PermissionGrant[] = [];
  let gid = 0;
  const add = (g: Omit<PermissionGrant, "id">): void => {
    grants.push({ id: `pg-${gid++}`, ...g });
  };
  const files = resources.filter((x) => x.kind === "file");
  const sensitiveFiles = files.filter((x) => x.sensitivityTags.includes("confidential"));
  const externals = principals.filter((p) => p.kind === "user" && p.isExternal);
  // "Narrow" groups (idx >= 12) sit below BROAD_GROUP_THRESHOLD, so granting them
  // read is benign ACL noise — realistic enterprise scale without false findings.
  const narrowGroups = deptGroups.filter((_, i) => i >= 12);
  const realUsers = principals.filter((p) => p.kind === "user" && !p.isExternal && p.active);
  const pickNarrow = (): string => narrowGroups[intIn(0, narrowGroups.length - 1)] ?? pick(deptGroups);
  const pickUser = (): string => realUsers[intIn(0, realUsers.length - 1)]!.id;

  // Each site gets a handful of dept-group reads (real tenants have layered ACLs).
  for (let s = 0; s < siteCount; s += 1) {
    const reads = intIn(2, 4);
    for (let i = 0; i < reads; i += 1) add({ resourceId: `s-${s}`, principalId: pickNarrow(), right: "read", via: "direct" });
    if (s < 12) add({ resourceId: `s-${s}`, principalId: deptGroups[s % deptGroups.length]!, right: "read", via: "direct" });
  }
  // Realistic per-file ACL entries: most files carry 1-2 narrow group / single-user
  // grants. These stay below the broad-group threshold and target no broad audience,
  // so they add believable scale (grants > resources) but create no new findings.
  for (const f of files) {
    if (r() < 0.85) add({ resourceId: f.id, principalId: pickNarrow(), right: r() < 0.3 ? "write" : "read", via: "inherited" });
    if (r() < 0.35) add({ resourceId: f.id, principalId: pickUser(), right: "read", via: "direct" });
  }
  // A subset of sensitive sites grant whole-org read (inherited-broad-read on their files).
  for (const sid of sensitiveSiteIds) {
    if (r() < 0.5) add({ resourceId: sid, principalId: everyoneId, right: "read", via: "direct" });
  }
  // Org-wide links on a sample of sensitive files (org-wide-link).
  for (const f of sensitiveFiles) {
    if (r() < 0.12) add({ resourceId: f.id, principalId: everyoneId, right: "read", via: "orgwide", linkScope: "org-wide" });
  }
  // Broad department group grants directly on sensitive files (broad-dept-access).
  for (const f of sensitiveFiles) {
    if (r() < 0.15) add({ resourceId: f.id, principalId: deptGroups[intIn(0, 11)]!, right: "read", via: "direct" });
  }
  // Stale guest access to confidential sites (stale-external-access).
  for (const sid of sensitiveSiteIds) {
    const guest = externals[intIn(0, externals.length - 1)];
    if (guest) add({ resourceId: sid, principalId: guest.id, right: "read", via: "guest", expirationAt: "2025-09-30T00:00:00.000Z" });
  }

  const scenarios: Scenario[] = DEFAULT_SCENARIOS.map((s) => ({ ...s }));
  const firstUser = principals.find((p) => p.kind === "user");
  const normal = scenarios.find((s) => s.key === "normal-employee");
  if (normal && firstUser) normal.actorPrincipalId = firstUser.id;

  return parseTenantGraph({
    workspace: { id: "ws-enterprise", name: "BigCorp Industries (synthetic)" },
    connection: {
      id: "conn-enterprise",
      workspaceId: "ws-enterprise",
      mode: "demo-seed",
      tenantName: "bigcorp.onmicrosoft.com",
      scopes: ["User.Read.All", "Group.Read.All", "Sites.Read.All", "Files.Read.All"],
    },
    principals,
    resources,
    grants,
    scenarios,
  });
}
