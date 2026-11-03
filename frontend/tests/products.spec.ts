import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomPassword } from "./utils/random"
import { logInUser } from "./utils/user"

const randomSku = () =>
  `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

const randomProductName = () =>
  `Product ${Math.random().toString(36).substring(7)}`

test("Products page is accessible and shows correct title", async ({
  page,
}) => {
  await page.goto("/products")
  await expect(
    page.getByRole("heading", { name: "Products", exact: true }),
  ).toBeVisible()
  await expect(page.getByText("Manage the store catalog")).toBeVisible()
})

test("Add Product button is visible for superuser", async ({ page }) => {
  await page.goto("/products")
  await expect(page.getByRole("button", { name: "Add Product" })).toBeVisible()
})

// Writes require a superuser, so these run with the default storageState,
// which is the superuser session created by auth.setup.ts.
test.describe("Products management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products")
  })

  test("Create a new product successfully", async ({ page }) => {
    const name = randomProductName()
    const sku = randomSku()

    await page.getByRole("button", { name: "Add Product" }).click()
    await page.getByLabel("Name").fill(name)
    await page.getByLabel("SKU").fill(sku)
    await page.getByLabel("Price").fill("1500.50")
    await page.getByLabel("Stock", { exact: true }).fill("10")
    await page.getByLabel("Description").fill("Test description")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Product created successfully")).toBeVisible()
    await expect(page.getByText(sku)).toBeVisible()
  })

  test("Create product with only required fields", async ({ page }) => {
    const name = randomProductName()
    const sku = randomSku()

    await page.getByRole("button", { name: "Add Product" }).click()
    await page.getByLabel("Name").fill(name)
    await page.getByLabel("SKU").fill(sku)
    await page.getByLabel("Price").fill("99.99")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("Product created successfully")).toBeVisible()
    await expect(page.getByText(sku)).toBeVisible()
  })

  test("Cancel product creation", async ({ page }) => {
    await page.getByRole("button", { name: "Add Product" }).click()
    await page.getByLabel("Name").fill("Cancelled product")
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Name is required", async ({ page }) => {
    await page.getByRole("button", { name: "Add Product" }).click()
    await page.getByLabel("Name").fill("")
    await page.getByLabel("Name").blur()

    await expect(page.getByText("Name is required")).toBeVisible()
  })

  test("SKU is required", async ({ page }) => {
    await page.getByRole("button", { name: "Add Product" }).click()
    await page.getByLabel("SKU").fill("")
    await page.getByLabel("SKU").blur()

    await expect(page.getByText("SKU is required")).toBeVisible()
  })

  test("Price must be greater than zero", async ({ page }) => {
    await page.getByRole("button", { name: "Add Product" }).click()
    await page.getByLabel("Price").fill("0")
    await page.getByLabel("Price").blur()

    await expect(
      page.getByText("Price must be greater than zero"),
    ).toBeVisible()
  })

  test("Duplicate SKU is rejected by the server", async ({ page }) => {
    const sku = randomSku()

    await page.getByRole("button", { name: "Add Product" }).click()
    await page.getByLabel("Name").fill(randomProductName())
    await page.getByLabel("SKU").fill(sku)
    await page.getByLabel("Price").fill("10.00")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Product created successfully")).toBeVisible()
    await expect(page.getByRole("dialog")).not.toBeVisible()

    await page.getByRole("button", { name: "Add Product" }).click()
    await page.getByLabel("Name").fill(randomProductName())
    await page.getByLabel("SKU").fill(sku)
    await page.getByLabel("Price").fill("20.00")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(
      page.getByText("The product with this SKU already exists in the system."),
    ).toBeVisible()
  })

  test.describe("Edit and Delete", () => {
    let sku: string
    let name: string

    test.beforeEach(async ({ page }) => {
      sku = randomSku()
      name = randomProductName()

      await page.goto("/products")
      await page.getByRole("button", { name: "Add Product" }).click()
      await page.getByLabel("Name").fill(name)
      await page.getByLabel("SKU").fill(sku)
      await page.getByLabel("Price").fill("500.00")
      await page.getByRole("button", { name: "Save" }).click()
      await expect(page.getByText("Product created successfully")).toBeVisible()
      await expect(page.getByRole("dialog")).not.toBeVisible()
    })

    test("Edit a product successfully", async ({ page }) => {
      const updatedName = randomProductName()

      // The product name is the write affordance: it opens the edit drawer.
      await page.getByRole("button", { name, exact: true }).click()

      await page.getByLabel("Name").fill(updatedName)
      await page.getByRole("button", { name: "Save" }).click()

      await expect(page.getByText("Product updated successfully")).toBeVisible()
      await expect(page.getByText(updatedName)).toBeVisible()
    })

    test("Delete a product successfully", async ({ page }) => {
      const productRow = page.getByRole("row").filter({ hasText: sku })
      await productRow.getByRole("button").last().click()
      await page.getByRole("menuitem", { name: "Delete Product" }).click()

      await page.getByRole("button", { name: "Delete" }).click()

      await expect(
        page.getByText("The product was deleted successfully"),
      ).toBeVisible()
      await expect(page.getByText(sku)).not.toBeVisible()
    })
  })
})

// Products are global (not per-user), so a normal user still sees the whole
// catalog but must not see any write affordance. The API would answer 403.
test.describe("Non-superuser cannot write", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Hides write actions from a normal user", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    await createUser({ email, password })
    await logInUser(page, email, password)

    await page.goto("/products")

    await expect(
      page.getByRole("heading", { name: "Products", exact: true }),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Add Product" })).toHaveCount(
      0,
    )
  })
})

test.describe("Product table columns", () => {
  test.beforeEach(async ({ page }) => {
    // The column headers only exist once the table has rows: an empty catalog
    // renders the empty state instead. Create one so this test does not depend
    // on another spec having run first.
    await page.goto("/products")
    await page.getByRole("button", { name: "Add Product" }).click()
    await page.getByLabel("Name").fill(randomProductName())
    await page.getByLabel("SKU").fill(randomSku())
    await page.getByLabel("Price").fill("10.00")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Product created successfully")).toBeVisible()
  })

  test("Hides the ID column and shows the requested columns", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Products", exact: true }),
    ).toBeVisible()
    await expect(page.getByRole("columnheader").first()).toBeVisible()

    const headers = await page
      .locator("thead th")
      .evaluateAll((cells) =>
        cells.map((cell) => cell.textContent?.trim() ?? ""),
      )

    expect(headers).toEqual([
      "Name",
      "SKU",
      "Price",
      "Stock",
      "Last Update",
      "Status",
      "Actions",
    ])
  })
})

test("Barcode can be created and edited", async ({ page }) => {
  const sku = randomSku()
  const name = randomProductName()
  const barcode = `779${Date.now().toString().slice(-10)}`
  const updatedBarcode = `778${Date.now().toString().slice(-10)}`

  await page.goto("/products")
  await page.getByRole("button", { name: "Add Product" }).click()
  await page.getByLabel("Name").fill(name)
  await page.getByLabel("SKU").fill(sku)
  await page.getByLabel("Price").fill("10.00")
  await page.getByLabel("Barcode").fill(barcode)
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Product created successfully")).toBeVisible()
  await expect(page.getByRole("dialog")).not.toBeVisible()

  const nameButton = page.getByRole("button", { name, exact: true })
  await nameButton.click()
  await expect(page.getByLabel("Barcode")).toHaveValue(barcode)
  await page.getByLabel("Barcode").fill(updatedBarcode)
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Product updated successfully")).toBeVisible()

  await nameButton.click()
  await expect(page.getByLabel("Barcode")).toHaveValue(updatedBarcode)
})

test("Barcode is trimmed before the 64 character limit is checked", async ({
  page,
}) => {
  const sku = randomSku()
  const name = randomProductName()
  // 64 characters plus a trailing space: valid once trimmed, invalid if the
  // browser measures the raw value before trimming.
  const barcode = `${"b".repeat(64)} `

  await page.goto("/products")
  await page.getByRole("button", { name: "Add Product" }).click()
  await page.getByLabel("Name").fill(name)
  await page.getByLabel("SKU").fill(sku)
  await page.getByLabel("Price").fill("10.00")
  await page.getByLabel("Barcode").fill(barcode)
  await page.getByRole("button", { name: "Save" }).click()

  await expect(
    page.getByText("Barcode must be at most 64 characters"),
  ).toHaveCount(0)
  await expect(page.getByText("Product created successfully")).toBeVisible()
  await expect(page.getByRole("dialog")).not.toBeVisible()

  await page.getByRole("button", { name, exact: true }).click()
  await expect(page.getByLabel("Barcode")).toHaveValue("b".repeat(64))
})

test("The product name opens the edit drawer and Cancel leaves it unchanged", async ({
  page,
}) => {
  const sku = randomSku()
  const name = randomProductName()

  await page.goto("/products")
  await page.getByRole("button", { name: "Add Product" }).click()
  await page.getByLabel("Name").fill(name)
  await page.getByLabel("SKU").fill(sku)
  await page.getByLabel("Price").fill("10.00")
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Product created successfully")).toBeVisible()

  await page.getByRole("button", { name, exact: true }).click()
  const drawer = page.getByRole("dialog", { name: "Edit product" })
  await expect(drawer).toBeVisible()
  // The drawer is the only place the catalog row can be edited from.
  await expect(drawer.getByLabel("SKU")).toHaveValue(sku)

  await drawer.getByLabel("Name").fill("Discarded name")
  await page.getByRole("button", { name: "Cancel" }).click()

  await expect(drawer).not.toBeVisible()
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible()
  await expect(page.getByText("Discarded name")).toHaveCount(0)
})

test("is_active can be switched off from the edit drawer", async ({ page }) => {
  const sku = randomSku()
  const name = randomProductName()

  await page.goto("/products")
  await page.getByRole("button", { name: "Add Product" }).click()
  await page.getByLabel("Name").fill(name)
  await page.getByLabel("SKU").fill(sku)
  await page.getByLabel("Price").fill("10.00")
  await page.getByRole("button", { name: "Save" }).click()
  await expect(page.getByText("Product created successfully")).toBeVisible()

  const productRow = page.getByRole("row").filter({ hasText: sku })
  await expect(productRow.getByText("Active")).toBeVisible()

  await page.getByRole("button", { name, exact: true }).click()
  await page.getByRole("checkbox", { name: "Active" }).uncheck()
  await page.getByRole("button", { name: "Save" }).click()

  await expect(page.getByText("Product updated successfully")).toBeVisible()
  await expect(productRow.getByText("Inactive")).toBeVisible()
})
