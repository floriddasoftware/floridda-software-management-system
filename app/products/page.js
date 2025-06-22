import { adminDb } from "@/lib/firebaseAdmin";
import ProductsClient from "./productsClient";

async function fetchProductsData() {
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
        item: convertedData.item || "",
        quantity: typeof convertedData.quantity === "number" ? convertedData.quantity : 0,
        costPrice: typeof convertedData.costPrice === "number" ? convertedData.costPrice : 0,
        salePrice: typeof convertedData.salePrice === "number" ? convertedData.salePrice : 0,
        modelNumber: convertedData.modelNumber || "",
        serialNumber: convertedData.serialNumber || "",
        category: convertedData.category || "",
        subCategory: convertedData.subCategory || "",
        color: convertedData.color || "",
        storage: convertedData.storage || "",
        description: convertedData.description || "",
        imageUrl: convertedData.imageUrl || "",
        createdAt: convertedData.createdAt || "",
        updatedAt: convertedData.updatedAt || "",
      };
    });
    return productsData;
  } catch (error) {
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