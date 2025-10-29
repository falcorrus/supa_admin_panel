import { createClient } from '@supabase/supabase-js';

// This API route handles decryption of connection keys
// It's called from the frontend when accessing a connection
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify user is authenticated
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Get the session from the authorization header (for browser requests)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { encryptedKey, iv, authTag } = req.body;
  if (!encryptedKey || !iv || !authTag) {
    return res.status(400).json({ 
      error: 'Encrypted key, IV, and authTag are required' 
    });
  }

  try {
    // Check if we have the encryption secret key configured
    const encryptionSecret = process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET_KEY;
    if (!encryptionSecret) {
      console.warn('ENCRYPTION_KEY not configured, using placeholder decryption');
      // In production, you should not proceed without proper encryption
      return res.status(500).json({ 
        error: 'Encryption secret not configured. Add ENCRYPTION_KEY to environment variables.' 
      });
    }

    // Ensure the encryption secret is the correct length for AES-256
    const keyBuffer = Buffer.from(encryptionSecret.substring(0, 32).padEnd(32, ' '), 'utf8');

    // Implement decryption using a crypto library
    const crypto = await import('crypto');
    const algorithm = 'aes-256-gcm';
    
    // Convert IV and authTag from hex to buffer
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipher(algorithm, keyBuffer);
    decipher.setAuthTag(authTagBuffer);
    
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Return the decrypted key
    res.status(200).json({
      decryptedKey: decrypted
    });
  } catch (error) {
    console.error('Decryption error:', error);
    return res.status(500).json({ error: 'Decryption failed' });
  }
}