// Yetkazib berish (tekpe) narxi va bepul yetkazib berish chegarasi.
// Mijoz shu summadan ko'proq xarid qilsa, yetkazib berish bepul bo'ladi.
export const DELIVERY_FEE = 4000;
export const FREE_SHIPPING_THRESHOLD = 300000;

export function getDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;
}

export function getFreeShippingRemaining(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}
