"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import {
  BarChart,
  PieChart,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useTheme } from "@/components/ThemeContext";

export default function DashboardPage() {
  const { isDarkMode } = useTheme();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const chartColors = {
    text: isDarkMode ? "#fff" : "#000",
    grid: isDarkMode ? "#4a5568" : "#cbd5e0",
    bar: isDarkMode ? "#4299e1" : "#2b6cb0",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const salesSnapshot = await getDocs(collection(db, "sales"));
        const salesData = salesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: new Date(doc.data().timestamp).toLocaleDateString(),
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

  const processChartData = () => {
    const dailySales = sales.reduce((acc, sale) => {
      acc[sale.date] = (acc[sale.date] || 0) + sale.totalAmount;
      return acc;
    }, {});

    const categoryDistribution = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + product.quantity;
      return acc;
    }, {});

    return {
      dailySales: Object.entries(dailySales).map(([date, amount]) => ({
        date,
        amount,
      })),
      categoryData: Object.entries(categoryDistribution).map(
        ([name, value]) => ({ name, value })
      ),
    };
  };

  const { dailySales, categoryData } = processChartData();

  if (loading)
    return (
      <p className="text-gray-900 dark:text-white p-4">Loading dashboard...</p>
    );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Daily Sales
          </h2>
          <BarChart width={500} height={300} data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="date" tick={{ fill: chartColors.text }} />
            <YAxis tick={{ fill: chartColors.text }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill={chartColors.bar} name="Daily Revenue" />
          </BarChart>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Inventory by Category
          </h2>
          <PieChart width={500} height={300}>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {categoryData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <h3 className="text-gray-900 dark:text-white">Total Products</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {products.length}
          </p>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
          <h3 className="text-gray-900 dark:text-white">Total Sales</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {sales.length}
          </p>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg">
          <h3 className="text-gray-900 dark:text-white">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₦
            {sales
              .reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
              .toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}