import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function decryptData(encryptedKey: string, iv: string, authTag: string, masterKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  const keyData = encoder.encode(masterKey.padEnd(32, '0').slice(0, 32))
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    'AES-GCM',
    false,
    ['decrypt']
  )

  // Convert hex strings back to Uint8Array
  const ivBuffer = new Uint8Array(iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
  const authTagBuffer = new Uint8Array(authTag.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
  const encryptedKeyBuffer = new Uint8Array(encryptedKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

  // For AES-GCM decryption, the auth tag must be appended to the ciphertext
  // as it was when encrypted
  const combinedBuffer = new Uint8Array(encryptedKeyBuffer.length + authTagBuffer.length);
  combinedBuffer.set(encryptedKeyBuffer);
  combinedBuffer.set(authTagBuffer, encryptedKeyBuffer.length);

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer, tagLength: 128 }, // tagLength in bits
    cryptoKey,
    combinedBuffer
  )

  return decoder.decode(decryptedData)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Decrypt-key function called');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    
    // Verify the request is authenticated - check for authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const { encryptedKey, iv, authTag } = await req.json();
    console.log('Parsed request body - encryptedKey length:', encryptedKey?.length, 'iv length:', iv?.length, 'authTag length:', authTag?.length);
    
    if (!encryptedKey || encryptedKey === '' || !iv || iv === '' || !authTag || authTag === '') {
      console.error('Missing required parameters: encryptedKey, iv, or authTag');
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
      console.error('Master encryption key not configured.');
      throw new Error('Master encryption key not configured');
    }

    console.log('Master key found, decrypting...');
    
    const decryptedKey = await decryptData(encryptedKey, iv, authTag, masterKey);
    console.log('Decryption successful');

    const responseBody = { decryptedKey };
    console.log('Decrypt-key response:', JSON.stringify(responseBody));
    return new Response(
      JSON.stringify(responseBody),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Decryption error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})