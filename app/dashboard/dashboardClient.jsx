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
import { collection, getDocs } from "firebase/firestore";
import { CSVLink } from "react-csv";
import Table from "@/components/Table";

export default function DashboardClient({ salesData, productsData }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [viewType, setViewType] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch branches for admins
  useEffect(() => {
    if (session?.user?.role === "admin") {
      const fetchBranches = async () => {
        setLoading(true);
        try {
          const snapshot = await getDocs(collection(db, "branches"));
          const branchData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setBranches(branchData);
        } catch (error) {
          console.error("Error fetching branches:", error);
          setBranches([]);
        } finally {
          setLoading(false);
        }
      };
      fetchBranches();
    }
  }, [session]);

  // Filter sales based on branch, view type, and date
  useEffect(() => {
    if (!salesData || !session) return;

    let sales = salesData;
    if (session.user.role === "admin") {
      if (selectedBranch !== "all") {
        sales = sales.filter((sale) => sale.branchId === selectedBranch);
      }
    } else if (session.user.branchId) {
      // Salespeople only see their branch's sales
      sales = sales.filter((sale) => sale.branchId === session.user.branchId);
    }
    setFilteredSales(filterSales(sales, viewType, selectedDate));
  }, [session, salesData, selectedBranch, viewType, selectedDate]);

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
    return Object.entries(salesByCategory).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const chartData = groupSales(
    filteredSales,
    viewType,
    session?.user?.role === "admin"
  );
  const salesByCategory =
    session?.user?.reole === "admin"
      ? getSalesByCategory(filteredSales, productsData)
      : [];

  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount || 0),
    0
  );
  const totalProfit =
    session?.user?.role === "admin"
      ? filteredSales.reduce(
          (sum, sale) =>
            sum +
            (Number(sale.totalAmount || 0) -
              Number(sale.quantity || 0) * Number(sale.costPrice || 0)),
          0
        )
      : 0;

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  const csvData = filteredSales.map((sale) => ({
    Item: sale.item || "N/A",
    Quantity: sale.quantity || 0,
    TotalAmount: sale.totalAmount || 0,
    Timestamp: sale.timestamp || "N/A",
    BranchId: sale.branchId || "N/A",
    SalespersonId: sale.salespersonId || "N/A",
  }));

  const salesColumns = [
    { key: "item", label: "Item" },
    { key: "quantity", label: "Quantity" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "paymentMethod", label: "Payment Method" },
    {
      key: "timestamp",
      label: "Date",
      render: (row) => new Date(row.timestamp).toLocaleString(),
    },
    { key: "salespersonId", label: "Salesperson" },
  ];

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <p className="text-gray-900 dark:text-white p-4">Loading dashboard...</p>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Dashboard Overview
      </h1>

      <div className="mb-4 flex items-center flex-wrap gap-2">
        <label className="mr-2 text-gray-900 dark:text-white md:text-lg text-xs">
          View Type:
        </label>
        <select
          value={viewType}
          onChange={(e) => setViewType(e.target.value)}
          className="md:mr-4 mr-2 md:p-2 md:w-24 w-20 border rounded bg-white dark:bg-gray-700 dark:text-white md:text-lg text-xs"
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
          className="md:p-2 p-1 border rounded md:w-32 w-24 bg-white dark:bg-gray-700 dark:text-white md:text-lg text-xs"
        />
        {session.user.role === "admin" && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="md:ml-4 ml-2 md:p-2 p-1 md:w-32 w-24 border rounded bg-white dark:bg-gray-700 dark:text-white md:text-lg text-xs"
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} ({branch.location})
              </option>
            ))}
          </select>
        )}
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
        {session.user.role === "admin" &&
          ` - ${
            selectedBranch === "all"
              ? "All Branches"
              : branches.find((b) => b.id === selectedBranch)?.name || "Unknown"
          }`}
        {session.user.role === "salesperson" &&
          ` - ${
            branches.find((b) => b.id === session.user.branchId)?.name ||
            "Your Branch"
          }`}
      </p>

      {session.user.role === "admin" && (
        <>
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
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

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Transaction History
            </h2>
            {filteredSales.length > 0 ? (
              <Table columns={salesColumns} data={filteredSales} />
            ) : (
              <p className="text-gray-900 dark:text-white">
                No transactions for this period.
              </p>
            )}
          </div>

          <div className="flex justify-end mt-4 mb-4">
            <CSVLink
              data={csvData}
              filename={`sales_report_${
                selectedBranch === "all" ? "all_branches" : selectedBranch
              }.csv`}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download Report
            </CSVLink>
          </div>
        </>
      )}

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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <h3 className="text-gray-900 dark:text-white">Total Products</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {productsData.length}
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