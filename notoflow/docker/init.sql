-- Grant schema ownership and permissions to notoflow user
ALTER SCHEMA public OWNER TO notoflow;

-- Grant all privileges on the public schema
GRANT ALL PRIVILEGES ON SCHEMA public TO notoflow;

-- Grant all privileges on all tables in the public schema (future-proofing)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO notoflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO notoflow;

-- Grant all privileges on all sequences in the public schema
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO notoflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO notoflow;

-- Grant all privileges on all functions in the public schema
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO notoflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO notoflow;
