-- Скрипт для обновления существующих подключений с отсутствующими IV и authTag
-- Замените 'your_connection_id' и 'your_original_key' на реальные значения

-- Допустим, у нас есть таблица с существующими подключениями без IV и authTag

-- ВАЖНО: перед выполнением этого скрипта:
-- 1. Создайте резервную копию вашей таблицы supadmin_connections
-- 2. Используйте Supabase функцию encrypt-key для получения новых значений IV и authTag

-- Пример: как получить зашифрованные значения:
-- POST запрос к https://your-project.supabase.co/functions/v1/encrypt-key
-- с телом {"key": "ваш_оригинальный_ключ_без_шифрования"}
-- и авторизационным заголовком Bearer токен

-- Затем обновите записи с полученными значениями:
UPDATE supadmin_connections 
SET 
  encrypted_anon_key = 'новое_зашифрованное_значение',
  anon_key_iv = 'новое_iv_значение',
  anon_key_auth_tag = 'новое_auth_tag_значение'
WHERE id = 'уникальный_id_подключения' 
  AND (anon_key_iv IS NULL OR anon_key_iv = '') 
  AND (anon_key_auth_tag IS NULL OR anon_key_auth_tag = '');

-- Для обновления всех записей с отсутствующими полями (важно: только если у вас есть доступ к оригинальным ключам):
-- 
-- WITH updated_keys AS (
--   -- Здесь вы должны создать временный список с ID подключений и их оригинальными ключами
--   -- SELECT id, original_key FROM ваш_источник_данных
-- )
-- UPDATE supadmin_connections 
-- SET 
--   encrypted_anon_key = (SELECT encrypted_data FROM результат_шифрования WHERE результат_шифрования.id = supadmin_connections.id),
--   anon_key_iv = (SELECT iv_value FROM результат_шифрования WHERE результат_шифрования.id = supadmin_connections.id),
--   anon_key_auth_tag = (SELECT auth_tag_value FROM результат_шифрования WHERE результат_шифрования.id = supadmin_connections.id)
-- WHERE supadmin_connections.id IN (SELECT id FROM updated_keys)
--   AND (supadmin_connections.anon_key_iv IS NULL OR supadmin_connections.anon_key_iv = '') 
--   AND (supadmin_connections.anon_key_auth_tag IS NULL OR supadmin_connections.anon_key_auth_tag = '');

-- Проверьте, что все записи теперь содержат необходимые поля:
SELECT id, connection_name, 
       encrypted_anon_key, 
       anon_key_iv, 
       anon_key_auth_tag
FROM supadmin_connections
WHERE anon_key_iv IS NULL OR anon_key_iv = '' 
   OR anon_key_auth_tag IS NULL OR anon_key_auth_tag = '';