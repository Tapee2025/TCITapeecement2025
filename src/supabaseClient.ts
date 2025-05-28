import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://spvwilyeuydjnhunracm.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY'; // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdndpbHlldXlkam5odW5yYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MDg4MTcsImV4cCI6MjA2Mzk4NDgxN30.ue_O-UNeAPeHAkeVPE87qw5-cWF7xuuJXbijGskA18M
export const supabase = createClient(supabaseUrl, supabaseKey);
