"use client"; 
import { useState, useEffect } from "react"; 
import { db } from "@/lib/firebaseConfig"; 
import { collection, getDocs } from "firebase/firestore"; 
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"; 
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 
import { useTheme } from "@/components/ThemeContext"; 
import { useSession } from "next-auth/react"; 

export default function DashboardPage() {
  const { isDarkMode } = useTheme(); 
  const { data: session } = useSession(); 
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [viewType, setViewType] = useState("day"); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 

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

  const filterSales = (sales, viewType, selectedDate) => {
    const selected = new Date(selectedDate);
    return sales.filter((sale) => {
      const saleDate = new Date(sale.timestamp); 
      if (viewType === "day") {
        return (
          saleDate.getFullYear() === selected.getFullYear() &&
          saleDate.getMonth() === selected.getMonth() &&
          saleDate.getDate() === selected.getDate()
        );
      } else if (viewType === "month") {
        return (
          saleDate.getFullYear() === selected.getFullYear() &&
          saleDate.getMonth() === selected.getMonth()
        );
      } else if (viewType === "year") {
        return saleDate.getFullYear() === selected.getFullYear();
      }
      return false;
    });
  };

  const groupSales = (sales, viewType) => {
    const grouped = {};
    sales.forEach((sale) => {
      const saleDate = new Date(sale.timestamp);
      let key;
      if (viewType === "day") {
        key = saleDate.getHours().toString().padStart(2, "0") + ":00"; 
      } else if (viewType === "month") {
        key = saleDate.getDate().toString().padStart(2, "0"); 
      } else if (viewType === "year") {
        key = saleDate.toLocaleString("default", { month: "short" }); 
      }
      if (!grouped[key]) {
        grouped[key] = { revenue: 0, profit: 0 };
      }
      grouped[key].revenue += sale.totalAmount;
      const cost = sale.quantity * sale.costPrice;
      grouped[key].profit += sale.totalAmount - cost;
    });
    const chartData = Object.entries(grouped).map(([key, data]) => ({
      time: key,
      revenue: data.revenue,
      profit: data.profit,
    }));
    if (viewType === "day" || viewType === "month") {
      return chartData.sort((a, b) => parseInt(a.time) - parseInt(b.time));
    } else if (viewType === "year") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return chartData.sort(
        (a, b) => months.indexOf(a.time) - months.indexOf(b.time)
      );
    }
    return chartData;
  };

  const filteredSales = filterSales(sales, viewType, selectedDate);
  const chartData = groupSales(filteredSales, viewType);

  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  const totalProfit = filteredSales.reduce((sum, sale) => {
    const cost = sale.quantity * sale.costPrice;
    return sum + (sale.totalAmount - cost);
  }, 0);

  if (loading) {
    return (
      <p className="text-gray-900 dark:text-white p-4">Loading dashboard...</p>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Dashboard Overview
      </h1>

      <div className="mb-4 flex items-center">
        <label className="mr-2 text-gray-900 dark:text-white">View Type:</label>
        <select
          value={viewType}
          onChange={(e) => setViewType(e.target.value)}
          className="mr-4 p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
        >
          <option value="day">Day</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat={
            viewType === "day"
              ? "yyyy/MM/dd"
              : viewType === "month"
              ? "yyyy/MM"
              : "yyyy"
          }
          showMonthYearPicker={viewType === "month"} 
          showYearPicker={viewType === "year"} 
          className="p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
        />
      </div>

      <p className="mb-4 text-gray-900 dark:text-white">
        Showing data for{" "}
        {viewType === "day"
          ? selectedDate.toLocaleDateString()
          : viewType === "month"
          ? selectedDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })
          : selectedDate.getFullYear()}
      </p>

      {session?.user?.role === "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {viewType === "day"
                ? "Hourly"
                : viewType === "month"
                ? "Daily"
                : "Monthly"}{" "}
              Sales and Profit
            </h2>
            {chartData.length > 0 ? (
              <BarChart width={500} height={300} data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.grid}
                />
                <XAxis dataKey="time" tick={{ fill: chartColors.text }} />
                <YAxis tick={{ fill: chartColors.text }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill={chartColors.bar} name="Revenue" />
                <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
              </BarChart>
            ) : (
              <p className="text-gray-900 dark:text-white">
                No sales data for this period.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <h3 className="text-gray-900 dark:text-white">Total Products</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {products.length}
          </p>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
          <h3 className="text-gray-900 dark:text-white">
            Total Sales Transactions
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredSales.length}
          </p>
        </div>
        {session?.user?.role === "admin" && (
          <>
            <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg">
              <h3 className="text-gray-900 dark:text-white">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₦{totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
              <h3 className="text-gray-900 dark:text-white">Total Profit</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₦{totalProfit.toFixed(2)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}