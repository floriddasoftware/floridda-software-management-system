import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const productsCollection = collection(db, "products");

export const productService = {
  addProduct: async (product) => {
    try {
      const docRef = await addDoc(productsCollection, product);
      return { id: docRef.id, ...product };
    } catch (error) {
      throw error;
    }
  },

  getProducts: async () => {
    try {
      const snapshot = await getDocs(productsCollection);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  updateProduct: async (id, updates) => {
    try {
      await updateDoc(doc(db, "products", id), updates);
    } catch (error) {
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (error) {
      throw error;
    }
  },
};