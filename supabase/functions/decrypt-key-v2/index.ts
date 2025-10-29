import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to convert hex string to Uint8Array
function hexToUint8Array(hexString: string): Uint8Array {
  return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

async function decryptData(encryptedHex: string, ivHex: string, authTagHex: string, masterKey: string): Promise<string> {
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

  const ivBuffer = hexToUint8Array(ivHex);
  const authTagBuffer = hexToUint8Array(authTagHex);
  const encryptedBuffer = hexToUint8Array(encryptedHex);

  // The Web Crypto API's decrypt function expects the authTag to be part of the ciphertext
  // for AES-GCM. So, we concatenate them back.
  const combinedBuffer = new Uint8Array(encryptedBuffer.byteLength + authTagBuffer.byteLength);
  combinedBuffer.set(encryptedBuffer);
  combinedBuffer.set(authTagBuffer, encryptedBuffer.byteLength);

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer, tagLength: 128 }, // tagLength is in bits
    cryptoKey,
    combinedBuffer
  )

  return decoder.decode(decryptedData)
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Decrypt-key function called')
    
    const { encryptedKey, iv, authTag } = await req.json()
    
    if (!encryptedKey || !iv || !authTag) {
      throw new Error('encryptedKey, iv, and authTag are required')
    }

    console.log('Encrypted key received, length:', encryptedKey.length)
    console.log('IV received, length:', iv.length)
    console.log('AuthTag received, length:', authTag.length)

    const masterKey = Deno.env.get('MASTER_ENCRYPTION_KEY')
    if (!masterKey) {
      throw new Error('Master encryption key not configured')
    }

    console.log('Master key found, decrypting...')
    
    const decrypted = await decryptData(encryptedKey, iv, authTag, masterKey)

    console.log('Decryption successful, decrypted length:', decrypted.length)

    return new Response(
      JSON.stringify({ decrypted }),
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