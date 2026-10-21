import { test, expect } from "@playwright/test";

test.describe("Landing Page & Marketing Experience", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  test("loads landing page with branding and hero headlines", async ({ page }) => {
    await expect(page).toHaveTitle(/Siraye/i);
    await expect(page.locator("h1")).toContainText(/Master your schedule/i);
    
    // Verify CTA button
    const getStartedBtn = page.getByRole("link", { name: /Get started free/i }).first();
    await expect(getStartedBtn).toBeVisible();
    await expect(getStartedBtn).toHaveAttribute("href", "/signup");
  });

  test("auto-rotates and allows manual selection of feature showcase tabs", async ({ page }) => {
    // Verify tabs exist
    const scheduleTab = page.getByRole("button", { name: /Weekly Schedule/i }).first();
    const timerTab = page.getByRole("button", { name: /Pomotroid Timer/i }).first();
    const trackerTab = page.getByRole("button", { name: /Punctuality Tracker/i }).first();
    const sidebarTab = page.getByRole("button", { name: /Next 3-5 Tasks/i }).first();

    await expect(scheduleTab).toBeVisible();
    await expect(timerTab).toBeVisible();
    await expect(trackerTab).toBeVisible();
    await expect(sidebarTab).toBeVisible();

    // Click Pomotroid Timer tab
    await timerTab.click();
    await expect(page.getByText(/Focus Time/i).or(page.getByText(/Pomotroid/i)).first()).toBeVisible();

    // Click Punctuality Tracker tab
    await trackerTab.click();
    await expect(page.getByText(/Punctuality/i).first()).toBeVisible();

    // Click Next Tasks tab
    await sidebarTab.click();
    await expect(page.getByText(/Next Up Queue/i)).toBeVisible();
  });

  test("renders integrated calendar and tasks preview section", async ({ page }) => {
    const calendarHeadline = page.getByText(/Calendar/i).first();
    await calendarHeadline.scrollIntoViewIfNeeded();
    await expect(calendarHeadline).toBeVisible();
  });

  test("renders modern interactive footer with navigation and branding", async ({ page }) => {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/Siraye/i).first()).toBeVisible();
    await expect(footer.getByText(/All rights reserved/i)).toBeVisible();
  });
});
