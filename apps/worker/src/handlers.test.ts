import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MemoryStore } from "@cel/api";
import { beforeAll, describe, expect, it } from "vitest";
import { FilesystemBlobUploader } from "./blob.js";
import { dispatch } from "./handlers.js";

const store = new MemoryStore();

beforeAll(async () => {
  await store.createWorkspace({ id: "ws-1", name: "Test Co" });
});

describe("dispatch", () => {
  it("runs a seed-demo job", async () => {
    const res = await dispatch({ store }, { id: "j1", workspaceId: "ws-1", type: "seed-demo", payload: {} });
    expect(res.ok).toBe(true);
  });

  it("runs a scan job and reports the finding count", async () => {
    const res = await dispatch({ store }, { id: "j2", workspaceId: "ws-1", type: "scan", payload: {} });
    expect(res.ok).toBe(true);
    if (res.ok) expect((res.detail as { findingCount: number }).findingCount).toBe(8);
  });

  it("report-gen uploads the artifact to blob storage and records the url", async () => {
    const dir = mkdtempSync(join(tmpdir(), "cel-blob-"));
    const blob = new FilesystemBlobUploader(dir);
    const res = await dispatch({ store, blob }, { id: "j3", workspaceId: "ws-1", type: "report-gen", payload: { format: "markdown" } });
    expect(res.ok).toBe(true);
    if (res.ok) {
      const detail = res.detail as { artifactUrl: string };
      expect(detail.artifactUrl.startsWith("file://")).toBe(true);
      const path = detail.artifactUrl.replace("file://", "");
      expect(readFileSync(path, "utf8")).toContain("Copilot Exposure Assessment Report");
    }
  });

  it("fails an unknown job type", async () => {
    const res = await dispatch({ store }, { id: "j4", workspaceId: "ws-1", type: "nope", payload: {} });
    expect(res.ok).toBe(false);
  });

  it("captures handler errors as a failed result", async () => {
    const res = await dispatch({ store }, { id: "j5", workspaceId: "ws-missing", type: "scan", payload: {} });
    expect(res.ok).toBe(false);
  });
});
