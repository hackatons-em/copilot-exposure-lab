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

test("overview gauge shows the peer percentile", async ({ page }) => {
  await page.goto("/overview");
  await ensureAssessment(page);
  await expect(page.getByText(/more exposed than/i).first()).toBeVisible(VISIBLE);
});

test("threat model page renders the rules × ATT&CK matrix", async ({ page }) => {
  await page.goto("/threat-model");
  await expect(page.getByRole("heading", { name: /^Threat model$/ })).toBeVisible(VISIBLE);
  await expect(page.getByText("Coverage matrix").first()).toBeVisible(VISIBLE);
  // A known MITRE technique id from the catalog.
  await expect(page.getByText("T1213.002").first()).toBeVisible(VISIBLE);
});

test("finding detail generates an advisory fix script + shows threat/confidence", async ({ page }) => {
  await page.goto("/overview");
  await ensureAssessment(page);
  await page
    .getByRole("link", { name: /shared through an organization-wide link/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/findings\/.+/, VISIBLE);

  // Threat & controls panel + confidence are folded into the detail.
  await expect(page.getByRole("heading", { name: /Threat & controls/i })).toBeVisible(VISIBLE);
  await expect(page.getByText(/Confidence/).first()).toBeVisible(VISIBLE);

  // Lazy "Generate fix script" → a real cmdlet appears.
  await page.getByRole("button", { name: /generate fix script/i }).click();
  await expect(page.getByText(/Remove-MgDriveItemPermission/).first()).toBeVisible(VISIBLE);
});

test("marketing trust + research pages render", async ({ page }) => {
  await page.goto("/security");
  await expect(page.getByText("User.Read.All").first()).toBeVisible(VISIBLE);

  await page.goto("/research");
  await expect(
    page.getByRole("heading", { name: /The State of Copilot Exposure/i }),
  ).toBeVisible(VISIBLE);
});

test("landing shows the product tour and pricing teaser", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /The whole drill, on one screen/i })).toBeVisible(VISIBLE);
  // Tour tab rail + pricing teaser CTA.
  await expect(page.getByRole("button", { name: /Attack graph/i }).first()).toBeVisible(VISIBLE);
  await expect(page.getByRole("link", { name: /See full pricing/i })).toBeVisible(VISIBLE);
});

test("product tour switches panels on tab click", async ({ page }) => {
  await page.goto("/");
  const tour = page.locator("#product");
  await tour.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Find \+ Fix/i }).first().click();
  // The fix-script specimen shows a real cmdlet once that tab is active.
  await expect(page.getByText(/Remove-MgDriveItemPermission/).first()).toBeVisible(VISIBLE);
});

test("/product page tours every surface", async ({ page }) => {
  await page.goto("/product");
  await expect(page.getByRole("heading", { name: /Every surface of the drill/i })).toBeVisible(VISIBLE);
  await expect(page.getByRole("heading", { name: /The exact path to the data/i })).toBeVisible(VISIBLE);
});

test("/pricing shows the three tiers and comparison", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: /Start free\. Scale to always-on\./i })).toBeVisible(VISIBLE);
  for (const tier of ["Free", "Team", "Enterprise"]) {
    await expect(page.getByRole("heading", { name: new RegExp(`^${tier}$`) }).first()).toBeVisible(VISIBLE);
  }
  await expect(page.getByRole("heading", { name: /Compare plans/i })).toBeVisible(VISIBLE);
});
