// Simplified Database Types - Bypass strict typing
export type Json = any

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: any
        Insert: any
        Update: any
      }
    }
  }
}
