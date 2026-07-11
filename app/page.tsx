"use client";

import { useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

export default function Home() {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const products: Product[] = [
    { id: 1, name: "Coca Cola 1.5L", price: 3250, category: "🥤 Ichimliklar" },
    { id: 2, name: "Fanta 1.5L", price: 2150, category: "🥤 Ichimliklar" },

    { id: 3, name: "Mol oldi son 1kg", price: 15600, category: "🥩 Go'sht mahsulotlari" },
    { id: 4, name: "Mol ichki son 1kg", price: 15300, category: "🥩 Go'sht mahsulotlari" },

    { id: 5, name: "Milkovita sut 1L", price: 1990, category: "🥛 Sut mahsulotlari" },
    { id: 6, name: "Ayron 500ml", price: 2500, category: "🥛 Sut mahsulotlari" },

    { id: 7, name: "Cake Medovik", price: 5000, category: "🍰 Shirinliklar" },
    { id: 8, name: "Cake Snickers", price: 5000, category: "🍰 Shirinliklar" },
  ];

  const categories = [
    "🥤 Ichimliklar",
    "🥩 Go'sht mahsulotlari",
    "🥛 Sut mahsulotlari",
    "🍰 Shirinliklar",
  ];

  const addToCart = (id: number) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => ({
      ...prev,
      [id]: Math.max((prev[id] || 0) - 1, 0),
    }));
  };

  const total = products.reduce(
    (sum, item) => sum + item.price * (cart[item.id] || 0),
    0
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold text-green-800 text-center">
          Mega Halal Supermarket
        </h1>

        <p className="text-center text-gray-600 mt-4 text-lg">
          Koreya bo'ylab Halal mahsulotlar yetkazib berish
        </p>

        <div className="mt-10 space-y-4">
          {categories.map((cat) => (
            <div
              key={cat}
              className="bg-white border border-green-100 rounded-3xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenCategory(openCategory === cat ? null : cat)
                }
                className="w-full p-5 flex justify-between items-center"
              >
                <span className="text-xl font-bold text-black">
                  {cat}
                </span>

                <span className="text-2xl text-green-700">
                  {openCategory === cat ? "−" : "+"}
                </span>
              </button>

              {openCategory === cat && (
                <div className="px-5 pb-5">
                  {products
                    .filter((p) => p.category === cat)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center border-t py-4"
                      >
                        <div>
                          <p className="font-semibold text-black">
                            {item.name}
                          </p>

                          <p className="text-green-700 font-bold">
                            {item.price.toLocaleString()}₩
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="bg-red-500 text-white w-10 h-10 rounded-lg"
                          >
                            -
                          </button>

                          <span className="text-lg font-bold text-black min-w-[25px] text-center">
                            {cart[item.id] || 0}
                          </span>

                          <button
                            onClick={() => addToCart(item.id)}
                            className="bg-green-600 text-white w-10 h-10 rounded-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-green-100 rounded-3xl shadow-xl p-6 mt-10">
          <h2 className="text-3xl font-bold text-black">
            🛒 Savatcha
          </h2>

          <p className="mt-4 text-3xl font-extrabold text-green-700">
            Jami: {total.toLocaleString()}₩
          </p>

          <button
            onClick={() => alert("Buyurtma qabul qilindi")}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-lg font-bold"
          >
            Buyurtma berish
          </button>
        </div>
      </div>
    </main>
  );
}