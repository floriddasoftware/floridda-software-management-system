import { adminDb } from "@/lib/firebaseAdmin";
import SalesClient from "./salesClient";

async function fetchInitialProducts() {
  try {
    const productsSnapshot = await adminDb.collection("products").get();
    const productsData = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return productsData;
  } catch (error) {
    console.error("Error fetching initial products:", error);
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