import { describe, expect, it } from "vitest";
import { tenantPercentile } from "./percentile.js";

describe("tenantPercentile", () => {
  it("places a clean tenant near the bottom and a catastrophic one near the top", () => {
    expect(tenantPercentile(0).worseThanPct).toBe(0);
    expect(tenantPercentile(98).worseThanPct).toBeGreaterThanOrEqual(90);
    expect(tenantPercentile(98).worseThanPct).toBeLessThan(100);
  });

  it("is monotonic — a higher score is never a lower percentile", () => {
    let prev = -1;
    for (let s = 0; s <= 100; s += 5) {
      const p = tenantPercentile(s).worseThanPct;
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it("flags itself synthetic and reports the sample size", () => {
    const p = tenantPercentile(50);
    expect(p.synthetic).toBe(true);
    expect(p.sampleSize).toBeGreaterThan(0);
  });
});
