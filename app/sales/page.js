import { adminDb } from "@/lib/firebaseAdmin";
import SalesClient from "./salesClient";

async function fetchInitialProducts() {
  try {
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
      
      return {
        id: doc.id,
        ...convertedData
      };
    });
    return productsData;
  } catch (error) {
    return [];
  }
}

export default async function SalesPage() {
  const initialProducts = await fetchInitialProducts();
  return (
    <main>
      <SalesClient initialProducts={initialProducts} />
    </main>
  );
}