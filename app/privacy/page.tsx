export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 pb-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Maxfiylik siyosati</h1>
        <p className="text-sm text-gray-400 mb-8">Oxirgi yangilanish: 2026-yil</p>

        <div className="space-y-6 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-2">1. Umumiy ma'lumot</h2>
            <p>
              Ushbu maxfiylik siyosati "Mega Halal Supermarket" ("biz", "bizning xizmatimiz") tomonidan
              megahalal.net veb-sayti va unga bog'liq mobil ilovalar orqali yig'iladigan shaxsiy
              ma'lumotlarni qanday to'plashimiz, ishlatishimiz va himoya qilishimizni tushuntiradi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">2. Biz yig'adigan ma'lumotlar</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Ism va telefon raqami (ro'yxatdan o'tishda)</li>
              <li>Yetkazib berish manzili (matn yoki rasm ko'rinishida)</li>
              <li>Buyurtma tarixi va sotib olingan mahsulotlar</li>
              <li>To'lov cheki rasmi (buyurtmani tasdiqlash uchun)</li>
              <li>Tanlangan til va boshqa ilova sozlamalari</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">3. Ma'lumotlardan qanday foydalanamiz</h2>
            <p>Yig'ilgan ma'lumotlar faqat quyidagi maqsadlarda ishlatiladi:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Buyurtmalaringizni qabul qilish va yetkazib berish</li>
              <li>Siz bilan buyurtma holati haqida bog'lanish</li>
              <li>Hisobingizni boshqarish (kirish, manzillar, buyurtma tarixi)</li>
              <li>Xizmat sifatini yaxshilash</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">4. Ma'lumotlarni saqlash</h2>
            <p>
              Ma'lumotlaringiz Supabase (xavfsiz bulutli ma'lumotlar bazasi) orqali saqlanadi.
              To'lov cheklari va manzil rasmlari shifrlangan bulutli xotirada saqlanadi.
              Ma'lumotlaringiz uchinchi shaxslarga sotilmaydi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">5. Uchinchi tomon xizmatlari</h2>
            <p>
              Buyurtma ma'lumotlari va to'lov cheklari do'kon jamoasiga xabar berish uchun Telegram
              orqali yuboriladi. Bu faqat buyurtmani qayta ishlash uchun ishlatiladi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">6. Sizning huquqlaringiz</h2>
            <p>
              Istalgan vaqtda profilingiz orqali shaxsiy ma'lumotlaringizni ko'rish, o'zgartirish
              yoki hisobingizni butunlay o'chirishingiz mumkin ("Profil → Akkauntni o'chirish").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">7. Bog'lanish</h2>
            <p>
              Maxfiylik siyosati bo'yicha savollaringiz bo'lsa, biz bilan Telegram orqali
              bog'lanishingiz mumkin: <a href="https://t.me/megahalalsuppermarket" className="text-green-400 underline">@megahalalsuppermarket</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}