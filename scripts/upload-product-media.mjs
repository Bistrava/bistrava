import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname, extname, isAbsolute, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(root, "public");
const { default: sharp } = await import("sharp");
const manifest = JSON.parse(readFileSync(resolve(root, "src/lib/catalog/product-media.generated.json"), "utf8"));
const upload = process.argv.includes("--upload");
const mimeTypes = {
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

if (manifest.length !== 24 || manifest.some((product) => product.images.length !== 4)) {
  throw new Error("Expected exactly four images for each of the 24 specialist products.");
}

function getEnvironment() {
  const values = Object.fromEntries(
    readFileSync(resolve(root, ".env.local"), "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
  if (!values.NEXT_PUBLIC_SUPABASE_URL || !values.SUPABASE_SECRET_KEY) {
    throw new Error("Supabase URL and server key are required in .env.local.");
  }
  return values;
}

async function prepareImage(image) {
  const sourcePath = resolve(publicRoot, image.url.replace(/^\//, ""));
  const pathWithinPublic = relative(publicRoot, sourcePath);
  if (pathWithinPublic.startsWith("..") || isAbsolute(pathWithinPublic)) {
    throw new Error(`Image path escapes public directory: ${image.url}`);
  }
  const original = readFileSync(sourcePath);
  const extension = extname(sourcePath).toLowerCase();
  const converted = extension === ".svg";
  const content = converted ? await sharp(original).png().toBuffer() : original;
  const outputExtension = converted ? ".png" : extension;
  const contentType = mimeTypes[outputExtension];
  if (!contentType) throw new Error(`Unsupported image type: ${image.url}`);
  if (content.byteLength > 10_485_760) {
    throw new Error(`Image exceeds the 10 MB bucket limit: ${image.url}`);
  }
  const metadata = await sharp(content).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Missing image dimensions: ${image.url}`);
  }
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 12);
  const path = image.url.replace(/^\//, "").replace(/\.[^.]+$/, `-${hash}${outputExtension}`);
  return { content, contentType, converted, path, width: metadata.width, height: metadata.height };
}

async function main() {
  const prepared = [];
  for (const product of manifest) {
    for (const [index, image] of product.images.entries()) {
      prepared.push({ product, image, index, file: await prepareImage(image) });
    }
  }
  if (new Set(prepared.map(({ file }) => file.path)).size !== 96) {
    throw new Error("Storage paths must be unique across all product images.");
  }
  console.log(`Prepared ${prepared.length} images (${prepared.filter(({ file }) => file.converted).length} SVG panels converted to PNG).`);
  if (!upload) {
    console.log("Dry run complete. Pass --upload to transfer and link the images.");
    return;
  }

  const env = getEnvironment();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,sku,status")
    .in("sku", manifest.map((product) => product.id));
  if (productsError) throw productsError;
  const productsBySku = new Map(products.map((product) => [product.sku, product]));
  if (productsBySku.size !== 24) throw new Error("The 24 specialist products must exist in Supabase first.");
  const { data: existingImages, error: existingImagesError } = await supabase
    .from("product_images")
    .select("storage_path")
    .in("product_id", products.map((product) => product.id));
  if (existingImagesError) throw existingImagesError;
  const expectedPaths = new Set(prepared.map(({ file }) => file.path));
  if (existingImages.some((image) => !expectedPaths.has(image.storage_path))) {
    throw new Error("Supabase contains product images outside this manifest; review them before rerunning the import.");
  }

  let uploaded = 0;
  let reused = 0;
  for (const { product, image, index, file } of prepared) {
    const row = productsBySku.get(product.id);
    const { error: uploadError } = await supabase.storage
      .from("product-media")
      .upload(file.path, file.content, {
        contentType: file.contentType,
        cacheControl: "31536000",
        upsert: false,
      });
    if (uploadError) {
      if (String(uploadError.statusCode) === "409" || uploadError.message.toLowerCase().includes("already exists")) {
        reused += 1;
      } else {
        throw new Error(`Upload failed for ${file.path}: ${uploadError.message}`);
      }
    } else {
      uploaded += 1;
    }
    const { error: rowError } = await supabase.from("product_images").upsert({
      product_id: row.id,
      storage_path: file.path,
      alt_text: image.altSl,
      width: file.width,
      height: file.height,
      sort_order: index,
      is_primary: index === 0,
    }, { onConflict: "product_id,storage_path", ignoreDuplicates: true });
    if (rowError) throw new Error(`Database link failed for ${file.path}: ${rowError.message}`);
    if (index === 3) console.log(`Linked four images for ${product.id}.`);
  }
  console.log(`Complete: ${uploaded} uploaded, ${reused} already present, ${prepared.length} database links.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
