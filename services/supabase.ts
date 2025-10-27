import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../config';

// FIX: The check for placeholder Supabase credentials was removed. The credentials in `config.ts` are already provided, making this check obsolete and causing a TypeScript error because the comparison would always be false.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getTables = async () => {
  // Проверяем, запущено ли приложение в production
  if (process.env.NODE_ENV === 'production') {
    // В production используем безопасный API маршрут
    try {
      const response = await fetch('/api/tables');
      if (!response.ok) {
        throw new Error(`Ошибка при получении таблиц: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при вызове API маршрута для получения таблиц:', error);
      throw new Error('Ошибка при получении списка таблиц. Пожалуйста, проверьте настройки сервера.');
    }
  } else {
    // В development проверяем наличие сервисного ключа
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (serviceRoleKey) {
      // Если предоставлен сервисный ключ, используем его для прямого запроса к information_schema
      // Это позволяет обойти необходимость в RPC-функции, но является небезопасным в клиентском приложении
      console.warn("Использование сервисного ключа в клиентском приложении небезопасно. Рекомендуется только для локальной разработки.");
      
      const serviceRoleSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        serviceRoleKey
      );

      try {
        const { data, error } = await serviceRoleSupabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE')
          .order('table_name');
        
        if (error) {
          console.error('Ошибка при запросе к information_schema с сервисным ключом:', error);
          // Если ошибка доступа к information_schema, пробуем использовать RPC-функцию как альтернативу
          console.log('Попытка использовать RPC-функцию как альтернативу...');
        } else {
          // Фильтруем результат, чтобы исключить системные таблицы
          const userTables = (data || [])
            .filter(table => 
              !table.table_name.startsWith('pg_') && 
              !table.table_name.startsWith('sql_') && 
              !table.table_name.startsWith('_')
            )
            .map(table => ({ table_name: table.table_name }));
          
          return userTables;
        }
      } catch (error: any) {
        console.error('Исключение при запросе к information_schema:', error);
        // Если возникло исключение, пробуем использовать RPC-функцию как альтернативу
        console.log('Переход к использованию RPC-функции...');
      }
    }
  }
  
  // В production или если сервисный ключ не предоставлен или запрос к information_schema не удался,
  // используем RPC-функцию с анонимным ключом
  // Это безопаснее, но требует предварительного создания RPC-функции в базе данных
  const { data, error } = await supabase.rpc('get_user_tables');

  if (error) {
    console.error('Ошибка при вызове RPC get_user_tables:', error);

    // Если ошибка связана с отсутствием функции, предоставляем подробные инструкции
    if (error.code === '42883' || (error.message && (error.message.toLowerCase().includes('does not exist') || error.message.toLowerCase().includes('could not find function')))) {
      throw new Error("Функция 'get_user_tables' не найдена. Пожалуйста, создайте RPC-функцию в SQL-редакторе Supabase.\n\nДля этого перейдите в SQL Editor -> New Query и выполните:\n\ncreate or replace function get_user_tables()\nreturns table (table_name text) as $$\nbegin\n  return query\n  select t.table_name::text\n  from information_schema.tables t\n  where t.table_schema = 'public'\n    and t.table_type = 'BASE TABLE'\n    and not t.table_name like 'pg_%' \n    and not t.table_name like 'sql_%'\n  order by t.table_name;\nend;\n$$ language plpgsql;");
    } else {
      throw new Error(`Ошибка при получении таблиц: ${error.message}`);
    }
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