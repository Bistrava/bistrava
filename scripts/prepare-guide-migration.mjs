import { readFile, writeFile } from "node:fs/promises";
import { guides } from "../src/lib/content/guides.ts";

// Build a self-contained migration from the existing reviewed articles.
// ON CONFLICT preserves any article already managed in Supabase.
const path = new URL("../supabase/migrations/202610080016_admin_guides.sql", import.meta.url);
const source = await readFile(path, "utf8");
if (!source.includes("-- INITIAL_GUIDE_SEED")) throw new Error("Guide seed already prepared; keep the checked-in migration unchanged.");
const json = JSON.stringify(guides);
if (json.includes("$bistrava_guides$")) throw new Error("Unexpected SQL delimiter in content.");
const seed = `insert into public.guides(title,slug,excerpt,content,status,seo_title,seo_description,published_at,updated_at)
select entry->>'title', entry->>'slug', entry->>'excerpt',
  jsonb_build_object('readingTime', entry->>'readingTime', 'sections', entry->'sections', 'comparison', entry->'comparison'),
  (entry->>'status')::public.catalog_status, entry->>'title', entry->>'excerpt',
  case when entry->>'status' = 'published' then (entry->>'updatedAt')::timestamptz end,
  (entry->>'updatedAt')::timestamptz
from jsonb_array_elements($bistrava_guides$${json}$bistrava_guides$::jsonb) as seed(entry)
on conflict (slug) do nothing;`;
await writeFile(path, source.replace("-- INITIAL_GUIDE_SEED", seed));
console.log(`Embedded ${guides.length} original guides without changing any article text.`);
