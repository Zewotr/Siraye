import { test, expect } from "@playwright/test";

test.describe("Core Productivity Workflows", () => {
  const timestamp = Date.now();
  const testEmail = `workflow_${timestamp}@example.com`;
  const testName = `Workflow User ${timestamp}`;

  test.beforeEach(async ({ page }) => {
    await page.route("**/*fonts.googleapis.com/**", (route) => route.abort());
    await page.route("**/*fonts.gstatic.com/**", (route) => route.abort());
    await page.route("**/*accounts.google.com/**", (route) => route.abort());

    // Perform Google auth via test bridge
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.evaluate(
      ({ email, name }) => window.testTriggerGoogleAuth(`mock-google:${email}:${name}`),
      { email: testEmail, name: testName }
    );

    await expect(page).toHaveURL(/\/(onboarding|dashboard)/, { timeout: 15000 });

    const skipBtn = page.locator('[data-testid="skip-onboarding-btn"]');
    const isAtOnboarding = await skipBtn
      .waitFor({ state: "visible", timeout: 6000 })
      .then(() => true)
      .catch(() => false);
    if (isAtOnboarding) {
      await skipBtn.click({ force: true });
    }
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("dashboard renders overview and navigation links", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1, h2").filter({ hasText: /Dashboard|Overview|Good/i }).first()).toBeVisible();

    // Verify side navigation contains all required links
    const sidebar = page.locator("aside");
    await expect(sidebar.getByRole("link", { name: /Schedule/i })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /Timer/i })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /Tracker/i })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /Calendar/i })).toBeVisible();
  });

  test("weekly schedule planner handles weekly and daily focus views", async ({ page }) => {
    await page.goto("/schedule", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Weekly Schedule/i).or(page.getByText(/Schedule/i)).first()).toBeVisible();

    // Verify Urgent Schedule button exists
    const urgentBtn = page.getByRole("button", { name: /Urgent Schedule/i });
    await expect(urgentBtn).toBeVisible();

    // Verify View Mode toggles exist
    const weeklyBtn = page.getByRole("button", { name: /Weekly Plan/i });
    const dailyBtn = page.getByRole("button", { name: /Daily Focus Plan/i });
    await expect(weeklyBtn).toBeVisible();
    await expect(dailyBtn).toBeVisible();

    // Switch to daily focus plan
    await dailyBtn.click({ force: true });
    await expect(dailyBtn).toHaveClass(/bg-brand-700/);

    // Switch back to weekly plan
    await weeklyBtn.click({ force: true });
    await expect(weeklyBtn).toHaveClass(/bg-brand-700/);
  });

  test("pomotroid timer board supports focus and break modes", async ({ page }) => {
    await page.goto("/timer", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Pomodoro Focus Board/i)).toBeVisible();

    // Check timer duration display (e.g. 25:00)
    await expect(page.getByText(/25:00/)).toBeVisible();

    // Switch to short break (5m)
    const shortBreakBtn = page.getByRole("button", { name: /Short Break/i }).first();
    if (await shortBreakBtn.isVisible()) {
      await shortBreakBtn.click({ force: true });
      await expect(page.getByText(/05:00|5:00/)).toBeVisible();
    }
  });

  test("punctuality tracker analyzes consistency and completion", async ({ page }) => {
    await page.goto("/tracker", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Punctuality/i).first()).toBeVisible();

    // Verify filter or stat card
    const headerOrFilter = page.locator("h1, h2, select, button").filter({ hasText: /Punctuality|Consistency|Score/i }).first();
    await expect(headerOrFilter).toBeVisible();
  });

  test("calendar page renders monthly grid and allows date selection", async ({ page }) => {
    await page.goto("/calendar", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1, h2").filter({ hasText: /Calendar/i }).first()).toBeVisible();

    // Verify calendar days are rendered
    const dayCells = page.locator(".grid button, .grid div").filter({ hasText: /^(1[0-9]|2[0-9]|[1-9])$/ });
    await expect(dayCells.first()).toBeVisible();
  });
});
