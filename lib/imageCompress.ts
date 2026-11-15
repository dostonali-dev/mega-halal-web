"use client";

// Telefon kamerasidan to'g'ridan-to'g'ri olingan rasmlar odatda 3-8 MB
// bo'ladi. Bunday katta rasmlarni har safar mijoz ochganda Supabase Storage
// orqali qayta-qayta yuklab yuborish "Egress" (trafik) limitini tez sarflab
// qo'yadi. Shu funksiya rasmni Supabase'ga yuklashdan OLDIN, brauzerning
// o'zida (hech qanday tashqi kutubxonasiz, Canvas API orqali) kichraytirib
// va siqib beradi - sifat deyarli farq qilmaydi, lekin fayl hajmi bir necha
// baravar kichrayadi.
export async function compressImage(
  file: File,
  opts?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<File> {
  // Rasm bo'lmasa yoki GIF (animatsiya) bo'lsa - tegmaymiz, Canvas orqali
  // qayta chizish animatsiyani yo'qotib qo'yadi.
  if (!file.type || !file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const maxWidth = opts?.maxWidth ?? 1600;
  const maxHeight = opts?.maxHeight ?? 1600;
  const quality = opts?.quality ?? 0.8;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    if (!blob) return file;

    // Ba'zan (kichik rasmlar uchun) siqilgan fayl asl fayldan kattaroq
    // chiqib qolishi mumkin - shunday holatda asl faylni qoldiramiz.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch (e) {
    // Siqishda xatolik bo'lsa (masalan brauzer qo'llab-quvvatlamasa),
    // funksiya butunlay ishlamay qolmasligi uchun asl faylni yuboramiz.
    console.error("Rasmni siqishda xatolik, asl fayl yuklanadi:", e);
    return file;
  }
}
