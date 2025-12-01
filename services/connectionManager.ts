import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';
import { supabaseUrl } from '../config';

export interface Connection {
  id: string;
  connection_name: string;
  db_url: string;
  encrypted_anon_key: string;
  encrypted_service_role_key?: string;
  anon_key_iv?: string;
  anon_key_auth_tag?: string;
  service_role_key_iv?: string;
  service_role_key_auth_tag?: string;
}

class ConnectionManager {
  private connections: Connection[] = [];
  private activeConnectionName: string | null = null;
  private activeClient: SupabaseClient | null = null;
  private activeServiceRoleClient: SupabaseClient | null = null;

  constructor() {
    // The constructor is now empty. Loading is done on demand.
  }

  async getConnections(): Promise<Connection[]> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data: tenant } = await supabase.from('supadmin_users').select('id').eq('user_id', user.id).single();

    if (!tenant) {
      return [];
    }

    const { data, error } = await supabase.from('supadmin_connections').select('*').eq('tenant_id', tenant.id);

    if (error) {
      console.error('Error fetching connections:', error);
      return [];
    }

    // Фильтруем подключения, которые имеют полные данные шифрования
    const completeConnections = (data || []).filter(conn =>
      conn.encrypted_anon_key &&
      conn.anon_key_iv &&
      conn.anon_key_auth_tag
    );

    this.connections = completeConnections;
    return this.connections;
  }

  async addConnection(connectionName: string, dbUrl: string, anonKey: string, serviceRoleKey?: string) {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated in addConnection');
      throw new Error('User not authenticated');
    }
    console.log('User authenticated:', user.id);

    // First, find or create the tenant record
    let { data: tenant } = await supabase.from('supadmin_users').select('id').eq('user_id', user.id).single();
    console.log('Tenant found:', tenant);
    if (!tenant) {
      console.log('No tenant found, creating a new one...');
      const { data, error } = await supabase.from('supadmin_users').insert({ user_id: user.id, name: user.email }).select('id').single();
      if (error) {
        console.error('Error creating tenant:', error);
        throw error;
      }
      tenant = data;
      console.log('New tenant created:', tenant);
    }
    if (!tenant) {
      console.error('Could not create or find tenant');
      throw new Error('Could not create or find tenant');
    }

    // Encrypt the keys using the Edge Function
    console.log('Encrypting anonKey...');
    const encryptedAnonKey = await this.encryptKey(anonKey);
    console.log('Encrypted anonKey:', encryptedAnonKey);
    const encryptedServiceRoleKey = serviceRoleKey ? await this.encryptKey(serviceRoleKey) : undefined;
    console.log('Encrypted serviceRoleKey:', encryptedServiceRoleKey);

    const { error } = await supabase.from('supadmin_connections').insert({
      tenant_id: tenant.id,
      connection_name: connectionName,
      db_url: dbUrl,
      encrypted_anon_key: encryptedAnonKey.encryptedKey,
      encrypted_service_role_key: encryptedServiceRoleKey?.encryptedKey,
      anon_key_iv: encryptedAnonKey.iv,
      anon_key_auth_tag: encryptedAnonKey.authTag,
      service_role_key_iv: encryptedServiceRoleKey?.iv,
      service_role_key_auth_tag: encryptedServiceRoleKey?.authTag,
    });

    if (error) {
      console.error('Error inserting connection:', error);
      throw error;
    }
    console.log('Connection inserted successfully.');
  }

  async removeConnection(connectionId: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('supadmin_connections').delete().eq('id', connectionId);
    if (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  }

  async setActiveConnection(name: string) {
    const connection = this.connections.find(c => c.connection_name === name);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Проверяем, есть ли необходимые поля для расшифровки
    if (!connection.encrypted_anon_key ||
      !connection.anon_key_iv ||
      !connection.anon_key_auth_tag) {
      throw new Error(`Connection '${name}' has missing encryption parameters and needs to be re-added to the system`);
    }

    // Decrypt the anon key using the Edge Function
    const rawAnonKey = await this.decryptKey(
      connection.encrypted_anon_key,
      connection.anon_key_iv,
      connection.anon_key_auth_tag
    );
    const anonKey = rawAnonKey.trim();

    this.activeConnectionName = name;
    this.activeConnectionName = name;
    this.activeClient = createClient(connection.db_url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // NEW: Decrypt and set service role key if available
    if (connection.encrypted_service_role_key && connection.service_role_key_iv && connection.service_role_key_auth_tag) {
      try {
        const serviceRoleKey = await this.decryptKey(
          connection.encrypted_service_role_key,
          connection.service_role_key_iv,
          connection.service_role_key_auth_tag
        );

        if (serviceRoleKey) {
          const trimmedServiceRoleKey = serviceRoleKey.trim();
          console.log(`[ConnectionManager] Decrypted Service Role Key for ${name}: ${trimmedServiceRoleKey.substring(0, 5)}...${trimmedServiceRoleKey.substring(trimmedServiceRoleKey.length - 5)} (Length: ${trimmedServiceRoleKey.length})`);
          this.activeServiceRoleClient = createClient(connection.db_url, trimmedServiceRoleKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          });
        } else {
          console.warn(`[ConnectionManager] Decrypted Service Role Key is empty for ${name}`);
          this.activeServiceRoleClient = null;
        }
      } catch (err) {
        console.error(`[ConnectionManager] Failed to decrypt Service Role Key for ${name}:`, err);
        this.activeServiceRoleClient = null;
      }
    } else {
      this.activeServiceRoleClient = null;
    }
  }

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

  getActiveConnection(): SupabaseClient {
    if (!this.activeClient) {
      throw new Error('No active connection');
    }
    return this.activeClient;
  }

  // NEW METHOD
  getActiveServiceRoleConnection(): SupabaseClient | null {
    return this.activeServiceRoleClient;
  }

  getActiveConnectionName(): string {
    return this.activeConnectionName || 'Unknown';
  }
}

export const connectionManager = new ConnectionManager();
