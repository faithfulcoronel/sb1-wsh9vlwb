-- Create function to run SQL statements (admin only)
CREATE OR REPLACE FUNCTION run_sql(sql_statement text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Only administrators can run SQL statements';
  END IF;

  -- Execute the SQL
  EXECUTE sql_statement;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION run_sql(text) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION run_sql(text) IS 
  'Executes SQL statements. Only available to administrators for database migrations.';