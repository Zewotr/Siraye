import { test, expect } from "@playwright/test";

test.describe("Authentication Flows (Google OAuth & Credentials)", () => {
  const timestamp = Date.now();
  const credentialsEmail = `e2e_user_${timestamp}@example.com`;
  const credentialsPassword = "StrongPassword123!";

  test.beforeEach(async ({ page }) => {
    await page.route("**/*fonts.googleapis.com/**", (route) => route.abort());
    await page.route("**/*fonts.gstatic.com/**", (route) => route.abort());
    await page.route("**/*accounts.google.com/**", (route) => route.abort());
  });

  test("mode switcher toggles between Sign In and Sign Up", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Welcome back/i);

    // Click Sign Up tab
    const signUpTab = page.locator('[data-testid="tab-signup"]');
    await expect(signUpTab).toBeVisible();
    await signUpTab.click({ force: true });
    await expect(page.locator("h1")).toContainText(/Create your account/i);
    await expect(page.locator("#signup-name")).toBeVisible();

    // Click Sign In tab
    const signInTab = page.locator('[data-testid="tab-signin"]');
    await expect(signInTab).toBeVisible();
    await signInTab.click({ force: true });
    await expect(page.locator("h1")).toContainText(/Welcome back/i);
    await expect(page.locator("#login-identifier")).toBeVisible();
  });

  test("Google Sign-In and Sign-Up integration flow", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    // Verify Google Auth button or container is rendered
    const googleBtn = page.locator('[data-testid="google-auth-container"], [data-testid="google-auth-button"]');
    await expect(googleBtn).toBeVisible();

    // Trigger Google Auth verification
    const googleEmail = `google_${timestamp}@example.com`;
    const googleName = `Google Tester ${timestamp}`;
    await page.evaluate(
      ({ email, name }) => window.testTriggerGoogleAuth(`mock-google:${email}:${name}`),
      { email: googleEmail, name: googleName }
    );

    // User should be authenticated and routed to onboarding or dashboard
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/, { timeout: 15000 });

    // If on onboarding, wait for skip button and click it
    const skipBtn = page.locator('[data-testid="skip-onboarding-btn"]');
    const isAtOnboarding = await skipBtn
      .waitFor({ state: "visible", timeout: 6000 })
      .then(() => true)
      .catch(() => false);
    if (isAtOnboarding) {
      await skipBtn.click({ force: true });
    }
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Verify user menu button shows logged-in status
    const userMenu = page.locator('[data-testid="user-menu-button"]');
    await expect(userMenu).toBeVisible();

    // Open user menu and Sign Out
    await userMenu.click({ force: true });
    const signOutBtn = page.locator('[data-testid="sign-out-button"]');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click({ force: true });

    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("Credentials Sign-Up, Onboarding, and Sign-In flow", async ({ page }) => {
    // 1. Sign Up
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await page.locator("#signup-name").fill("Credentials Tester");
    await page.locator("#signup-email").fill(credentialsEmail);
    await page.locator("#signup-password").fill(credentialsPassword);
    await page.locator("#signup-confirm-password").fill(credentialsPassword);
    await page.locator('[data-testid="signup-submit-button"]').click({ force: true });

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/, { timeout: 15000 });

    // Finish onboarding
    const skipBtn = page.locator('[data-testid="skip-onboarding-btn"]');
    const isAtOnboarding = await skipBtn
      .waitFor({ state: "visible", timeout: 6000 })
      .then(() => true)
      .catch(() => false);
    if (isAtOnboarding) {
      await skipBtn.click({ force: true });
    }
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 2. Sign Out
    const userMenu = page.locator('[data-testid="user-menu-button"]');
    await expect(userMenu).toBeVisible();
    await userMenu.click({ force: true });
    await page.locator('[data-testid="sign-out-button"]').click({ force: true });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });

    // 3. Sign In with newly created credentials
    await expect(page.locator("#login-identifier")).toBeVisible({ timeout: 10000 });
    await page.locator("#login-identifier").fill(credentialsEmail);
    await page.locator("#login-password").fill(credentialsPassword);
    await page.locator('[data-testid="login-submit-button"]').click({ force: true });

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("h1, h2").filter({ hasText: /Dashboard|Overview|Good/i }).first()).toBeVisible();
  });
});
