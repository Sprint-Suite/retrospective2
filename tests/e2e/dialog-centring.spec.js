const { test, expect } = require("@playwright/test");
const { seedSession } = require("./helpers/seed");
const { injectSession } = require("./helpers/_auth");

// A modal <dialog> is centred by the browser's `margin: auto`; the theme's
// `.ins *` reset removes it unless the dialog rule restores it.
test("the new-note dialog opens centred in the viewport", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  seedSession();
  await injectSession(context);
  await page.goto("/lobby");
  await page.fill("#display-name", "Tester");
  await page.fill("#create-title", "Sprint 1");
  await page.click("#create-form button[type=submit]");
  await page.waitForURL(/\/retrospective\?retroId=/, { timeout: 10000 });

  await page.click('.column-add[data-column="well"]');
  const dialog = page.locator("#note-dialog");
  await expect(dialog).toBeVisible();

  const box = await dialog.boundingBox();
  expect(Math.abs(box.x - (1280 - box.width) / 2)).toBeLessThanOrEqual(2);
  expect(Math.abs(box.y - (800 - box.height) / 2)).toBeLessThanOrEqual(2);
});
