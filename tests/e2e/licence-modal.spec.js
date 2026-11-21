const { test, expect } = require("@playwright/test");
const { seedSession } = require("./helpers/seed");
const { injectSession } = require("./helpers/_auth");

test("/license permanently redirects to the Hub licence", async ({ request }) => {
  const res = await request.get("/license", { maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(res.headers()["location"]).toBe("https://sprintsuite.uk/license");
});

test("the lobby opens the licence in a popup and Esc closes it", async ({ page, context }) => {
  seedSession({ id: "s-licence", userId: "u-licence" });
  await injectSession(context, "s-licence");
  await page.goto("/lobby");

  await page.locator("a[data-licence-modal]").click();
  const dialog = page.locator("dialog.licence-modal");
  await expect(dialog).toHaveAttribute("open", "");
  await expect(page.locator("#licence-modal-title")).toBeFocused();
  await expect(dialog).toContainText("1. Grant of licence.");
  expect(new URL(page.url()).pathname).toBe("/lobby");

  await page.keyboard.press("Escape");
  await expect(dialog).not.toHaveAttribute("open", "");
});
