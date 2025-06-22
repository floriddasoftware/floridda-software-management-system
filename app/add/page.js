import { adminDb } from "@/lib/firebaseAdmin";
import AddClient from "./addClient";

async function fetchSalespersons() {
  try {
    const salespersonsSnapshot = await adminDb
      .collection("users")
      .where("role", "==", "salesperson")
      .get();
    
    const allSalespersons = salespersonsSnapshot.docs.map((doc) => {
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
    return allSalespersons;
  } catch (error) {
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