// Ochiq turgan modal/oynachalarning umumiy "stek"i. Har bir modal ochilganda
// o'zining yopish funksiyasini shu yerga qo'shadi, yopilganda olib tashlaydi.
// Android'ning jismoniy "orqaga" tugmasi bosilganda (BackButtonHandler.tsx),
// eng oxirgi ochilgan modal birinchi yopiladi - ilova esa faqat hech qanday
// modal ochiq bo'lmaganda chiqadi/orqaga navigatsiya qiladi.
type CloseFn = () => void;

const stack: CloseFn[] = [];

export function pushModal(closeFn: CloseFn) {
  stack.push(closeFn);
}

export function popModal(closeFn: CloseFn) {
  const idx = stack.lastIndexOf(closeFn);
  if (idx !== -1) stack.splice(idx, 1);
}

// Eng tepadagi modalni yopadi. Biror narsa yopilgan bo'lsa true qaytaradi.
export function closeTopModal(): boolean {
  const closeFn = stack.pop();
  if (closeFn) {
    closeFn();
    return true;
  }
  return false;
}

export function hasOpenModal(): boolean {
  return stack.length > 0;
}
