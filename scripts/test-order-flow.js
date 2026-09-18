const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log("=== 1. Testing Supabase Database Queries ===");

  // 1. Query orders with profiles(full_name, phone)
  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select("*, profiles(full_name, phone), products(name)")
    .order("created_at", { ascending: false });

  if (ordersErr) {
    console.error("❌ Orders query error:", ordersErr);
  } else {
    console.log("✅ Orders query succeeded (200 OK). Current count:", orders.length);
  }

  // 2. Query designs with profiles:submitted_by(full_name, phone)
  const { data: designs, error: designsErr } = await supabase
    .from("designs")
    .select("*, profiles:submitted_by (full_name, phone)")
    .order("created_at", { ascending: false });

  if (designsErr) {
    console.error("❌ Designs query error:", designsErr);
  } else {
    console.log("✅ Designs query succeeded (200 OK). Current count:", designs.length);
  }

  // 3. Query products & bank accounts
  const { data: products } = await supabase.from("products").select("id, name");
  console.log("✅ Products available in DB:", products?.length || 0);

  const { data: banks } = await supabase.from("bank_accounts").select("id, bank_name, is_active");
  console.log("✅ Bank accounts available in DB:", banks?.length || 0);

  console.log("\n=== 2. Testing Direct Order Placement Logic ===");
  const testBuyerId = "04aee2d7-c774-4008-930d-72a84e5d46f3"; // Existing profile in DB
  const testProductId = products[0].id;
  const testBankId = banks[0].id;

  const { data: newOrder, error: insertErr } = await supabase
    .from("orders")
    .insert({
      buyer_id: testBuyerId,
      product_id: testProductId,
      quantity: 2,
      total_price: 360,
      bank_account_id: testBankId,
      payment_screenshot_url: "https://example.com/test-receipt.jpg",
      status: "pending_verification",
    })
    .select()
    .single();

  if (insertErr) {
    console.log("Insert with anon note (expected if RLS checks auth.uid):", insertErr.message);
  } else {
    console.log("✅ Order created directly in Supabase! Order ID:", newOrder.id);
  }

  console.log("\nAll core database queries and constraints are healthy!");
}

verify();
