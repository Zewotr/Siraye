# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication Flows (Google OAuth & Credentials) >> Google Sign-In and Sign-Up integration flow
- Location: e2e/auth.spec.js:33:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/(onboarding|dashboard)/
Error: Test timeout of 30000ms exceeded.

Call log:
  - Expect "toHaveURL" with timeout 15000ms
  - Test timeout of 30000ms exceeded.

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "siraye" [ref=e6] [cursor=pointer]:
        - /url: /
      - navigation [ref=e12]:
        - link "Features" [ref=e13] [cursor=pointer]:
          - /url: "#features"
        - link "Weekly Planner" [ref=e14] [cursor=pointer]:
          - /url: /schedule
        - link "Pomotroid Timer" [ref=e15] [cursor=pointer]:
          - /url: /timer
        - link "Punctuality Tracker" [ref=e16] [cursor=pointer]:
          - /url: /tracker
      - generic [ref=e17]:
        - link "Sign in" [ref=e18] [cursor=pointer]:
          - /url: /login
        - link "Get started" [ref=e19] [cursor=pointer]:
          - /url: /signup
  - main [ref=e20]:
    - generic [ref=e22]:
      - generic [ref=e23]:
        - heading "Welcome back" [level=1] [ref=e28]
        - paragraph [ref=e29]: Sign in with your name, email, or Google to continue.
      - generic [ref=e30]:
        - button "Sign In" [ref=e31] [cursor=pointer]
        - button "Sign Up" [ref=e32] [cursor=pointer]
      - generic [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]: Name or Email
          - textbox "Name or Email" [active] [ref=e37]:
            - /placeholder: e.g. Alex or alex@example.com
        - generic [ref=e38]:
          - generic [ref=e39]: Password
          - generic [ref=e41]:
            - textbox "Password" [ref=e42]:
              - /placeholder: ••••••••
            - button "Show password" [ref=e43] [cursor=pointer]
        - button "Sign in" [ref=e47] [cursor=pointer]
      - generic [ref=e48]: Or continue with
      - button "Sign in with Google" [ref=e53] [cursor=pointer]
      - paragraph [ref=e61]:
        - text: Don't have an account yet?
        - button "Sign up for free" [ref=e62] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | test.describe("Authentication Flows (Google OAuth & Credentials)", () => {
  4   |   const timestamp = Date.now();
  5   |   const credentialsEmail = `e2e_user_${timestamp}@example.com`;
  6   |   const credentialsPassword = "StrongPassword123!";
  7   | 
  8   |   test.beforeEach(async ({ page }) => {
  9   |     await page.route("**/*fonts.googleapis.com/**", (route) => route.abort());
  10  |     await page.route("**/*fonts.gstatic.com/**", (route) => route.abort());
  11  |     await page.route("**/*accounts.google.com/**", (route) => route.abort());
  12  |   });
  13  | 
  14  |   test("mode switcher toggles between Sign In and Sign Up", async ({ page }) => {
  15  |     await page.goto("/login", { waitUntil: "domcontentloaded" });
  16  |     await expect(page.locator("h1")).toContainText(/Welcome back/i);
  17  | 
  18  |     // Click Sign Up tab
  19  |     const signUpTab = page.locator('[data-testid="tab-signup"]');
  20  |     await expect(signUpTab).toBeVisible();
  21  |     await signUpTab.click({ force: true });
  22  |     await expect(page.locator("h1")).toContainText(/Create your account/i);
  23  |     await expect(page.locator("#signup-name")).toBeVisible();
  24  | 
  25  |     // Click Sign In tab
  26  |     const signInTab = page.locator('[data-testid="tab-signin"]');
  27  |     await expect(signInTab).toBeVisible();
  28  |     await signInTab.click({ force: true });
  29  |     await expect(page.locator("h1")).toContainText(/Welcome back/i);
  30  |     await expect(page.locator("#login-identifier")).toBeVisible();
  31  |   });
  32  | 
  33  |   test("Google Sign-In and Sign-Up integration flow", async ({ page }) => {
  34  |     await page.goto("/login", { waitUntil: "domcontentloaded" });
  35  | 
  36  |     // Verify Google Auth button or container is rendered
  37  |     const googleBtn = page.locator('[data-testid="google-auth-container"], [data-testid="google-auth-button"]');
  38  |     await expect(googleBtn).toBeVisible();
  39  | 
  40  |     // Trigger Google Auth verification
  41  |     const googleEmail = `google_${timestamp}@example.com`;
  42  |     const googleName = `Google Tester ${timestamp}`;
  43  |     await page.evaluate(
  44  |       ({ email, name }) => window.testTriggerGoogleAuth(`mock-google:${email}:${name}`),
  45  |       { email: googleEmail, name: googleName }
  46  |     );
  47  | 
  48  |     // User should be authenticated and routed to onboarding or dashboard
> 49  |     await expect(page).toHaveURL(/\/(onboarding|dashboard)/, { timeout: 15000 });
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  50  | 
  51  |     // If on onboarding, wait for skip button and click it
  52  |     const skipBtn = page.locator('[data-testid="skip-onboarding-btn"]');
  53  |     const isAtOnboarding = await skipBtn
  54  |       .waitFor({ state: "visible", timeout: 6000 })
  55  |       .then(() => true)
  56  |       .catch(() => false);
  57  |     if (isAtOnboarding) {
  58  |       await skipBtn.click({ force: true });
  59  |     }
  60  |     await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  61  | 
  62  |     // Verify user menu button shows logged-in status
  63  |     const userMenu = page.locator('[data-testid="user-menu-button"]');
  64  |     await expect(userMenu).toBeVisible();
  65  | 
  66  |     // Open user menu and Sign Out
  67  |     await userMenu.click({ force: true });
  68  |     const signOutBtn = page.locator('[data-testid="sign-out-button"]');
  69  |     await expect(signOutBtn).toBeVisible();
  70  |     await signOutBtn.click({ force: true });
  71  | 
  72  |     // Verify redirect to login
  73  |     await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  74  |   });
  75  | 
  76  |   test("Credentials Sign-Up, Onboarding, and Sign-In flow", async ({ page }) => {
  77  |     // 1. Sign Up
  78  |     await page.goto("/signup", { waitUntil: "domcontentloaded" });
  79  |     await page.locator("#signup-name").fill("Credentials Tester");
  80  |     await page.locator("#signup-email").fill(credentialsEmail);
  81  |     await page.locator("#signup-password").fill(credentialsPassword);
  82  |     await page.locator("#signup-confirm-password").fill(credentialsPassword);
  83  |     await page.locator('[data-testid="signup-submit-button"]').click({ force: true });
  84  | 
  85  |     // Should redirect to onboarding
  86  |     await expect(page).toHaveURL(/\/(onboarding|dashboard)/, { timeout: 15000 });
  87  | 
  88  |     // Finish onboarding
  89  |     const skipBtn = page.locator('[data-testid="skip-onboarding-btn"]');
  90  |     const isAtOnboarding = await skipBtn
  91  |       .waitFor({ state: "visible", timeout: 6000 })
  92  |       .then(() => true)
  93  |       .catch(() => false);
  94  |     if (isAtOnboarding) {
  95  |       await skipBtn.click({ force: true });
  96  |     }
  97  |     await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  98  | 
  99  |     // 2. Sign Out
  100 |     const userMenu = page.locator('[data-testid="user-menu-button"]');
  101 |     await expect(userMenu).toBeVisible();
  102 |     await userMenu.click({ force: true });
  103 |     await page.locator('[data-testid="sign-out-button"]').click({ force: true });
  104 |     await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  105 | 
  106 |     // 3. Sign In with newly created credentials
  107 |     await expect(page.locator("#login-identifier")).toBeVisible({ timeout: 10000 });
  108 |     await page.locator("#login-identifier").fill(credentialsEmail);
  109 |     await page.locator("#login-password").fill(credentialsPassword);
  110 |     await page.locator('[data-testid="login-submit-button"]').click({ force: true });
  111 | 
  112 |     await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  113 |     await expect(page.locator("h1, h2").filter({ hasText: /Dashboard|Overview|Good/i }).first()).toBeVisible();
  114 |   });
  115 | });
  116 | 
```