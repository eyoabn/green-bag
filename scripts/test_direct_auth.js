const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://heslqxyonklerdcxjohf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlc2xxeHlvbmtsZXJkY3hqb2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODMyOTIsImV4cCI6MjEwNDU1OTI5Mn0.NaVbb5W4lZa82GjtFBjE3hur60p68v5r13OdOwp3iwE';

console.log('Testing Supabase login with:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@arenguade.com',
    password: 'Password123!',
  });

  console.log('Login result:');
  console.log('Data:', data);
  console.log('Error:', error);
}

testLogin().catch(console.error);
