import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function encryptData(data: string, masterKey: string): Promise<{ encryptedKey: string, iv: string, authTag: string }> {
  const encoder = new TextEncoder()
  
  const keyData = encoder.encode(masterKey.padEnd(32, '0').slice(0, 32))
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    'AES-GCM',
    false,
    ['encrypt']
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const dataBuffer = encoder.encode(data)
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 }, // Specify tagLength for AES-GCM
    cryptoKey,
    dataBuffer
  )

  // Extract ciphertext and authTag
  const resultBuffer = new Uint8Array(encryptedData);
  const authTag = resultBuffer.slice(resultBuffer.byteLength - 16);
  const ciphertext = resultBuffer.slice(0, resultBuffer.byteLength - 16);

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
    console.log('Encrypt-key function called');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    
    const { key } = await req.json();
    console.log('Parsed request body - key:', key);
    
    if (!key || typeof key !== 'string') {
      console.error('Invalid key parameter received.');
      throw new Error('Invalid key parameter');
    }

    console.log('Key received, length:', key.length);

    const masterKey = Deno.env.get('MASTER_ENCRYPTION_KEY');
    if (!masterKey) {
      console.error('Master encryption key not configured.');
      throw new Error('Master encryption key not configured');
    }

    console.log('Master key found, encrypting...');
    
    const { encryptedKey, iv, authTag } = await encryptData(key, masterKey);
    console.log('encryptData function returned.');

    console.log('Encryption successful, encryptedKey length:', encryptedKey.length);

    const responseBody = { encryptedKey, iv, authTag };
    console.log('Encrypt-key response:', JSON.stringify(responseBody));
    return new Response(
      JSON.stringify(responseBody),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Encryption error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})