import { parseTenantGraph } from "@cel/types";
import type { ConnectionMode, PermissionGrant, Principal, Resource, Scenario, TenantGraph } from "@cel/types";
import type { GraphProvider } from "../provider.js";
import type { GraphPage, GraphRequester } from "./requester.js";

/** Least-privilege $select projections — metadata only, never content. */
const SELECT = {
  users: "id,displayName,mail,userPrincipalName,jobTitle,department,accountEnabled,userType",
  groups: "id,displayName,groupTypes,securityEnabled,visibility",
  sites: "id,displayName,name,webUrl",
  items: "id,name,webUrl,folder,file,parentReference",
};

interface GraphUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
  department?: string;
  accountEnabled?: boolean;
  userType?: string;
}
interface GraphGroup {
  id: string;
  displayName?: string;
  groupTypes?: string[];
  securityEnabled?: boolean;
}
interface GraphSite {
  id: string;
  displayName?: string;
  name?: string;
  webUrl?: string;
}
interface GraphDrive {
  id: string;
}
interface GraphItem {
  id: string;
  name?: string;
  webUrl?: string;
  file?: unknown;
  folder?: unknown;
}
interface GraphPermission {
  id: string;
  roles?: string[];
  link?: { scope?: string; type?: string };
  grantedToV2?: { user?: { id?: string }; siteUser?: { id?: string } };
}

export interface Checkpoint {
  phase: string;
  collected: number;
}

export interface MsGraphClientOptions {
  workspace: { id: string; name: string };
  tenantName: string;
  scopes?: string[];
  /** Called after each ingestion phase so a crashed scan can resume. */
  onCheckpoint?: (cp: Checkpoint) => void;
  /** Override the built-in scenario templates. */
  scenarios?: Scenario[];
}

/** The standard exposure scenarios applied to any tenant. */
export const DEFAULT_SCENARIOS: Scenario[] = [
  { id: "sc-normal-employee", key: "normal-employee", title: "Normal employee", description: "What sensitive data can a normal employee reach?", scope: ["sharepoint", "onedrive"], includeAgents: false },
  { id: "sc-contractor-guest", key: "contractor-guest", title: "Contractor / guest", description: "What can a guest still reach?", scope: ["sharepoint"], includeAgents: false },
  { id: "sc-broad-sharing", key: "broad-sharing", title: "Broad sharing", description: "What is exposed through org-wide links or large groups?", scope: ["sharepoint", "onedrive"], includeAgents: false },
  { id: "sc-sensitive-file", key: "sensitive-file", title: "Sensitive file", description: "Which high-sensitivity files are over-reachable?", scope: ["sharepoint", "onedrive"], includeAgents: false },
  { id: "sc-agent-action", key: "agent-action", title: "Agent action", description: "Which agents can take risky actions?", scope: ["agents"], includeAgents: true },
];

const linkScopeFor = (scope?: string): PermissionGrant["linkScope"] =>
  scope === "anonymous" ? "anyone" : scope === "organization" ? "org-wide" : "specific";

/**
 * Live Microsoft Graph provider. Metadata only, least-privilege $select,
 * paged with Retry-After/backoff (in the requester), and checkpointed per phase.
 * Live permission normalization is refined during the sandbox spike (G-run).
 */
export class MsGraphClient implements GraphProvider {
  readonly mode: ConnectionMode = "live-graph";

  constructor(
    private readonly requester: GraphRequester,
    private readonly opts: MsGraphClientOptions,
  ) {}

  private async collect<T>(firstPath: string): Promise<T[]> {
    const out: T[] = [];
    let next: string | undefined = firstPath;
    while (next) {
      const resp: GraphPage<T> = await this.requester.get<T>(next);
      out.push(...resp.value);
      next = resp.nextLink;
    }
    return out;
  }

  async listUsers(): Promise<Principal[]> {
    const users = await this.collect<GraphUser>(`/users?$select=${SELECT.users}&$top=100`);
    return users.map((u) => ({
      id: u.id,
      sourceId: u.id,
      kind: "user" as const,
      displayName: u.displayName ?? u.userPrincipalName ?? u.id,
      email: u.mail ?? u.userPrincipalName,
      isExternal: u.userType === "Guest",
      department: u.department,
      jobTitle: u.jobTitle,
      memberOf: [],
      active: u.accountEnabled ?? true,
    }));
  }

  async listGroups(): Promise<Principal[]> {
    const groups = await this.collect<GraphGroup>(`/groups?$select=${SELECT.groups}&$top=100`);
    return groups.map((g) => ({
      id: g.id,
      sourceId: g.id,
      kind: "group" as const,
      displayName: g.displayName ?? g.id,
      membershipKind: g.groupTypes?.includes("Unified") ? ("m365" as const) : ("security" as const),
      memberOf: [],
      active: true,
    }));
  }

  async listGroupMembers(groupId: string): Promise<Principal[]> {
    const members = await this.collect<GraphUser>(`/groups/${groupId}/members?$select=id&$top=100`);
    return members.map((m) => ({
      id: m.id,
      sourceId: m.id,
      kind: "user" as const,
      displayName: m.displayName ?? m.id,
      memberOf: [],
      active: true,
    }));
  }

  async listSites(): Promise<Resource[]> {
    const sites = await this.collect<GraphSite>(`/sites?search=*&$select=${SELECT.sites}`);
    return sites.map((s) => ({
      id: s.id,
      sourceId: s.id,
      kind: "site" as const,
      name: s.displayName ?? s.name ?? s.id,
      path: s.name,
      url: s.webUrl,
      sensitivityLabel: undefined,
      sensitivityTags: [],
      agentActions: [],
      connectors: [],
    }));
  }

  async listResources(): Promise<Resource[]> {
    const sites = await this.listSites();
    const resources: Resource[] = [...sites];
    for (const site of sites) {
      const drives = await this.collect<GraphDrive>(`/sites/${site.id}/drives?$select=id`);
      for (const drive of drives) {
        const items = await this.collect<GraphItem>(`/drives/${drive.id}/root/children?$select=${SELECT.items}`);
        for (const item of items) {
          if (item.folder) continue;
          resources.push({
            id: item.id,
            sourceId: item.id,
            kind: "file",
            name: item.name ?? item.id,
            url: item.webUrl,
            parentId: site.id,
            sensitivityLabel: undefined,
            sensitivityTags: [],
            agentActions: [],
            connectors: [],
          });
        }
      }
    }
    return resources;
  }

  async listPermissions(): Promise<PermissionGrant[]> {
    const grants: PermissionGrant[] = [];
    const sites = await this.listSites();
    for (const site of sites) {
      const drives = await this.collect<GraphDrive>(`/sites/${site.id}/drives?$select=id`);
      for (const drive of drives) {
        const items = await this.collect<GraphItem>(`/drives/${drive.id}/root/children?$select=id,file`);
        for (const item of items) {
          if (!item.file) continue;
          const perms = await this.collect<GraphPermission>(`/drives/${drive.id}/items/${item.id}/permissions`);
          for (const p of perms) {
            const principalId = p.grantedToV2?.user?.id ?? p.grantedToV2?.siteUser?.id ?? `link-${p.id}`;
            grants.push({
              id: p.id,
              resourceId: item.id,
              principalId,
              right: p.roles?.includes("write") ? "write" : "read",
              via: p.link ? (p.link.scope === "organization" ? "orgwide" : "link") : "direct",
              linkScope: p.link ? linkScopeFor(p.link.scope) : undefined,
              sourcePermissionId: p.id,
            });
          }
        }
      }
    }
    return grants;
  }

  async listScenarios(): Promise<Scenario[]> {
    return this.opts.scenarios ?? DEFAULT_SCENARIOS;
  }

  /** Ingest the full tenant graph (metadata only), checkpointing each phase. */
  async loadTenantGraph(): Promise<TenantGraph> {
    const checkpoint = (phase: string, collected: number): void => this.opts.onCheckpoint?.({ phase, collected });

    const users = await this.listUsers();
    checkpoint("users", users.length);
    const groups = await this.listGroups();
    checkpoint("groups", groups.length);

    // Resolve memberships: set each user's memberOf from group membership.
    const memberOf = new Map<string, string[]>();
    for (const group of groups) {
      const members = await this.listGroupMembers(group.id);
      for (const m of members) {
        const list = memberOf.get(m.id) ?? [];
        list.push(group.id);
        memberOf.set(m.id, list);
      }
    }
    for (const u of users) u.memberOf = memberOf.get(u.id) ?? [];
    checkpoint("memberships", memberOf.size);

    const resources = await this.listResources();
    checkpoint("resources", resources.length);
    const grants = await this.listPermissions();
    checkpoint("permissions", grants.length);

    return parseTenantGraph({
      workspace: { id: this.opts.workspace.id, name: this.opts.workspace.name },
      connection: {
        id: `conn-${this.opts.workspace.id}`,
        workspaceId: this.opts.workspace.id,
        mode: this.mode,
        tenantName: this.opts.tenantName,
        scopes: this.opts.scopes ?? ["User.Read.All", "Group.Read.All", "Sites.Read.All", "Files.Read.All"],
      },
      principals: [...users, ...groups],
      resources,
      grants,
      scenarios: await this.listScenarios(),
    });
  }
}
