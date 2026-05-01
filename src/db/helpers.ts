/**
 * Database Helper Functions
 *
 * Wrappers to bypass TypeScript strict typing for Supabase operations
 */

import { supabaseAdmin } from './supabase'

export const db = {
  insert: (table: string, data: any) => {
    return supabaseAdmin.from(table).insert(data as any)
  },

  update: (table: string, data: any) => {
    return supabaseAdmin.from(table).update(data as any)
  },

  upsert: (table: string, data: any, options?: any) => {
    return supabaseAdmin.from(table).upsert(data as any, options)
  },

  select: (table: string) => {
    return supabaseAdmin.from(table).select()
  },

  delete: (table: string) => {
    return supabaseAdmin.from(table).delete()
  },
}
