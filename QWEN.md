## Qwen Added Memories

Приложение использует безопасный подход к использованию SERVICE_ROLE_KEY: на Vercel (включая production и preview окружения) - через API маршрут /api/tables (SERVICE_ROLE_KEY используется только на серверной стороне), в других окружениях (включая development и production вне Vercel) - через RPC-функцию get_user_tables() как безопасный метод, при наличии SERVICE_ROLE_KEY в других окружениях может использоваться прямой доступ (с предупреждением о безопасности)

bao_supadmin=sbp_0c9c9bb5e313b7e27b9e4f4740e851228d01bc78

pg_dump --format=c --file="backup.dump" "postgresql://postgres:wRNj756dxjJalzNa@[db.nvodtxeehqnreyjuijsl.supabase.co]:6543/postgres"

Команды для деплоя функций:



Замените sbp_ВАШ_НОВЫЙ_КЛЮЧ на ваш новый сгенерированный токен

SUPABASE_ACCESS_TOKEN=sbp_0c9c9bb5e313b7e27b9e4f4740e851228d01bc78 supabase functions deploy encrypt-key

SUPABASE_ACCESS_TOKEN=sbp_0c9c9bb5e313b7e27b9e4f4740e851228d01bc78 supabase functions deploy decrypt-key

- supabase functions deploy encrypt-key --project-ref nvodtxeehqnreyjuijsl
- supabase functions deploy decrypt-key --project-ref nvodtxeehqnreyjuijsl

Если возникает ошибка с токеном, выполните деплой через веб-интерфейс:

1. Зайдите в ваш проект на https://supabase.com/dashboard
2. Перейдите в раздел "Functions" в левой панели
3. Нажмите "New Function"
4. Введите имя функции (encrypt-key или decrypt-key)
5. Скопируйте код из соответствующего файла в папке supabase/functions/
6. Сохраните и разверните функцию

Также установите переменную окружения:

1. Перейдите в Settings → Environment Variables в вашем Supabase проекте
2. Добавьте переменную MASTER_ENCRYPTION_KEY и укажите ваш 32-символьный ключ шифрования

Если возникают ошибки декодирования, проверьте совместимость версий функций encrypt-key и decrypt-key.
