"use client";

import { useState } from "react";

export default function Home() {
  const [cart, setCart] = useState<any>({});

  const products = [
    { id: 1, name: "Coca Cola 1.5L", price: 3250, category: "🥤 Ichimliklar" },
    { id: 2, name: "Fanta 1.5L", price: 2150, category: "🥤 Ichimliklar" },

    { id: 3, name: "Mol oldi son 1kg", price: 15600, category: "🥩 Go'sht mahsulotlari" },
    { id: 4, name: "Mol ichki son 1kg", price: 15300, category: "🥩 Go'sht mahsulotlari" },

    { id: 5, name: "Milkovita sut 1L", price: 1990, category: "🥛 Sut mahsulotlari" },
    { id: 6, name: "Ayron 500ml", price: 2500, category: "🥛 Sut mahsulotlari" },

    { id: 7, name: "Cake Medovik", price: 5000, category: "🍰 Shirinliklar" },
    { id: 8, name: "Cake Snickers", price: 5000, category: "🍰 Shirinliklar" },
  ];

  const addToCart = (id: number) => {
    setCart({
      ...cart,
      [id]: (cart[id] || 0) + 1,
    });
  };

  const removeFromCart = (id: number) => {
    if (!cart[id]) return;

    setCart({
      ...cart,
      [id]: cart[id] - 1,
    });
  };

  const total = products.reduce(
    (sum, item) => sum + item.price * (cart[item.id] || 0),
    0
  );

  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-5xl font-bold text-green-700 text-center">
          Mega Halal Supermarket
        </h1>

        <p className="text-center text-gray-600 mt-4 text-xl">
          Koreya bo'ylab Halal mahsulotlar yetkazib berish
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-10">

          {["🥤 Ichimliklar","🥩 Go'sht mahsulotlari","🥛 Sut mahsulotlari","🍰 Shirinliklar"].map((cat) => (
            <div
              key={cat}
              className="bg-white p-6 rounded-2xl shadow"
            >
              <h2 className="text-2xl font-bold mb-4">{cat}</h2>

              {products
                .filter((p) => p.category === cat)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b py-3"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p>{item.price.toLocaleString()}₩</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="bg-red-500 text-white px-3 rounded"
                      >
                        -
                      </button>

                      <span>{cart[item.id] || 0}</span>

                      <button
                        onClick={() => addToCart(item.id)}
                        className="bg-green-600 text-white px-3 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ))}

        </div>

        <div className="bg-white mt-10 p-6 rounded-2xl shadow">
          <h2 className="text-2xl font-bold">
            Savatcha
          </h2>

          <p className="mt-3 text-xl">
            Jami: {total.toLocaleString()}₩
          </p>

          <button className="mt-4 bg-green-600 text-white px-8 py-3 rounded-xl">
            Buyurtma berish
          </button>
        </div>

      </div>
    </main>
  );
}