"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTheme } from "@/components/ThemeContext";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch sales and products data from Firebase
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
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  // Show loading message while session or data is loading
  if (status === "loading" || loading) {
    return (
      <p className="text-gray-900 dark:text-white p-4">Loading dashboard...</p>
    );
  }

  // If not authenticated, return nothing (redirect happens in useEffect)
  if (status === "unauthenticated") {
    return null;
  }

  // Colors for charts based on dark mode
  const chartColors = {
    text: isDarkMode ? "#fff" : "#000",
    grid: isDarkMode ? "#4a5568" : "#cbd5e0",
    bar: isDarkMode ? "#4299e1" : "#2b6cb0",
  };

  // Filter sales by date and view type (day, month, year)
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

  // Group sales data for bar chart
  const groupSales = (sales, viewType, includeProfit = false) => {
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
      grouped[key].revenue += Number(sale.totalAmount);
      if (includeProfit) {
        const cost = Number(sale.quantity) * Number(sale.costPrice);
        grouped[key].profit += Number(sale.totalAmount) - cost;
      }
    });
    const chartData = Object.entries(grouped).map(([key, data]) => ({
      time: key,
      revenue: data.revenue,
      ...(includeProfit && { profit: data.profit }),
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

  // Get sales by category for pie chart (admins only)
  const getSalesByCategory = (sales, products) => {
    const categoryMap = products.reduce((map, product) => {
      map[product.id] = product.category;
      return map;
    }, {});
    const salesByCategory = sales.reduce((acc, sale) => {
      const category = categoryMap[sale.productId] || "Unknown";
      acc[category] = (acc[category] || 0) + Number(sale.totalAmount);
      return acc;
    }, {});
    return Object.entries(salesByCategory).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Filter sales by user role (salespeople see only their sales)
  const userSales =
    session.user.role !== "admin"
      ? sales.filter((sale) => sale.salespersonId === session.user.email)
      : sales;
  const filteredSales = filterSales(userSales, viewType, selectedDate);
  const chartData = groupSales(
    filteredSales,
    viewType,
    session.user.role === "admin"
  );
  const salesByCategory =
    session.user.role === "admin"
      ? getSalesByCategory(filteredSales, products)
      : [];

  // Calculate totals
  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount),
    0
  );
  const totalProfit =
    session.user.role === "admin"
      ? filteredSales.reduce(
          (sum, sale) =>
            sum +
            (Number(sale.totalAmount) -
              Number(sale.quantity) * Number(sale.costPrice)),
          0
        )
      : 0;

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Dashboard Overview
      </h1>

      <div className="mb-4 flex items-center">
        <label className="mr-2 text-gray-900 dark:text-white md:text-lg text-xs">
          View Type:
        </label>
        <select
          value={viewType}
          onChange={(e) => setViewType(e.target.value)}
          className="md:mr-4 mr-2 md:p-2 md:w-24 w-12 border rounded bg-white dark:bg-gray-700 dark:text-white md:text-lg text-xs"
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
          className="md:p-2 p-0.5 border rounded md:w-32 w-24 bg-white dark:bg-gray-700 dark:text-white md:text-lg text-xs"
        />
      </div>

      <p className="mb-4 text-gray-900 dark:text-white md:text-lg text-xs">
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

      {/* Admin Charts */}
      {session.user.role === "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-white md:text-lg text-xs">
              {viewType === "day"
                ? "Hourly"
                : viewType === "month"
                ? "Daily"
                : "Monthly"}{" "}
              Sales and Profit
            </h2>
            {chartData.length > 0 ? (
              <div className="w-full md:h-[400px] h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />
                    <XAxis dataKey="time" tick={{ fill: chartColors.text }} />
                    <YAxis tick={{ fill: chartColors.text }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill={chartColors.bar}
                      name="Revenue"
                    />
                    <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-900 dark:text-white">
                No sales data for this period.
              </p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-white md:text-lg text-xs">
              Sales by Category
            </h2>
            {salesByCategory.length > 0 ? (
              <div className="w-full md:h-[400px] h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {salesByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-900 dark:text-white">
                No sales data for this period.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Salesperson Chart */}
      {session.user.role !== "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-white md:text-lg text-xs">
              Your{" "}
              {viewType === "day"
                ? "Hourly"
                : viewType === "month"
                ? "Daily"
                : "Monthly"}{" "}
              Sales
            </h2>
            {chartData.length > 0 ? (
              <div className="w-full md:h-[400px] h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />
                    <XAxis dataKey="time" tick={{ fill: chartColors.text }} />
                    <YAxis tick={{ fill: chartColors.text }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill={chartColors.bar}
                      name="Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-900 dark:text-white">
                No sales data for this period.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <h3 className="text-gray-900 dark:text-white">Total Products</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {products.length}
          </p>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
          <h3 className="text-gray-900 dark:text-white">
            {session.user.role === "admin"
              ? "Total Sales Transactions"
              : "Your Sales Transactions"}
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredSales.length}
          </p>
        </div>
        {session.user.role === "admin" && (
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
        {session.user.role !== "admin" && (
          <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg">
            <h3 className="text-gray-900 dark:text-white">
              Your Total Revenue
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₦{totalRevenue.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}