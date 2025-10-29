import { createClient } from '@supabase/supabase-js';

// This API route acts as a proxy for tenant database requests
// It decrypts the tenant's database credentials and makes requests on their behalf

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

  const { tenantId, operation, tableName, filters, data } = req.body;
  if (!tenantId || !operation || !tableName) {
    return res.status(400).json({ error: 'tenantId, operation, and tableName are required' });
  }

  try {
    // Find the tenant connection details
    const { data: tenant } = await supabase
      .from('supadmin_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found or not authorized' });
    }

    // Get the connection details
    const { data: connection, error: connError } = await supabase
      .from('supadmin_connections')
      .select('*')
      .eq('tenant_id', tenant.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Проверяем, есть ли необходимые поля для расшифровки
    if (!connection.encrypted_anon_key || 
        !connection.anon_key_iv || 
        !connection.anon_key_auth_tag) {
      return res.status(400).json({ error: 'Connection has missing encryption parameters and needs to be re-added to the system' });
    }

    // Decrypt the database keys
    const decryptedAnonKey = await decryptKey(
      connection.encrypted_anon_key,
      connection.anon_key_iv,
      connection.anon_key_auth_tag,
      token // Pass the token extracted from auth header
    );

    // Create a client for the tenant's database
    const tenantClient = createClient(connection.db_url, decryptedAnonKey);

    // Perform the requested operation
    let result;
    switch (operation) {
      case 'select':
        result = await tenantClient
          .from(tableName)
          .select('*')
          .match(filters || {});
        break;

      case 'insert':
        result = await tenantClient
          .from(tableName)
          .insert(data)
          .select();
        break;

      case 'update':
        if (!filters) {
          return res.status(400).json({ error: 'Filters are required for update operation' });
        }
        result = await tenantClient
          .from(tableName)
          .update(data)
          .match(filters)
          .select();
        break;

      case 'delete':
        if (!filters) {
          return res.status(400).json({ error: 'Filters are required for delete operation' });
        }
        result = await tenantClient
          .from(tableName)
          .delete()
          .match(filters);
        break;

      default:
        return res.status(400).json({ error: 'Unsupported operation' });
    }

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    res.status(200).json(result.data || result);
  } catch (error) {
    console.error('Tenant proxy error:', error);
    return res.status(500).json({ error: 'Tenant proxy request failed' });
  }
}

// Helper function to decrypt keys using the Supabase Edge Function
async function decryptKey(encryptedKey, iv, authTag, sessionToken) {
  const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/decrypt-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`, // Use the session token from the original request
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