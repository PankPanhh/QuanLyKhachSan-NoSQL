export function isPaymentSuccessful(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return (
    s.includes('thành') ||
    s.includes('thanh toán') ||
    s.includes('thÃ') ||
    s.includes('thanh cong') ||
    s.includes('success')
  );
}
