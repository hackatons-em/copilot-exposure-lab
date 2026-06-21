import { expect, test, type Page } from "@playwright/test";

const VISIBLE = { timeout: 15000 } as const;

/**
 * End-to-end walk through the demo flow against a self-booted api + web.
 *
 * The API auto-seeds and scans a ready `ws-demo` workspace on boot, so findings
 * usually already exist. Steps that depend on a fresh scan are best-effort and
 * tolerant, but the landing hero, the overview findings (incl. a Critical), and
 * the critical finding's evidence chain are asserted hard.
 */

/** Ensure the overview has findings — run an assessment only if the empty state is showing. */
async function ensureAssessment(page: Page): Promise<void> {
  const runButton = page.getByRole("button", { name: /run exposure assessment/i });
  if (await runButton.isVisible().catch(() => false)) {
    await runButton.click();
  }
  // Whether pre-seeded or just-scanned, the critical badge should appear.
  await expect(page.getByText("Critical", { exact: true }).first()).toBeVisible({ timeout: 30000 });
}

test("landing hero and CTA into the lab", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Run a Copilot Exposure Drill Before Rollout/i }),
  ).toBeVisible(VISIBLE);

  // CTA navigates to the overview.
  await page.getByRole("link", { name: /run an exposure assessment/i }).click();
  await expect(page).toHaveURL(/\/overview$/, VISIBLE);
  await expect(page.getByRole("heading", { name: /^Overview$/ })).toBeVisible(VISIBLE);
});

test("overview shows findings including at least one Critical", async ({ page }) => {
  await page.goto("/overview");
  await ensureAssessment(page);

  // The top exposure paths table lists findings; the org-wide salary link is critical.
  await expect(
    page.getByRole("link", { name: /shared through an organization-wide link/i }).first(),
  ).toBeVisible(VISIBLE);
  await expect(page.getByText("Critical", { exact: true }).first()).toBeVisible(VISIBLE);
});

test("critical finding detail shows the evidence chain and remediation", async ({ page }) => {
  await page.goto("/overview");
  await ensureAssessment(page);

  // Open the critical finding from the overview table.
  await page
    .getByRole("link", { name: /shared through an organization-wide link/i })
    .first()
    .click();

  await expect(page).toHaveURL(/\/findings\/.+/, VISIBLE);

  // Evidence chain / exposure path references the principal and the sensitive file.
  await expect(page.getByText("Bob Novak").first()).toBeVisible(VISIBLE);
  await expect(page.getByText("2026_salary_plan.xlsx").first()).toBeVisible(VISIBLE);

  // Remediation section is present.
  await expect(page.getByRole("heading", { name: /^Remediation$/i })).toBeVisible(VISIBLE);
});

test("reports page generates a downloadable report", async ({ page }) => {
  await page.goto("/reports");

  await page.getByRole("button", { name: /generate report/i }).click();

  // A download link appears once the report is ready (best-effort, tolerant timeout).
  await expect(page.getByRole("link", { name: /download/i }).first()).toBeVisible({ timeout: 20000 });
});
