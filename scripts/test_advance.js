async function testAdvance() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@arenguade.com', password: 'Password123!' })
  });
  const cookie = loginRes.headers.get('set-cookie');

  const ordersRes = await fetch('http://localhost:3000/api/orders', {
    headers: { cookie }
  });
  const ordersData = await ordersRes.json();
  const order = ordersData.orders[0];
  console.log('Order current status:', order.id, order.status);

  const res = await fetch(`http://localhost:3000/api/orders/${order.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ action: 'advance_status', status: 'delivered' })
  });
  const data = await res.json();
  console.log('Advance status response:', res.status, data);
}

testAdvance().catch(console.error);
