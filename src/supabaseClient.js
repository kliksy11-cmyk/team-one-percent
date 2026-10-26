import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkasgrpnminmyretfhkc.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYXNncnBubWlubXlyZXRmaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NTM1MjIsImV4cCI6MjEwODMyOTUyMn0.N5tmhm6Hfa3Qf21DOto1j55NM3hpAxWvaouL318agx4';

export const sb = createClient(supabaseUrl, supabaseAnonKey);
