import { adminDb } from "@/lib/firebaseAdmin";
import DashboardClient from "./dashboardClient";

async function fetchDashboardData() {
  try {
    const salesSnapshot = await adminDb.collection("sales").get();
    const salesData = salesSnapshot.docs.map((doc) => {
      const data = doc.data();
      const convertedData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'toDate' in value) {
          convertedData[key] = value.toDate().toISOString();
        } else {
          convertedData[key] = value;
        }
      });
      return { 
        id: doc.id, 
        ...convertedData,
        timestamp: convertedData.timestamp || new Date().toISOString()
      };
    });

    const productsSnapshot = await adminDb.collection("products").get();
    const productsData = productsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const convertedData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'toDate' in value) {
          convertedData[key] = value.toDate().toISOString();
        } else {
          convertedData[key] = value;
        }
      });
      return { id: doc.id, ...convertedData };
    });

    return { salesData, productsData };
  } catch (error) {
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