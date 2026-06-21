import type { ControlRef, ThreatMapping, ThreatTechnique } from "@cel/types";

/**
 * Deterministic threat-framework mapping, keyed off the rule — the same way
 * remediation is. Each rule maps to the MITRE ATT&CK technique(s) the exposure
 * enables and the control-framework safeguard(s) that address it. This is data,
 * not judgement: rules detect, the scorer scores, this catalog contextualizes.
 *
 * Pure governance gaps (e.g. a missing sensitivity label) have no adversary
 * technique of their own — they enable others — so `techniques` is empty and only
 * controls apply. We keep that honest rather than inventing a technique.
 */

/** Build an ATT&CK technique with its canonical URL ("T1213.002" → …/T1213/002/). */
function tech(id: string, name: string, tactic: string): ThreatTechnique {
  return { id, name, tactic, url: `https://attack.mitre.org/techniques/${id.replace(".", "/")}/` };
}

function control(framework: string, id: string, name: string): ControlRef {
  return { framework, id, name };
}

// Common controls reused across rules.
const AC6 = control("NIST 800-53", "AC-6", "Least Privilege");
const AC3 = control("NIST 800-53", "AC-3", "Access Enforcement");
const AC2 = control("NIST 800-53", "AC-2", "Account Management");
const SC7 = control("NIST 800-53", "SC-7", "Boundary Protection");
const CM7 = control("NIST 800-53", "CM-7", "Least Functionality");
const RA2 = control("NIST 800-53", "RA-2", "Security Categorization");
const CISA_SHARING = control("CISA SCuBA", "M365 sharing", "Restrict external & org-wide sharing of sensitive content");
const CISA_GUEST = control("CISA SCuBA", "M365 guest", "Review and expire external guest access");

// ATT&CK techniques reused across rules.
const T1213_SP = tech("T1213.002", "Data from Information Repositories: SharePoint", "Collection");
const T1530 = tech("T1530", "Data from Cloud Storage", "Collection");
const T1078_CLOUD = tech("T1078.004", "Valid Accounts: Cloud Accounts", "Persistence");
const T1567 = tech("T1567", "Exfiltration Over Web Service", "Exfiltration");

const EMPTY: ThreatMapping = { techniques: [], controls: [] };

const CATALOG: Record<string, ThreatMapping> = {
  "org-wide-link": {
    techniques: [T1213_SP, T1530],
    controls: [AC6, AC3, CISA_SHARING],
  },
  "broad-dept-access": {
    techniques: [T1213_SP],
    controls: [AC6, AC3],
  },
  "inherited-broad-read": {
    techniques: [T1213_SP, T1530],
    controls: [AC6, AC3],
  },
  "stale-external-access": {
    techniques: [T1078_CLOUD, T1530],
    controls: [AC2, CISA_GUEST],
  },
  "missing-label": {
    // Governance gap: no technique of its own; it weakens classification and
    // enables collection by hiding sensitivity.
    techniques: [],
    controls: [RA2, control("CISA SCuBA", "Purview", "Apply and enforce sensitivity labels")],
  },
  "agent-send-action": {
    techniques: [T1567],
    controls: [AC6, SC7, CM7],
  },
  "orphaned-agent-owner": {
    techniques: [tech("T1078", "Valid Accounts", "Persistence")],
    controls: [AC2, CM7],
  },
  "risky-connector": {
    techniques: [T1567],
    controls: [SC7, CM7],
  },
};

/** The threat mapping for a rule. Unknown rule → empty (never throws). */
export function threatFor(ruleId: string): ThreatMapping {
  return CATALOG[ruleId] ?? EMPTY;
}

export interface ThreatModelRow {
  ruleId: string;
  title: string;
  threat: ThreatMapping;
}

export interface ThreatModel {
  rows: ThreatModelRow[];
  /** Distinct techniques covered across all rules, sorted by id. */
  techniques: ThreatTechnique[];
  /** Distinct controls referenced across all rules, sorted by framework + id. */
  controls: ControlRef[];
}

/**
 * The full rules × techniques × controls matrix — the data behind the threat-model
 * page and the report's coverage section. Pass the rule registry (id + title) so
 * this stays in lockstep with what actually runs.
 */
export function buildThreatModel(rules: readonly { id: string; title: string }[]): ThreatModel {
  const rows: ThreatModelRow[] = rules.map((r) => ({ ruleId: r.id, title: r.title, threat: threatFor(r.id) }));

  const techById = new Map<string, ThreatTechnique>();
  const ctrlByKey = new Map<string, ControlRef>();
  for (const row of rows) {
    for (const t of row.threat.techniques) techById.set(t.id, t);
    for (const c of row.threat.controls) ctrlByKey.set(`${c.framework}|${c.id}`, c);
  }

  const techniques = [...techById.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  const controls = [...ctrlByKey.values()].sort((a, b) => {
    const key = `${a.framework}|${a.id}`.localeCompare(`${b.framework}|${b.id}`);
    return key;
  });
  return { rows, techniques, controls };
}
