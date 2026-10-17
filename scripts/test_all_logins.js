const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://heslqxyonklerdcxjohf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlc2xxeHlvbmtsZXJkY3hqb2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODMyOTIsImV4cCI6MjEwNDU1OTI5Mn0.NaVbb5W4lZa82GjtFBjE3hur60p68v5r13OdOwp3iwE';

const users = [
  { email: 'admin@arenguade.com', password: 'Password123!' },
  { email: 'teacher.tigist@arenguade.com', password: 'Password123!' },
  { email: 'customer.selam@gmail.com', password: 'Password123!' },
];

async function run() {
  for (const u of users) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword(u);
    console.log(`User ${u.email}:`, error ? `ERROR: ${error.message}` : `OK (id: ${data.user?.id})`);
  }
}

run().catch(console.error);
