import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Проверяем, что пользователь аутентифицирован
  // (здесь можно добавить дополнительную проверку токена пользователя)
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ 
      error: 'Missing Supabase configuration' 
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .order('table_name');
    
    if (error) {
      console.error('Ошибка при запросе к information_schema:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch tables' 
      });
    }

    // Фильтруем результат, чтобы исключить системные таблицы
    const userTables = (data || [])
      .filter(table => 
        !table.table_name.startsWith('pg_') && 
        !table.table_name.startsWith('sql_') && 
        !table.table_name.startsWith('_')
      )
      .map(table => ({ table_name: table.table_name }));
    
    res.status(200).json(userTables);
  } catch (error) {
    console.error('Исключение при запросе к information_schema:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}