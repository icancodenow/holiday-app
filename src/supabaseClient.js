import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yifrumoqsvgntewmxpkz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZnJ1bW9xc3ZnbnRld214cGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjkyMTQsImV4cCI6MjA4OTcwNTIxNH0.3xUQFZuwA9DI3_Hx9kKKRis5-IlETOBQ6w3Ivzhvgv4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)