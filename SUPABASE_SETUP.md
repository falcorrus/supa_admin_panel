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

Для тестирования вы можете временно установить более разрешительные политики:
1. Перейдите в **Table Editor**
2. Выберите нужные таблицы
3. Установите политики доступа, разрешающие чтение/запись для аутентифицированных пользователей

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
returns table (table_name text) as $
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
$ language plpgsql;
```

После этого вы можете использовать анонимный ключ для вызова этой функции.