import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';
import { connectionManager } from './connectionManager';

export const getTables = async () => {
  const activeSupabase = connectionManager.getActiveConnection();

  // Try to fetch tables using the RPC function (recommended secure method)
  // First try the new standard function name
  let { data, error } = await activeSupabase.rpc('get_public_tables');

  // If that fails, try the legacy function name
  if (error) {
    // console.log('get_public_tables failed, trying get_user_tables');
    const legacyResult = await activeSupabase.rpc('get_user_tables');
    if (!legacyResult.error) {
      data = legacyResult.data;
      error = null;
    } else {
      // If both fail, return the error from the first attempt (or a combined error)
      console.error('Error using RPC function get_public_tables:', error);
      console.error('Error using RPC function get_user_tables:', legacyResult.error);
      throw new Error(`Ошибка при получении таблиц. Не удалось вызвать RPC функцию get_public_tables или get_user_tables. Пожалуйста, выполните SQL инструкцию из раздела подключения.`);
    }
  }

  return data.map((item: any) => ({ table_name: item.table_name }));
};

export const getTableData = async (tableName: string) => {
  let supabaseClient = connectionManager.getActiveConnection();
  let data, error;

  // First attempt: Try with service role client if available and for supadmin_users
  if (tableName === 'supadmin_users') {
    const serviceRoleClient = connectionManager.getActiveServiceRoleConnection();
    if (serviceRoleClient) {
      ({ data, error } = await serviceRoleClient.from(tableName).select('*').order('id', { ascending: true }).limit(100));
      if (!error) {
        return data; // Successfully fetched with service role client
      } else if (error.message.includes('Invalid API key')) {
        console.warn('Service role client failed with Invalid API key. Falling back to active connection.');
        // Fall through to use activeClient
      } else {
        console.error(`Ошибка при получении данных для таблицы ${tableName} с serviceRoleClient:`, error);
        throw error; // Other errors with service role client
      }
    } else {
      console.warn('Service role client not available for supadmin_users. Falling back to active connection.');
    }
  }

  // Second attempt: Use the active client (anonKey)
  ({ data, error } = await supabaseClient.from(tableName).select('*').order('id', { ascending: true }).limit(100));
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