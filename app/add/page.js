import { adminDb } from "@/lib/firebaseAdmin";
import AddClient from "./addClient";

async function fetchSalespersons() {
  try {
    const salespersonsSnapshot = await adminDb.collection("salespeople").get();
    if (salespersonsSnapshot.empty) {
      console.log("No salespeople found in the database.");
      return [];
    }
    const allSalespersons = salespersonsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("Fetched salespersons:", allSalespersons); 
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