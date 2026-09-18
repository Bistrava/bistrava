-- Editorial metadata managed from the Bistrava product administration.

alter table public.products
  add column if not exists primary_keyword text,
  add column if not exists secondary_keywords text[] not null default '{}'::text[],
  add column if not exists long_tail_keywords text[] not null default '{}'::text[],
  add column if not exists seo_keywords text[] not null default '{}'::text[],
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.products
  add constraint products_secondary_keywords_limit check (cardinality(secondary_keywords) <= 25),
  add constraint products_long_tail_keywords_limit check (cardinality(long_tail_keywords) <= 25),
  add constraint products_seo_keywords_limit check (cardinality(seo_keywords) <= 40),
  add constraint products_tags_limit check (cardinality(tags) <= 30);
