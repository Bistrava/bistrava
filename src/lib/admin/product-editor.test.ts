import { describe, expect, it } from "vitest";

import { createAdminProductEditorData } from "@/lib/admin/product-editor";
import { allCategories, specialistProducts } from "@/lib/catalog/catalog";
import { adminProductFormSchema } from "@/lib/validation/admin-product";

describe("admin product editor", () => {
  it("creates a valid editable form for every specialist product", () => {
    const categoryNames = new Map(
      allCategories.map((category) => [category.slug, category.shortName]),
    );

    const invalid = specialistProducts.flatMap((product) => {
      const editor = createAdminProductEditorData(
        product,
        categoryNames.get(product.categorySlug) ?? product.categorySlug,
      );
      const result = adminProductFormSchema.safeParse(editor.values);
      return result.success ? [] : [{ sku: product.sku, issues: result.error.issues }];
    });

    expect(specialistProducts).toHaveLength(24);
    expect(invalid).toEqual([]);
  });
});
