const { createClient } = require('@supabase/supabase-js');

async function testEnroll() {
  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer.selam@gmail.com', password: 'Password123!' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login cookie:', cookie);

  // 2. Get class
  const classRes = await fetch('http://localhost:3000/api/classes');
  const classData = await classRes.json();
  const session = classData.classes[0];
  console.log('Selected session:', session.id, session.title);

  // 3. Enroll
  const regRes = await fetch('http://localhost:3000/api/enrollments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookie || ''
    },
    body: JSON.stringify({
      sessionId: session.id,
      paymentProofPath: 'payment-proofs/workshop_receipt.jpg'
    })
  });

  const regData = await regRes.json();
  console.log('Enroll status:', regRes.status, regData);
}

testEnroll().catch(console.error);
