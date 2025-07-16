import { adminDb } from "@/lib/firebaseAdmin";
import ManageBranches from "@/components/ManageBranches";

async function fetchBranches() {
  try {
    const snapshot = await adminDb.collection("branches").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching branches:", error);
    return [];
  }
}

async function fetchSalespersons() {
  try {
    const snapshot = await adminDb
      .collection("users")
      .where("role", "==", "salesperson")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching salespersons:", error);
    return [];
  }
}

async function fetchProducts() {
  try {
    const snapshot = await adminDb.collection("products").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function BranchesPage() {
  const initialBranches = await fetchBranches();
  const initialSalespersons = await fetchSalespersons();
  const initialProducts = await fetchProducts();
  return (
    <main>
      <ManageBranches
        initialBranches={initialBranches}
        initialSalespersons={initialSalespersons}
        initialProducts={initialProducts}
      />
    </main>
  );
}