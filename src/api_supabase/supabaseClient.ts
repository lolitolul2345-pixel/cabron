import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jibiidxlvntuglkpmcay.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYmlpZHhsdm50dWdsa3BtY2F5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDE3NTgyMSwiZXhwIjoyMTA5NzUxODIxfQ.Y7hgajQBz1Hqyot6ZoCOzB5soXWEBOh9_nE289jceog';

export const supabase = createClient(supabaseUrl, supabaseKey);