-- Сначала посмотрим, какие подключения имеют неполные данные шифрования
SELECT 
    id, 
    connection_name, 
    encrypted_anon_key, 
    anon_key_iv, 
    anon_key_auth_tag,
    CASE 
        WHEN anon_key_iv IS NULL OR anon_key_iv = '' THEN 'MISSING_IV'
        WHEN anon_key_auth_tag IS NULL OR anon_key_auth_tag = '' THEN 'MISSING_AUTH_TAG'
        WHEN encrypted_anon_key IS NULL OR encrypted_anon_key = '' THEN 'MISSING_ENCRYPTED_KEY'
        ELSE 'COMPLETE'
    END AS missing_field
FROM supadmin_connections
WHERE anon_key_iv IS NULL OR anon_key_iv = '' 
   OR anon_key_auth_tag IS NULL OR anon_key_auth_tag = ''
   OR encrypted_anon_key IS NULL OR encrypted_anon_key = '';

-- Затем, вы можете вручную обновить каждое подключение, вызвав Supabase функцию encrypt-key для каждого старого ключа
-- Ниже пример как это можно сделать для конкретного подключения (замените ID и ключ на реальные):

-- Пример обновления конкретного подключения:
-- Допустим, у нас есть подключение с id = 'id_подключения' и оригинальным ключом 'ваш_оригинальный_ключ'
-- Сначала вызовите функцию encrypt-key с вашим оригинальным ключом, чтобы получить:
-- {encryptedKey: "...", iv: "...", authTag: "..."}

-- Затем обновите запись:
/*
UPDATE supadmin_connections 
SET 
  encrypted_anon_key = 'результат_шифрования_encryptedKey',
  anon_key_iv = 'результат_шифрования_iv',
  anon_key_auth_tag = 'результат_шифрования_authTag'
WHERE id = 'id_подключения';
*/

-- ВАЖНО: 
-- 1. Сначала сделайте резервную копию таблицы supadmin_connections
-- 2. Получите оригинальные (незашифрованные) ключи для каждого подключения, которое нужно обновить
-- 3. Вызовите функцию encrypt-key для каждого ключа
-- 4. Используйте полученные значения для обновления записей в базе данных