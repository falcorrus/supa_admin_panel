# Интеграция с Supabase в проекте

## Общая архитектура

Проект использует Supabase как бэкенд для хранения и управления данными. Архитектура интеграции включает в себя:

- Подключение к Supabase с помощью `@supabase/supabase-js`
- Аутентификация пользователей через email/пароль
- Получение, создание, редактирование и удаление данных из таблиц
- Управление видимостью таблиц в интерфейсе

## Подключение к Supabase

Подключение настраивается в файле `config.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../config';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Необходимые переменные окружения:

- `VITE_SUPABASE_URL` - URL проекта Supabase
- `VITE_SUPABASE_ANON_KEY` - Анонимный API ключ (публичный)
- `VITE_SUPABASE_SERVICE_ROLE_KEY` - Сервисный ключ (опционально, небезопасно для клиентского использования)

## Аутентификация

### Вход в систему
Функция входа реализована в `components/Login.tsx`:

```typescript
const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
  } catch (error: any) {
    setError(error.message || 'An unknown error occurred.');
  } finally {
    setLoading(false);
  }
};
```

### Управление сессией
В `components/App.tsx` реализовано:

1. Получение текущей сессии:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   ```

2. Подписка на изменения состояния аутентификации:
   ```typescript
   supabase.auth.onAuthStateChange((_event, session) => {
     setSession(session);
   });
   ```

### Выход из системы
Функция выхода используется в нескольких компонентах:
- `components/Header.tsx`
- `components/Settings.tsx`
- `components/SettingsChakra.tsx`

```typescript
await supabase.auth.signOut();
```

## Работа с таблицами

Все функции для работы с данными находятся в `services/supabase.ts`:

### Получение списка таблиц

Функция `getTables()` использует три метода для получения списка таблиц:

1. **В Production - через безопасный API маршрут**:
   - Вызов серверного API маршрута (`/api/tables`) на Vercel
   - SERVICE_ROLE_KEY используется только на серверной стороне
   - Клиентский код не имеет доступа к SERVICE_ROLE_KEY
   - Наиболее безопасный метод для production

2. **Прямой доступ (с использованием service_role_key)**:
   - Более быстрый, но небезопасный метод
   - Используется только в development при наличии переменной `VITE_SUPABASE_SERVICE_ROLE_KEY`
   - Делает прямой запрос к `information_schema.tables`

3. **RPC-функция (безопасный метод)**:
   - Используется как резервный вариант в production или при ошибке других методов
   - Требует предварительного создания функции в базе данных

```sql
create or replace function get_public_tables()
returns table (table_name text)
language plpgsql
as $
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
$
```

### Получение данных таблицы

```typescript
export const getTableData = async (tableName: string) => {
  const { data, error } = await supabase.from(tableName).select('*').order('id', { ascending: true }).limit(100);
  if (error) {
    console.error(`Ошибка при получении данных для таблицы ${tableName}:`, error);
    throw error;
  }
  return data;
};
```

### Обновление данных

```typescript
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
```

### Удаление данных

```typescript
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
```

### Добавление данных

```typescript
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
```

## Использование в компонентах

### DataTable.tsx
Компонент отображает таблицы и предоставляет следующий функционал:
- Просмотр данных с возможностью сортировки
- Редактирование отдельных ячеек
- Добавление новых строк
- Удаление строк

### Dashboard.tsx
- Управляет состоянием таблиц (видимость, порядок)
- Загружает и кэширует настройки видимости таблиц в localStorage
- Обрабатывает события сортировки таблиц

### Settings.tsx / SettingsChakra.tsx
- Предоставляет интерфейс для настройки видимости таблиц
- Управляет режимами видимости: все/none/на заказ
- Показывает информацию о методе получения таблиц

## Безопасность

1. Использование `service_role_key` в клиентском приложении является небезопасным
   - Рекомендуется использовать только для локальной разработки
   - В продакшене рекомендуется использовать RPC-функцию

2. Для корректной работы необходимо настроить:
   - Права доступа к таблицам для аутентифицированных пользователей
   - Политики Row Level Security (RLS) при необходимости
   - Redirect URLs для аутентификации

3. Использование анонимных ключей считается безопасным для чтения данных, но требует осторожного подхода к политикам доступа