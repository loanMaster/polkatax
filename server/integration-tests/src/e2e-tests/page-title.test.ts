import { test, expect } from "@playwright/test";

test("homepage has title", async ({ page }) => {
  await page.goto("/staking-rewards");
  await expect(page).toHaveTitle(/PolkaTax/);
});
