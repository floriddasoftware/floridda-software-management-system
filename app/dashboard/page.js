"use server";
import React from "react";
import DashboardPage from "./dashboard";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const page = () => {
  const fetchData = async () => {
    try {
      const salesSnapshot = await getDocs(collection(db, "sales"));
      const salesData = salesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  fetchData()
  return (
    <main>
      <DashboardPage salesData={salesData} productsData={productsData} />
    </main>
  );
};

export default page;
