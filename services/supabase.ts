import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';
import { connectionManager } from './connectionManager';

export const getTables = async () => {
  const activeSupabase = connectionManager.getActiveConnection();
  
  // Try to fetch tables using the RPC function (recommended secure method)
  const { data, error } = await activeSupabase.rpc('get_user_tables');
  
  if (error) {
    console.error('Error using RPC function get_user_tables:', error);
    throw new Error(`Ошибка при получении таблиц через RPC функцию: ${error.message}. Пожалуйста, убедитесь что функция get_user_tables создана в базе данных согласно документации.`);
  }
  
  return data.map(item => ({ table_name: item.table_name }));
};

export const getTableData = async (tableName: string) => {
  const activeSupabase = connectionManager.getActiveConnection();
  const { data, error } = await activeSupabase.from(tableName).select('*').order('id', { ascending: true }).limit(100);
  if (error) {
    console.error(`Ошибка при получении данных для таблицы ${tableName}:`, error);
    throw error;
  }
  return data;
};

export const updateRow = async (tableName: string, id: any, column: string, value: any) => {
    const activeSupabase = connectionManager.getActiveConnection();
    const { data, error } = await activeSupabase
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
    const activeSupabase = connectionManager.getActiveConnection();
    const { error } = await activeSupabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
        console.error(`Ошибка при удалении строки из ${tableName}:`, error);
        throw error;
    }
};

export const insertRow = async (tableName: string, newRow: Record<string, any>) => {
    const activeSupabase = connectionManager.getActiveConnection();
    const { data, error } = await activeSupabase
      .from(tableName)
      .insert([newRow])
      .select();
      
    if (error) {
        console.error(`Ошибка при вставке строки в ${tableName}:`, error);
        throw error;
    }
    return data;
};