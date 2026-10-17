const uniqueEmail = `test.customer.${Date.now()}@testgreenwork.com`;

async function testSignup() {
  const res = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'Password123!',
      fullName: 'Abebe Test Customer',
      phone: '0911888999'
    })
  });

  const data = await res.json();
  console.log('Signup status:', res.status, data);
}

testSignup().catch(console.error);
