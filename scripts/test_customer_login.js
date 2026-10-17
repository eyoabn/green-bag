async function testCustomer() {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer.selam@gmail.com',
      password: 'Password123!'
    })
  });

  const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
  const data = await res.json();
  console.log('Customer Login status:', res.status, data);
  console.log('Set-Cookie headers count:', cookies?.length);
}

testCustomer().catch(console.error);
