-- Migration: Secure 2FA Secrets
-- Move 2FA secrets to a service-role-only table for security

-- Create secure table for 2FA secrets (NOT accessible by users via RLS)
CREATE TABLE IF NOT EXISTS public.secure_2fa_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  secret TEXT NOT NULL,
  backup_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- NO RLS policies - only service_role can access this table
-- This is intentional for security
ALTER TABLE public.secure_2fa_secrets ENABLE ROW LEVEL SECURITY;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_secure_2fa_secrets_user_id ON public.secure_2fa_secrets(user_id);

-- Function to enable 2FA (server-side only, called via Edge Function)
CREATE OR REPLACE FUNCTION public.enable_2fa_secure(
  p_user_id UUID,
  p_secret TEXT,
  p_backup_codes TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update 2FA secret in secure table
  INSERT INTO public.secure_2fa_secrets (user_id, secret, backup_codes, updated_at)
  VALUES (p_user_id, p_secret, p_backup_codes, now())
  ON CONFLICT (user_id) DO UPDATE SET
    secret = EXCLUDED.secret,
    backup_codes = EXCLUDED.backup_codes,
    updated_at = now();
  
  -- Update profiles to mark 2FA as enabled
  UPDATE public.profiles
  SET twofa_enabled = true
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$;