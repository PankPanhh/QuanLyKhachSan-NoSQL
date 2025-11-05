export function isPaymentSuccessful(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  // handle proper Vietnamese "Thành công", partial payments "Thanh toán một phần"
  // and potential mojibake variants containing "ThÃ" or english 'success'
  return (
    s.includes('thành') ||
    s.includes('thanh toán') ||
    s.includes('thÃ') ||
    s.includes('thanh cong') ||
    s.includes('success')
  );
}
