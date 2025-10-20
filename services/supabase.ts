
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../config';

// FIX: The check for placeholder Supabase credentials was removed. The credentials in `config.ts` are already provided, making this check obsolete and causing a TypeScript error because the comparison would always be false.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getTables = async () => {
  // ВАЖНО: 
  // Вам нужно создать эту RPC-функцию в вашем SQL-редакторе Supabase, чтобы это работало.
  // Перейдите в SQL Editor -> New Query и выполните следующий код:
  /*
    create or replace function get_user_tables()
    returns table (table_name text) as $$
    begin
      return query
      select t.table_name::text
      from information_schema.tables t
      where t.table_schema = 'public'
        and t.table_type = 'BASE TABLE'
        and not t.table_name like 'pg_%' 
        and not t.table_name like 'sql_%'
      order by t.table_name;
    end;
    $$ language plpgsql;
  */
  const { data, error } = await supabase.rpc('get_user_tables');
  if (error) {
    console.error('Ошибка при вызове RPC get_user_tables:', error);

    // Supabase error для отсутствующей RPC - это код '42883'
    // Обновлено для захвата сообщения "could not find function"
    if (error.code === '42883' || (error.message && (error.message.toLowerCase().includes('does not exist') || error.message.toLowerCase().includes('could not find function')))) {
       throw new Error("Настройка базы данных не завершена: функция 'get_user_tables' не найдена. Пожалуйста, создайте ее в вашем SQL-редакторе Supabase. Инструкции находятся в комментариях файла 'services/supabase.ts'.");
    }
    
    throw new Error(`Ошибка при получении таблиц: ${error.message}`);
  }
  return data || [];
};

export const getTableData = async (tableName: string) => {
  const { data, error } = await supabase.from(tableName).select('*').order('id', { ascending: true }).limit(100);
  if (error) {
    console.error(`Ошибка при получении данных для таблицы ${tableName}:`, error);
    throw error;
  }
  return data;
};

export const updateRow = async (tableName: string, id: any, column: string, value: any) => {
    const { data, error } = await supabase
      .from(tableName)
      .update({ [column]: value })
      .eq('id', id)
      .select();
  
    if (error) {
      console.error(`Ошибка при обновлении строки в ${tableName}:`, error);
      throw error;
    }
    return data;
};

export const deleteRow = async (tableName: string, id: any) => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
        console.error(`Ошибка при удалении строки из ${tableName}:`, error);
        throw error;
    }
};

export const insertRow = async (tableName: string, newRow: Record<string, any>) => {
    const { data, error } = await supabase
      .from(tableName)
      .insert([newRow])
      .select();
      
    if (error) {
        console.error(`Ошибка при вставке строки в ${tableName}:`, error);
        throw error;
    }
    return data;
};