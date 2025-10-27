# Настройка Supabase для приложения

Для корректной работы приложения необходимо настроить проект Supabase:

## 1. Настройка проекта

1. Зайдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Создайте новый проект или используйте существующий

## 2. Настройка аутентификации

1. Перейдите в раздел **Authentication** → **Providers**
2. Убедитесь, что **Email** аутентификация включена
3. Перейдите в **Settings** → **Redirect URLs** и добавьте:
   - `http://localhost:3000` для локальной разработки
   - `https://your-vercel-domain.vercel.app` для деплоя на Vercel

## 3. Получение API ключей

1. Перейдите в **Project Settings** → **API**
2. Скопируйте:
   - **Project URL**
   - **anon public API key**
   - **service_role API key** (для доступа к метаданным без RPC-функции)
3. Добавьте их в переменные окружения как `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` и `VITE_SUPABASE_SERVICE_ROLE_KEY`

## 4. Настройка политик доступа

Для полноценной работы приложения необходимо настроить политики доступа:

1. Перейдите в **Table Editor**
2. Для каждой таблицы, к которой нужен доступ:
   - Перейдите на вкладку **Policies**
   - Создайте политики для операций:
     - `SELECT` - просмотр данных
     - `INSERT` - добавление строк
     - `UPDATE` - редактирование строк
     - `DELETE` - удаление строк
   - Настройте условия на свое усмотрение (например, для тестирования можно разрешить всем аутентифицированным пользователям)

Пример политики для таблицы `todos`:
```sql
-- Allow authenticated users to select all todos
CREATE POLICY "Allow read access for authenticated users" ON todos
FOR SELECT TO authenticated
USING (true);

-- Allow authenticated users to insert todos
CREATE POLICY "Allow insert access for authenticated users" ON todos
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update their todos
CREATE POLICY "Allow update access for authenticated users" ON todos
FOR UPDATE TO authenticated
USING (true);

-- Allow authenticated users to delete their todos
CREATE POLICY "Allow delete access for authenticated users" ON todos
FOR DELETE TO authenticated
USING (true);
```

## 5. Создание тестового пользователя

1. Перейдите в **Authentication** → **Users**
2. Создайте нового пользователя или подтвердите существующего
3. Используйте эти учетные данные для входа в приложение

## 6. Установка переменных окружения

### Локально:
Создайте файл `.env.local` в корне проекта:

```
VITE_SUPABASE_URL=ваш_supabase_url
VITE_SUPABASE_ANON_KEY=ваш_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key
```

**ВАЖНО: Использование service_role_key в клиентском приложении небезопасно и рекомендуется только для локальной разработки.**

## 7. Альтернативный способ (с RPC-функцией)

Если вы не хотите использовать service_role_key в клиентском приложении, вы можете создать RPC-функцию для получения списка таблиц:

1. Перейдите в **SQL Editor**
2. Выполните следующий SQL-код:

```sql
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
```

После этого вы можете использовать анонимный ключ для вызова этой функции.

## 8. Функциональные возможности приложения

Admin Panel предоставляет следующие возможности:

- **Аутентификация**: Вход с использованием email/пароль
- **Просмотр таблиц**: Отображение всех таблиц в базе данных
- **Редактирование данных**: Возможность редактировать отдельные ячейки в таблицах
- **Управление данными**: Добавление и удаление строк
- **Настройка видимости**: Настройка видимости таблиц в интерфейсе
- **Сортировка данных**: Сортировка по столбцам
- **Дизайн интерфейса**: Поддержка двух версий интерфейса (Tailwind CSS и Chakra UI)

Для подробной информации о функциях и архитектуре интеграции обратитесь к документации: [Документация по интеграции с Supabase](SUPABASE_INTEGRATION_DOCS.md)