import { createClient } from '@supabase/supabase-js';

// This API route handles encryption of connection keys
// It's called from the frontend when saving a new connection
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify user is authenticated
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Get the session from the authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Key to encrypt is required' });
  }

  try {
    // Check if we have the encryption secret key configured
    const encryptionSecret = process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET_KEY;
    if (!encryptionSecret) {
      console.warn('ENCRYPTION_KEY not configured, using placeholder encryption');
      // In production, you should not proceed without proper encryption
      return res.status(500).json({ 
        error: 'Encryption secret not configured. Add ENCRYPTION_KEY to environment variables.' 
      });
    }

    // Ensure the encryption secret is the correct length for AES-256
    const keyBuffer = Buffer.from(encryptionSecret.substring(0, 32).padEnd(32, ' '), 'utf8');

    // Actually implement encryption using a crypto library
    const crypto = await import('crypto');
    const algorithm = 'aes-256-gcm';
    
    // Create a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipher(algorithm, keyBuffer);
    
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag for GCM
    const authTag = cipher.getAuthTag();
    
    // Return the encrypted data with IV and auth tag
    res.status(200).json({
      encryptedKey: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  } catch (error) {
    console.error('Encryption error:', error);
    return res.status(500).json({ error: 'Encryption failed' });
  }
}