import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nwwtispqnamyrbznkrin.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3Rpc3BxbmFteXJiem5rcmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NDYxOTYsImV4cCI6MjEwNzUyMjE5Nn0.a3aTS19cHMZxgFT-IhEfYyvCKOtk2TCamZb4HiHBVfM';

export const supabase = createClient(supabaseUrl, supabaseKey);