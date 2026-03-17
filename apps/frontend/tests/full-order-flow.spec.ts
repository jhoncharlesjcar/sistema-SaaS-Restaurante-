import { test, expect } from "@playwright/test";

test("Full Order Lifecycle Flow", async ({ page }) => {
  // 1. Login
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@demo.com");
  await page.getByLabel("Contraseña").fill("Password123!");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page).toHaveURL("/");

  // 2. Create Order
  await page.goto("/ordenes");
  await page.getByRole("button", { name: "Nueva Orden" }).click();

  // Select Table
  const firstTable = page
    .locator(".grid > div")
    .filter({ hasText: "pers." })
    .first();
  await firstTable.click();
  await page.getByRole("button", { name: "Siguiente: Productos" }).click();

  // Select Product
  const firstProduct = page
    .locator(".grid > div")
    .filter({ hasText: "S/" })
    .first();
  await firstProduct.click();
  await page.getByRole("button", { name: "Siguiente: Confirmar" }).click();

  // Confirm Order
  await page.getByRole("button", { name: "CONFIRMAR PEDIDO" }).click();
  await expect(page.getByText("Orden creada exitosamente")).toBeVisible();

  // 3. Go to KDS (Kitchen)
  await page.goto("/kds");
  // Wait for the order to appear and mark it as ready
  // We assume the KDS shows the latest orders
  const orderCard = page.locator(".bg-card").first();
  await expect(orderCard).toBeVisible();
  await orderCard.getByRole("button", { name: "Listo" }).click();

  // 4. Go to Invoicing
  await page.goto("/facturacion");

  // Select the order in the pending list
  // It should be the first one as it was just created
  const pendingOrder = page.locator(".bg-card .space-y-2 > div").first();
  await pendingOrder.click();

  // Generate Receipt (Boleta)
  await page.getByRole("button", { name: "Generar Boleta" }).click();

  // 5. Verify Successful Payment/Invoicing
  await expect(
    page.getByText("Comprobante generado exitosamente"),
  ).toBeVisible();

  // The order should move to "Facturas Recientes"
  const recentInvoice = page.locator("table tbody tr").first();
  await expect(recentInvoice).toContainText("BOLETA");
});
