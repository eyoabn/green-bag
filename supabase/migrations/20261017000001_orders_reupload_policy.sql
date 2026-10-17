-- Allow customers to re-upload payment proof when order status is 'rejected'
DROP POLICY IF EXISTS "Admins update orders, users cancel pending" ON public.orders;
DROP POLICY IF EXISTS "Admins update orders, users update pending or rejected" ON public.orders;

CREATE POLICY "Admins update orders, users update pending or rejected" ON public.orders
  FOR UPDATE USING (
    public.is_admin() OR 
    (buyer_id = auth.uid() AND status IN ('pending_payment', 'pending_verification', 'rejected'))
  )
  WITH CHECK (
    public.is_admin() OR 
    (buyer_id = auth.uid() AND status IN ('pending_payment', 'pending_verification', 'cancelled'))
  );
