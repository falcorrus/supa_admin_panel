# Supabase Admin Panel

Это админ-панель на базе React для управления моей Supabase

*This is a React-based admin panel for managing your Supabase database.*



https://supa-admin-panel.vercel.app/



## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`

2. Set up environment variables by creating a `.env.local` file (or configure them in your deployment platform) with the following:
   
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # Optional: for accessing metadata without RPC function
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
   
   **ВАЖНО: Использование VITE_SUPABASE_SERVICE_ROLE_KEY в клиентском приложении небезопасно и рекомендуется только для локальной разработки.**

3. Run the app:
   `npm run dev`

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Возможности приложения

- **Аутентификация пользователей**: Вход с использованием email/пароль
- **Просмотр таблиц**: Отображение всех таблиц в базе данных
- **Редактирование данных**: Возможность редактировать отдельные ячейки в таблицах
- **Управление данными**: Добавление и удаление строк
- **Настройка видимости**: Настройка видимости таблиц в интерфейсе
- **Сортировка данных**: Сортировка по столбцам
- **Дизайн интерфейса**: Поддержка двух версий интерфейса (Tailwind CSS и Chakra UI)

## Архитектура интеграции с Supabase

Приложение использует следующие функции Supabase:

1. **Аутентификация**: 
   - Вход/выход пользователей
   - Управление сессиями

2. **Работа с данными**:
   - Получение данных из таблиц (с лимитом 100 записей)
   - Обновление отдельных ячеек
   - Удаление строк
   - Добавление новых строк

3. **Доступ к метаданным**:
   - В production: через безопасный API маршрут (на сервере Vercel)
   - В разработке: 
     - Прямой доступ (с использованием service_role_key, небезопасный метод)
     - Через RPC-функцию (безопасный метод)

## Безопасность

### Использование SERVICE_ROLE_KEY

- В production: SERVICE_ROLE_KEY используется только на сервере Vercel через безопасные API маршруты
- В разработке: SERVICE_ROLE_KEY может использоваться локально (небезопасно, только для разработки)
- В RPC-функция: через anon-ключ (безопасный метод для production)

### Рекомендации по безопасности

1. Для production всегда используйте настроенные переменные окружения в Vercel
2. Серверные API маршруты защищают SERVICE_ROLE_KEY от клиентского доступа
3. Все обычные операции (чтение/запись/удаление данных) выполняются через anon-ключ
4. Всегда используйте RLS (Row Level Security) в Supabase для дополнительной защиты

## Deploy to Vercel

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add the environment variables in Vercel settings
4. Your app will be deployed automatically

## Troubleshooting

If you see an "invalid api" error, make sure:

1. Your Supabase project URL and Anon Key are correctly set in environment variables
2. The Supabase project is properly configured with required permissions
3. When using service role key, ensure it has the necessary permissions

## Дополнительная документация

- [Настройка Supabase](SUPABASE_SETUP.md) - подробное руководство по настройке Supabase проекта
- [Документация по интеграции с Supabase](SUPABASE_INTEGRATION_DOCS.md) - техническая документация по работе с Supabase в проекте