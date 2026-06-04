import { createClient } from '@supabase/supabase-js'
import { config } from '../config'

// Client for public operations (with RLS)
export const supabase = createClient(config.supabase.url, config.supabase.anonKey)

// Admin client for service operations (bypasses RLS)
export const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
