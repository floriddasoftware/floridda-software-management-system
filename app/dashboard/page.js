import { adminDb } from "@/lib/firebaseAdmin";
import DashboardClient from "./dashboardClient";

async function fetchDashboardData() {
  try {
    const salesSnapshot = await adminDb.collection("sales").get();
    const salesData = salesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp || new Date().toISOString(),
    }));

    const productsSnapshot = await adminDb.collection("products").get();
    const productsData = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { salesData, productsData };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { salesData: [], productsData: [] };
  }
}

export default async function DashboardPage() {
  const { salesData, productsData } = await fetchDashboardData();
  return (
    <main>
      <DashboardClient salesData={salesData} productsData={productsData} />
    </main>
  );
}