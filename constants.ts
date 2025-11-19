export const GET_TABLES_SQL = `create or replace function get_public_tables()
returns table (table_name text)
language plpgsql
as $$
begin
  return query
  select t.table_name::text
  from information_schema.tables t
  where t.table_schema = 'public'
    and t.table_type = 'BASE TABLE'
    and t.table_name != 'supabase_migrations'
    and t.table_name not like '_basejump%'
    and t.table_name not like 'pg_%';
end;
$$`;
