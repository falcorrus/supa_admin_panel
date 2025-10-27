import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../config';

interface Connection {
  name: string;
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

class ConnectionManager {
  private connections: Connection[] = [];
  private activeConnectionName: string | null = null;
  private activeClient: SupabaseClient | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadConnections();
      this.addDefaultConnection();
      this.loadActiveConnection();
    }
  }

  private loadConnections() {
    const connections = localStorage.getItem('supabaseConnections');
    if (connections) {
      this.connections = JSON.parse(connections);
    }
  }

  private addDefaultConnection() {
    if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'MISSING_CONFIG' && supabaseAnonKey !== 'MISSING_CONFIG') {
      const defaultConnectionExists = this.connections.some(c => c.name === 'Default');
      if (!defaultConnectionExists) {
        this.addConnection('Default', supabaseUrl, supabaseAnonKey, '');
      }
    }
  }

  private loadActiveConnection() {
    const activeConnectionName = localStorage.getItem('activeSupabaseConnection');
    if (activeConnectionName && this.connections.some(c => c.name === activeConnectionName)) {
      this.setActiveConnection(activeConnectionName);
    } else if (this.connections.length > 0) {
      this.setActiveConnection(this.connections[0].name);
    }
  }

  addConnection(name: string, url: string, anonKey: string, serviceRoleKey?: string) {
    const existingConnectionIndex = this.connections.findIndex(c => c.name === name);
    if (existingConnectionIndex !== -1) {
      this.connections[existingConnectionIndex] = { name, url, anonKey, serviceRoleKey };
    } else {
      const connection = { name, url, anonKey, serviceRoleKey };
      this.connections.push(connection);
    }
    localStorage.setItem('supabaseConnections', JSON.stringify(this.connections));
  }

  removeConnection(name: string) {
    this.connections = this.connections.filter(c => c.name !== name);
    localStorage.setItem('supabaseConnections', JSON.stringify(this.connections));
    if (this.activeConnectionName === name) {
      this.activeConnectionName = null;
      this.activeClient = null;
      localStorage.removeItem('activeSupabaseConnection');
    }
  }

  getConnections(): Connection[] {
    return this.connections;
  }

  getConnection(name: string): SupabaseClient {
    const connection = this.connections.find(c => c.name === name);
    if (!connection) {
      throw new Error('Connection not found');
    }
    return createClient(connection.url, connection.anonKey);
  }

  setActiveConnection(name: string) {
    const connection = this.connections.find(c => c.name === name);
    if (!connection) {
      throw new Error('Connection not found');
    }
    this.activeConnectionName = name;
    this.activeClient = createClient(connection.url, connection.anonKey);
    localStorage.setItem('activeSupabaseConnection', name);
  }

  getActiveConnection(): SupabaseClient {
    if (!this.activeClient) {
      // If no active client, try to set one from the list of connections
      if (this.connections.length > 0) {
        this.setActiveConnection(this.connections[0].name);
        return this.activeClient!;
      }
      throw new Error('No active connection');
    }
    return this.activeClient;
  }
}

export const connectionManager = new ConnectionManager();
