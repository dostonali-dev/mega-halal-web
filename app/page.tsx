export default function Home() {
  return (
    <main className="min-h-screen bg-green-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold text-green-700 text-center">
          Mega Halal Supermarket
        </h1>

        <p className="text-center text-gray-600 mt-4 text-xl">
          Koreya bo'ylab Halal mahsulotlar yetkazib berish
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">🥤 Ichimliklar</h2>
            <ul className="mt-3">
              <li>Coca Cola 1.5L — 3,250₩</li>
              <li>Fanta 1.5L — 2,150₩</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">🥩 Go'sht mahsulotlari</h2>
            <ul className="mt-3">
              <li>Mol oldi son 1kg — 15,600₩</li>
              <li>Mol ichki son 1kg — 15,300₩</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">🥛 Sut mahsulotlari</h2>
            <ul className="mt-3">
              <li>Milkovita sut 1L — 1,990₩</li>
              <li>Ayron 500ml — 2,500₩</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-2xl font-bold">🍰 Shirinliklar</h2>
            <ul className="mt-3">
              <li>Cake Medovik — 5,000₩</li>
              <li>Cake Snickers — 5,000₩</li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-10">
          <button className="bg-green-600 text-white px-8 py-3 rounded-xl text-lg">
            Buyurtma berish
          </button>
        </div>
      </div>
    </main>
  );
}