-- Create the tenants table
CREATE TABLE supadmin_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the connections table
CREATE TABLE supadmin_connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES supadmin_users(id) ON DELETE CASCADE NOT NULL,
    connection_name TEXT,
    db_url TEXT,
    encrypted_anon_key TEXT,
    encrypted_service_role_key TEXT,
    anon_key_iv TEXT,
    anon_key_auth_tag TEXT,
    service_role_key_iv TEXT,
    service_role_key_auth_tag TEXT,
    anon_key_iv TEXT,
    anon_key_auth_tag TEXT,
    service_role_key_iv TEXT,
    service_role_key_auth_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for the tables
ALTER TABLE supadmin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE supadmin_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow users to see and manage their own tenant info"
ON supadmin_users
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to see and manage their own connections"
ON supadmin_connections 
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM supadmin_users
    WHERE supadmin_users.id = supadmin_connections.tenant_id
      AND supadmin_users.user_id = auth.uid()
  )
);
