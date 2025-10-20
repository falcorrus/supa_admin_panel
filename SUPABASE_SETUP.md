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

## 3. Создание RPC-функции

Для корректной работы приложения необходимо создать RPC-функцию:

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

## 4. Получение API ключей

1. Перейдите в **Project Settings** → **API**
2. Скопируйте **Project URL** и **anon public API key**
3. Добавьте их в переменные окружения как `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`

## 5. Настройка политик доступа

Для тестирования вы можете временно установить более разрешительные политики:
1. Перейдите в **Table Editor**
2. Выберите нужные таблицы
3. Установите политики доступа, разрешающие чтение/запись для аутентифицированных пользователей

## 6. Создание тестового пользователя

1. Перейдите в **Authentication** → **Users**
2. Создайте нового пользователя или подтвердите существующего
3. Используйте эти учетные данные для входа в приложение

## 7. Установка переменных окружения

### Локально:
Создайте файл `.env.local` в корне проекта:

```
VITE_SUPABASE_URL=ваш_supabase_url
VITE_SUPABASE_ANON_KEY=ваш_anon_key
```

### На Vercel:
1. Перейдите в настройки проекта
2. Добавьте переменные в разделе Environment Variables