import { adminDb } from "@/lib/firebaseAdmin";
import ProductsClient from "./productsClient";

async function fetchProductsData() {
  try {
    const productsSnapshot = await adminDb.collection("products").get();
    const productsData = productsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        item: data.item || "",
        quantity: typeof data.quantity === "number" ? data.quantity : 0,
        costPrice: typeof data.costPrice === "number" ? data.costPrice : 0,
        salePrice: typeof data.salePrice === "number" ? data.salePrice : 0,
        modelNumber: data.modelNumber || "",
        serialNumber: data.serialNumber || "",
        category: data.category || "",
        subCategory: data.subCategory || "",
        color: data.color || "",
        storage: data.storage || "",
        description: data.description || "",
      };
    });
    return productsData;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function ProductsPage() {
  const initialProducts = await fetchProductsData();
  return (
    <main>
      <ProductsClient initialProducts={initialProducts} />
    </main>
  );
}