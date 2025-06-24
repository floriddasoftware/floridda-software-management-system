"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { db } from "@/lib/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { utils, writeFile } from "xlsx-js-style";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";

export default function DashboardClient({ initialSalesData, initialProductsData }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [salesData, setSalesData] = useState(initialSalesData || []);
  const [productsData, setProductsData] = useState(initialProductsData || []);
  const [viewType, setViewType] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const unsubscribeSales = onSnapshot(
      collection(db, "sales"),
      (snapshot) => {
        const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSalesData(sales);
      },
      (error) => {
        toast.error("Failed to load sales data.");
      }
    );

    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProductsData(products);
      },
      (error) => {
        toast.error("Failed to load products data.");
      }
    );

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
    };
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const chartColors = {
    text: isDarkMode ? "#fff" : "#000",
    grid: isDarkMode ? "#4a5568" : "#cbd5e0",
    bar: isDarkMode ? "#4299e1" : "#2b6cb0",
  };

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
      grouped[key].revenue += Number(sale.totalAmount || 0);
      if (includeProfit) {
        const cost = Number(sale.quantity || 0) * Number(sale.costPrice || 0);
        grouped[key].profit += Number(sale.totalAmount || 0) - cost;
      }
    });
    const chartData = Object.entries(grouped).map(([key, data]) => ({
      time: key,
      revenue: data.revenue,
      ...(includeProfit && { profit: data.profit }),
    }));
    if (viewType === "day" || viewType === "month") {
      return chartData.sort((a, b) => parseInt(a.time) - parseInt(b.time));
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return chartData.sort((a, b) => months.indexOf(a.time) - months.indexOf(b.time));
    }
  };

  const getSalesByCategory = (sales, products) => {
    const categoryMap = products.reduce((map, product) => {
      map[product.id] = product.category || "Unknown";
      return map;
    }, {});
    const salesByCategory = sales.reduce((acc, sale) => {
      const category = categoryMap[sale.productId] || "Unknown";
      acc[category] = (acc[category] || 0) + Number(sale.totalAmount || 0);
      return acc;
    }, {});
    return Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));
  };

  const generateSalesReport = () => {
    setGeneratingReport(true);
    try {
      const reportData = filteredSales.map((sale) => ({
        Date: new Date(sale.timestamp).toLocaleString(),
        Product: sale.item,
        Quantity: sale.quantity,
        "Unit Price": sale.salePrice,
        "Total Amount": sale.totalAmount,
        "Salesperson": sale.salespersonId,
      }));
      const worksheet = utils.json_to_sheet(reportData);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Sales Report");
      writeFile(workbook, `sales-report-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      toast.error("Failed to generate report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const userSales =
    session.user.role !== "admin"
      ? salesData.filter((sale) => sale.salespersonId === session.user.email)
      : salesData;
  const filteredSales = filterSales(userSales, viewType, selectedDate);
  const chartData = groupSales(filteredSales, viewType, session.user.role === "admin");
  const salesByCategory =
    session.user.role === "admin" ? getSalesByCategory(filteredSales, productsData) : [];

  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount || 0),
    0
  );
  const totalProfit =
    session.user.role === "admin"
      ? filteredSales.reduce(
          (sum, sale) =>
            sum + (Number(sale.totalAmount || 0) - Number(sale.quantity || 0) * Number(sale.costPrice || 0)),
          0
        )
      : 0;

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Dashboard Overview
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center">
          <label className="mr-2 text-gray-900 dark:text-white">View Type:</label>
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="day">Day</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat={viewType === "day" ? "yyyy/MM/dd" : viewType === "month" ? "yyyy/MM" : "yyyy"}
          showMonthYearPicker={viewType === "month"}
          showYearPicker={viewType === "year"}
          className="p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
        />
        {session.user.role === "admin" && (
          <Button
            onClick={generateSalesReport}
            className="ml-auto bg-green-600 hover:bg-green-700"
            disabled={generatingReport}
          >
            {generatingReport ? <LoadingSpinner size="sm" /> : "Download Report"}
          </Button>
        )}
      </div>

      <p className="mb-4 text-gray-900 dark:text-white">
        Showing data for{" "}
        {viewType === "day"
          ? selectedDate.toLocaleDateString()
          : viewType === "month"
          ? selectedDate.toLocaleString("default", { month: "long", year: "numeric" })
          : selectedDate.getFullYear()}
      </p>

      {session.user.role === "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">
              {viewType === "day" ? "Hourly" : viewType === "month" ? "Daily" : "Monthly"} Sales and Profit
            </h2>
            {chartData.length > 0 ? (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="time" tick={{ fill: chartColors.text }} />
                    <YAxis tick={{ fill: chartColors.text }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill={chartColors.bar} name="Revenue" />
                    <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-900 dark:text-white">No sales data for this period.</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Sales by Category</h2>
            {salesByCategory.length > 0 ? (
              <div className="w-full h-80">
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-900 dark:text-white">No sales data for this period.</p>
            )}
          </div>
        </div>
      )}

      {session.user.role !== "admin" && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-8">
          <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">
            Your {viewType === "day" ? "Hourly" : viewType === "month" ? "Daily" : "Monthly"} Sales
          </h2>
          {chartData.length > 0 ? (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="time" tick={{ fill: chartColors.text }} />
                  <YAxis tick={{ fill: chartColors.text }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill={chartColors.bar} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-900 dark:text-white">No sales data for this period.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <h3 className="text-gray-900 dark:text-white">Total Products</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {productsData.length}
          </p>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
          <h3 className="text-gray-900 dark:text-white">
            {session.user.role === "admin" ? "Total Sales Transactions" : "Your Sales Transactions"}
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
            <h3 className="text-gray-900 dark:text-white">Your Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₦{totalRevenue.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}