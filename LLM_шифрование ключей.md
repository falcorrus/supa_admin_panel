# Инструкция по безопасному шифрованию и расшифровке ключей в Supabase: Путеводитель для LLM

## Общее описание проблемы

При реализации безопасного хранения чувствительных данных (например, ключей доступа к базам данных) в веб-приложениях часто возникает необходимость шифровать эти данные на клиенте, сохранять их в зашифрованном виде в базе данных, а затем расшифровывать при необходимости использовать. 

В контексте Supabase часто возникают следующие проблемы:
- Ошибка "encryptedKey, iv, and authTag are required" при попытке расшифровки
- Несоответствие между форматами данных при шифровании и расшифровке
- Неправильная реализация алгоритма AES-GCM для шифрования/дешифровки
- Проблемы с аутентификацией при вызове Supabase функций

## Архитектура решения

### 1. Шифрование на клиенте (через Supabase функцию)

Для шифрования чувствительных данных используется Supabase Edge Function, которая:
- Принимает открытый текст для шифрования
- Использует переменную окружения с мастер-ключом
- Применяет алгоритм AES-GCM для шифрования
- Возвращает зашифрованные данные, IV и тег аутентификации отдельно

### 2. Сохранение в базе данных

Зашифрованные данные сохраняются в таблице в следующих полях:
- `encrypted_key`: сам зашифрованный ключ
- `iv`: инициализационный вектор
- `auth_tag`: тег аутентификации

### 3. Расшифровка при необходимости использования

При необходимости использования чувствительных данных вызывается функция расшифровки, которая:
- Принимает зашифрованные данные, IV и тег аутентификации
- Использует тот же мастер-ключ
- Применяет обратный алгоритм AES-GCM
- Возвращает оригинальные данные

## Подробная реализация

### Шифрование (encrypt-key функция)

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function encryptData(data: string, masterKey: string): Promise<{ encryptedKey: string, iv: string, authTag: string }> {
  const encoder = new TextEncoder()
  
  // Убедитесь, что мастер-ключ имеет правильную длину (32 байта для AES-256)
  const keyData = encoder.encode(masterKey.padEnd(32, '0').slice(0, 32))
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    'AES-GCM',
    false,
    ['encrypt']
  )

  // Генерируем случайный IV (обычно 12 байт для AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const dataBuffer = encoder.encode(data)
  
  // Выполняем шифрование
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 }, // Укажите длину тега для AES-GCM
    cryptoKey,
    dataBuffer
  )

  // Извлекаем зашифрованные данные и тег аутентификации
  const resultBuffer = new Uint8Array(encryptedData);
  const authTag = resultBuffer.slice(resultBuffer.byteLength - 16); // Последние 16 байт - тег аутентификации
  const ciphertext = resultBuffer.slice(0, resultBuffer.byteLength - 16); // Остальные - зашифрованные данные

  return {
    encryptedKey: Array.from(ciphertext).map(b => b.toString(16).padStart(2, '0')).join(''),
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    authTag: Array.from(authTag).map(b => b.toString(16).padStart(2, '0')).join(''),
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Проверка аутентификации (при необходимости)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const { key } = await req.json();
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key parameter');
    }

    const masterKey = Deno.env.get('MASTER_ENCRYPTION_KEY');
    if (!masterKey) {
      throw new Error('Master encryption key not configured');
    }

    const { encryptedKey, iv, authTag } = await encryptData(key, masterKey);

    const responseBody = { encryptedKey, iv, authTag };
    return new Response(
      JSON.stringify(responseBody),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
```

### Расшифровка (decrypt-key функция)

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function decryptData(encryptedKey: string, iv: string, authTag: string, masterKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  // Убедитесь, что мастер-ключ имеет правильную длину (32 байта для AES-256)
  const keyData = encoder.encode(masterKey.padEnd(32, '0').slice(0, 32))
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    'AES-GCM',
    false,
    ['decrypt']
  )

  // Преобразуем шестнадцатеричные строки обратно в Uint8Array
  const ivBuffer = new Uint8Array(iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
  const authTagBuffer = new Uint8Array(authTag.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
  const encryptedKeyBuffer = new Uint8Array(encryptedKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

  // При расшифровке AES-GCM тег аутентификации передается отдельно
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer, authTag: authTagBuffer },
    cryptoKey,
    encryptedKeyBuffer
  )

  return decoder.decode(decryptedData)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Обязательно проверяйте аутентификацию
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const { encryptedKey, iv, authTag } = await req.json();
    if (!encryptedKey || !iv || !authTag) {
      return new Response(
        JSON.stringify({ error: 'encryptedKey, iv, and authTag are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    const masterKey = Deno.env.get('MASTER_ENCRYPTION_KEY');
    if (!masterKey) {
      throw new Error('Master encryption key not configured');
    }

    const decryptedKey = await decryptData(encryptedKey, iv, authTag, masterKey);

    const responseBody = { decryptedKey };
    return new Response(
      JSON.stringify(responseBody),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
```

## Клиентский код (TypeScript)

```typescript
// В файле services/connectionManager.ts или аналогичном
async encryptKey(key: string): Promise<{ encryptedKey: string, iv: string, authTag: string }> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/encrypt-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Encryption failed');
  }

  return await response.json();
}

async decryptKey(encryptedKey: string, iv: string, authTag: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/decrypt-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ encryptedKey, iv, authTag }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Decryption failed');
  }

  const { decryptedKey } = await response.json();
  return decryptedKey;
}
```

## Установка переменных окружения

### В Supabase проекте:
1. Зайдите в ваш проект на https://supabase.com/dashboard
2. Перейдите в Settings → Environment Variables
3. Добавьте переменную `MASTER_ENCRYPTION_KEY` с вашим 32-символьным ключом шифрования

### В локальной разработке (файл .env.local):
```
MASTER_ENCRYPTION_KEY=ваш_32_символьный_ключ_шифрования
```

## Распространенные ошибки и как их избежать

### 1. Ошибка "encryptedKey, iv, and authTag are required"

**Проблема**: Неправильная реализация расшифровки данных, особенно неправильное использование тега аутентификации при AES-GCM.

**Решение**: Убедитесь, что:
- При шифровании тег аутентификации извлекается отдельно от зашифрованных данных
- При расшифровке тег аутентификации передается отдельно в алгоритм, а не объединяется с зашифрованными данными
- Все три параметра (encryptedKey, iv, authTag) действительно передаются в функцию расшифровки

### 2. Проблемы с длиной ключа

**Проблема**: AES-256 требует ключ длиной ровно 32 байта.

**Решение**: Убедитесь, что ваш мастер-ключ имеет длину 32 символа, и при необходимости дополните его до нужной длины.

### 3. Проблемы с аутентификацией

**Проблема**: Supabase функции требуют проверку аутентификации для доступа к чувствительным данным.

**Решение**: Обязательно проверяйте заголовок Authorization в ваших функциях и возвращайте соответствующий статус 401 при его отсутствии или некорректности.

### 4. Несовместимость форматов данных

**Проблема**: Различия в формате данных между шифрованием и расшифровкой.

**Решение**: Убедитесь, что:
- При шифровании вы конвертируете бинарные данные в шестнадцатеричный формат
- При расшифровке вы конвертируете шестнадцатеричные строки обратно в бинарные данные
- Вы используете одинаковые форматы и кодировки в обеих функциях

## Деплой функций

### Через CLI:
```bash
supabase functions deploy encrypt-key --project-ref YOUR_PROJECT_REF
supabase functions deploy decrypt-key --project-ref YOUR_PROJECT_REF
```

### Через веб-интерфейс:
1. Зайдите в ваш проект на https://supabase.com/dashboard
2. Перейдите в раздел "Functions" в левой панели
3. Нажмите "New Function" или выберите существующую
4. Введите имя функции (encrypt-key или decrypt-key)
5. Скопируйте соответствующий код
6. Сохраните и разверните функцию

## Заключение

Правильная реализация шифрования в Supabase требует внимательного подхода к:
1. Совместимости форматов данных между шифрованием и расшифровкой
2. Правильной реализации AES-GCM с разделением тега аутентификации
3. Обеспечению безопасности через проверку аутентификации
4. Управлению мастер-ключом шифрования

Следование этим рекомендациям позволяет избежать распространенных ошибок и создать безопасную систему хранения чувствительных данных.