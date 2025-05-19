"use client";
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import RegisterProduct from "@/components/RegisterProduct";
import ProductList from "@/components/ProductList";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

export default function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setProductToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteDoc(doc(db, "products", productToDelete));
        setProducts(products.filter((p) => p.id !== productToDelete));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
      setShowConfirmDelete(false);
      setProductToDelete(null);
    }
  };

  const handleEdit = (product) => {
    setProductToEdit(product);
    setShowModal(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-8">
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg disabled:bg-gray-500"
          disabled={loading}
        >
          {loading ? "Loading..." : "View"}
        </button>
        <button
          onClick={() => {
            setProductToEdit(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg"
        >
          Register
        </button>
      </div>

      {showModal && (
        <RegisterProduct
          productToEdit={productToEdit}
          onClose={() => setShowModal(false)}
          onSaveComplete={fetchProducts}
        />
      )}

      {loading ? (
        <p className="text-gray-900 dark:text-white">Loading products...</p>
      ) : hasFetched ? (
        products.length > 0 ? (
          <ProductList
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <p className="text-gray-900 dark:text-white">No products found.</p>
        )
      ) : (
        <p className="text-gray-900 dark:text-white">
          Click "View" to see products.
        </p>
      )}

      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}