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