"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function DashboardPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const salesSnapshot = await getDocs(collection(db, "sales"));
        const salesData = salesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSales(salesData);

        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <p className="text-gray-900 dark:text-white">Loading dashboard...</p>
    );

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + (sale.totalAmount || 0),
    0
  );
  const bestSelling = [...sales]
    .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
    .slice(0, 3);
  const recentSales = sales.slice(0, 5);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Total Revenue
          </h2>
          <p className="text-2xl text-gray-900 dark:text-white">
            &#8358;{totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Best-Selling Products
          </h2>
          <ul className="list-disc pl-5 text-gray-900 dark:text-white">
            {bestSelling.map((sale) => (
              <li key={sale.id}>
                {sale.item || sale.productId || "N/A"} - {sale.quantity || 0}{" "}
                sold
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Sales
          </h2>
          <ul className="list-disc pl-5 text-gray-900 dark:text-white">
            {recentSales.map((sale) => (
              <li key={sale.id}>
                {sale.item || sale.productId || "N/A"} - &#8358;
                {sale.totalAmount || 0}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}