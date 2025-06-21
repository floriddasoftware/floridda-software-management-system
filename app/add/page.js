import { adminDb } from "@/lib/firebaseAdmin";
import AddClient from "./addClient";

async function fetchSalespersons() {
  try {
    const salespersonsSnapshot = await adminDb
      .collection("users")
      .where("role", "==", "salesperson")
      .get();
    const allSalespersons = salespersonsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return allSalespersons;
  } catch (error) {
    console.error("Error fetching salespersons:", error);
    return [];
  }
}

export default async function AddPage() {
  const initialSalespersons = await fetchSalespersons();
  return (
    <main>
      <AddClient initialSalespersons={initialSalespersons} />
    </main>
  );
}