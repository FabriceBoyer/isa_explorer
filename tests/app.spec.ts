import { test, expect } from "@playwright/test";
test("exploration, filtering, reference and direct lab link", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "De l’instruction à la compréhension." }),
  ).toBeVisible();
  await expect(page.locator(".architecture-card")).toHaveCount(8);
  await page.getByRole("button", { name: "CISC", exact: true }).click();
  await expect(page.locator(".architecture-card")).toHaveCount(2);
  await page
    .locator(".architecture-card")
    .filter({ has: page.getByRole("heading", { name: "AMD64", exact: true }) })
    .click();
  await page
    .getByRole("link", { name: "Expérimenter dans le laboratoire" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Prenez les commandes." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Instruction suivante", exact: true })
    .click();
  await expect(page.locator(".last-instruction code")).toHaveText("MOV RAX, 0");
  await page
    .getByRole("button", { name: "Retour arrière", exact: true })
    .click();
  await expect(page.locator(".last-instruction code")).toHaveText("—");
});
test("executes each ISA and edits inputs", async ({ page }) => {
  await page.goto("/#/lab");
  for (const isa of ["amd64", "arm64", "riscv"]) {
    await page
      .getByRole("combobox", { name: "Architecture", exact: true })
      .selectOption(isa);
    await page.getByLabel("Donnée initiale n (0–100)").fill("3");
    await page.getByRole("combobox", { name: "Vitesse" }).selectOption("250");
    await page.getByRole("button", { name: "Exécuter", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Exécution terminée", {
      timeout: 12000,
    });
    const reg = isa === "amd64" ? "RAX" : isa === "arm64" ? "X0" : "x2";
    await expect(
      page
        .locator(".register")
        .filter({
          has: page.locator("small", { hasText: new RegExp("^" + reg + "$") }),
        })
        .locator("strong"),
    ).toHaveText("6");
  }
  await page.getByLabel("Code assembleur").fill("BAD x1");
  await expect(page.getByRole("status")).toContainText("Programme invalide");
  await expect(
    page.getByRole("button", { name: "Exécuter", exact: true }),
  ).toBeDisabled();
});
test("English, theme, documentation and mobile layout", async ({ page }) => {
  await page.goto("/#/architecture/amd64/ADD");
  await page.getByRole("button", { name: "Exécuter l’opération" }).click();
  await expect(page.locator(".destination strong")).toHaveText("12");
  await page.getByRole("button", { name: "Changer de langue" }).click();
  await expect(
    page.getByRole("heading", { name: "Syntax & operation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Theme dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Guide & help", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Primary sources" }),
  ).toBeVisible();
});

test("dark surfaces and text follow manual and system theme across pages", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByRole("button", { name: "Thème dark" }).click();
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(16, 22, 36)");
  await expect(page.locator("html")).toHaveCSS("color", "rgb(224, 229, 242)");
  for (const selector of [".nav-count", ".filters .selected", ".banner-icon"]) {
    await expect(page.locator(selector)).toHaveCSS("background-color", "rgb(40, 35, 63)");
  }
  await expect(page.locator(".architecture-card").first()).toHaveCSS("background-color", "rgb(24, 32, 49)");
  for (const route of ["architecture/amd64", "architecture/amd64/ADD", "lab", "instructions", "help"]) {
    await page.goto("/#/" + route);
    await expect(page.locator("html")).toHaveCSS("background-color", "rgb(16, 22, 36)");
    await expect(page.locator("main h1")).toHaveCSS("color", "rgb(224, 229, 242)");
    await expect(page.locator("header")).toHaveCSS("background-color", "rgb(24, 32, 49)");
  }
  await page.getByRole("button", { name: "Thème auto" }).click();
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(246, 247, 251)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(16, 22, 36)");
  await page.getByRole("button", { name: "Thème light" }).click();
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(246, 247, 251)");
  await expect(page.locator("html")).toHaveCSS("color", "rgb(37, 48, 74)");
});
