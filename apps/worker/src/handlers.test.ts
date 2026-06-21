import { MemoryStore } from "@cel/api";
import { beforeAll, describe, expect, it } from "vitest";
import { dispatch } from "./handlers.js";

const store = new MemoryStore();

beforeAll(async () => {
  await store.createWorkspace({ id: "ws-1", name: "Test Co" });
});

describe("dispatch", () => {
  it("runs a seed-demo job", async () => {
    const res = await dispatch(store, { id: "j1", workspaceId: "ws-1", type: "seed-demo", payload: {} });
    expect(res.ok).toBe(true);
  });

  it("runs a scan job and reports the finding count", async () => {
    const res = await dispatch(store, { id: "j2", workspaceId: "ws-1", type: "scan", payload: {} });
    expect(res.ok).toBe(true);
    if (res.ok) expect((res.detail as { findingCount: number }).findingCount).toBe(8);
  });

  it("runs a report-gen job after a scan", async () => {
    const res = await dispatch(store, { id: "j3", workspaceId: "ws-1", type: "report-gen", payload: { format: "markdown" } });
    expect(res.ok).toBe(true);
  });

  it("fails an unknown job type", async () => {
    const res = await dispatch(store, { id: "j4", workspaceId: "ws-1", type: "nope", payload: {} });
    expect(res.ok).toBe(false);
  });

  it("captures handler errors as a failed result", async () => {
    const res = await dispatch(store, { id: "j5", workspaceId: "ws-missing", type: "scan", payload: {} });
    expect(res.ok).toBe(false);
  });
});
