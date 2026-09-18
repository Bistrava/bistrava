-- Kept separate because a newly added enum value must be committed before
-- later migrations use it in policies or data changes.
alter type public.catalog_status add value if not exists 'active' after 'published';
