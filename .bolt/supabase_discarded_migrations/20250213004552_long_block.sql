-- Drop existing objects
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TYPE IF EXISTS membership_type CASCADE;
DROP TYPE IF EXISTS member_status CASCADE;
DROP TYPE IF EXISTS financial_transaction_type CASCADE;
DROP TYPE IF EXISTS financial_transaction_category CASCADE;
DROP TYPE IF EXISTS budget_category CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS handle_first_user_admin CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgjwt;

-- Create custom types
CREATE TYPE membership_type AS ENUM (
  'baptism',
  'transfer',
  'non_member',
  'non_baptized_member'
);

CREATE TYPE member_status AS ENUM (
  'active',
  'inactive',
  'under_discipline',
  'regular_attender',
  'visitor',
  'withdrawn',
  'removed'
);

CREATE TYPE financial_transaction_type AS ENUM (
  'income',
  'expense'
);

CREATE TYPE financial_transaction_category AS ENUM (
  'tithe',
  'first_fruit_offering',
  'love_offering',
  'mission_offering',
  'building_offering',
  'lot_offering',
  'other',
  'ministry_expense',
  'payroll',
  'utilities',
  'maintenance',
  'events',
  'missions',
  'education'
);

CREATE TYPE budget_category AS ENUM (
  'ministry',
  'payroll',
  'utilities',
  'maintenance',
  'events',
  'missions',
  'education',
  'other'
);

-- Create members table
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  address text NOT NULL,
  contact_number text NOT NULL,
  membership_date date NOT NULL,
  membership_type membership_type NOT NULL,
  status member_status NOT NULL DEFAULT 'active',
  profile_picture_url text,
  envelope_number text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT members_envelope_number_valid CHECK (
    envelope_number IS NULL OR 
    (envelope_number ~ '^[0-9]+$' AND envelope_number != '')
  )
);

-- Create budgets table
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  category budget_category NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_amount CHECK (amount >= 0)
);

-- Create financial transactions table
CREATE TABLE financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type financial_transaction_type NOT NULL,
  category financial_transaction_category NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  budget_id uuid REFERENCES budgets(id),
  member_id uuid REFERENCES members(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  CONSTRAINT positive_amount CHECK (amount >= 0)
);

-- Create roles table
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  module text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user roles junction table
CREATE TABLE user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role_id)
);

-- Create role permissions junction table
CREATE TABLE role_permissions (
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (role_id, permission_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  );
END;
$$;

-- Create function to handle first user admin assignment
CREATE OR REPLACE FUNCTION handle_first_user_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_role_id uuid;
  user_count int;
BEGIN
  -- Get the total number of users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- If this is the first user
  IF user_count = 1 THEN
    -- Get the admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    -- Assign admin role to the user
    INSERT INTO user_roles (user_id, role_id, created_by)
    VALUES (NEW.id, admin_role_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign admin role to first user
DROP TRIGGER IF EXISTS assign_first_user_admin ON auth.users;
CREATE TRIGGER assign_first_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_first_user_admin();

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full system access'),
  ('treasurer', 'Financial management access'),
  ('pastor', 'Member management and reporting access'),
  ('member', 'Basic member access')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (code, name, description, module) VALUES
  -- User Management
  ('user.view', 'View Users', 'Can view user list and details', 'users'),
  ('user.create', 'Create Users', 'Can create new users', 'users'),
  ('user.edit', 'Edit Users', 'Can edit user details', 'users'),
  ('user.delete', 'Delete Users', 'Can delete users', 'users'),
  
  -- Role Management
  ('role.view', 'View Roles', 'Can view roles and permissions', 'roles'),
  ('role.create', 'Create Roles', 'Can create new roles', 'roles'),
  ('role.edit', 'Edit Roles', 'Can edit role details and permissions', 'roles'),
  ('role.delete', 'Delete Roles', 'Can delete roles', 'roles'),
  
  -- Member Management
  ('member.view', 'View Members', 'Can view member list and profiles', 'members'),
  ('member.create', 'Create Members', 'Can add new members', 'members'),
  ('member.edit', 'Edit Members', 'Can edit member details', 'members'),
  ('member.delete', 'Delete Members', 'Can delete members', 'members'),
  
  -- Financial Management
  ('finance.view', 'View Finances', 'Can view financial records', 'finances'),
  ('finance.create', 'Create Transactions', 'Can create financial transactions', 'finances'),
  ('finance.edit', 'Edit Transactions', 'Can edit financial transactions', 'finances'),
  ('finance.delete', 'Delete Transactions', 'Can delete financial transactions', 'finances'),
  ('finance.approve', 'Approve Transactions', 'Can approve financial transactions', 'finances'),
  ('finance.report', 'Generate Reports', 'Can generate financial reports', 'finances'),
  
  -- Budget Management
  ('budget.view', 'View Budgets', 'Can view budgets', 'budgets'),
  ('budget.create', 'Create Budgets', 'Can create new budgets', 'budgets'),
  ('budget.edit', 'Edit Budgets', 'Can edit budgets', 'budgets'),
  ('budget.delete', 'Delete Budgets', 'Can delete budgets', 'budgets')
ON CONFLICT (code) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign financial permissions to treasurer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'treasurer'
AND p.module IN ('finances', 'budgets')
ON CONFLICT DO NOTHING;

-- Assign member management permissions to pastor role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'pastor'
AND p.module IN ('members', 'finances')
AND p.code NOT IN ('finance.delete', 'finance.approve')
ON CONFLICT DO NOTHING;

-- Create RLS policies
CREATE POLICY "Members are viewable by authenticated users"
  ON members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Members can be managed by authenticated users"
  ON members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Budgets are viewable by authenticated users"
  ON budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Budgets can be managed by authenticated users"
  ON budgets FOR ALL
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Financial transactions are viewable by authenticated users"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Financial transactions can be managed by authenticated users"
  ON financial_transactions FOR ALL
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Roles are viewable by authenticated users"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Roles can be managed by admins"
  ON roles FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Permissions are viewable by authenticated users"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permissions can be managed by admins"
  ON permissions FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "User roles are viewable by authenticated users"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "User roles can be managed by admins"
  ON user_roles FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Role permissions are viewable by authenticated users"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Role permissions can be managed by admins"
  ON role_permissions FOR ALL
  TO authenticated
  USING (is_admin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;