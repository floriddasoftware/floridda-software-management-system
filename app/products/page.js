"use client";
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import RegisterProduct from "@/components/RegisterProduct";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { Edit, Trash } from "lucide-react";
import { useSearch } from "@/context/SearchContext";

export default function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const { searchTerm } = useSearch();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData = querySnapshot.docs.map((doc) => {
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
      setProducts(productsData);
      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteDoc(doc(db, "products", productToDelete.id));
        setProducts(products.filter((p) => p.id !== productToDelete.id));
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

  const filteredProducts = products.filter((product) =>
    product.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "item", label: "Item" },
    { key: "quantity", label: "Quantity" },
    { key: "costPrice", label: "Cost Price" },
    { key: "salePrice", label: "Sale Price" },
    { key: "modelNumber", label: "Model" },
    { key: "serialNumber", label: "Serial" },
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Sub Category" },
  ];

  const actions = [
    {
      onClick: handleEdit,
      icon: <Edit className="w-5 h-5 text-blue-600" />,
    },
    {
      onClick: handleDelete,
      icon: <Trash className="w-5 h-5 text-red-600" />,
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-8">
        <Button onClick={fetchProducts} disabled={loading}>
          {loading ? "Loading..." : "View"}
        </Button>
        <Button
          onClick={() => {
            setProductToEdit(null);
            setShowModal(true);
          }}
        >
          Register
        </Button>
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
        filteredProducts.length > 0 ? (
          <Table columns={columns} data={filteredProducts} actions={actions} />
        ) : (
          <p className="text-gray-900 dark:text-white">No products found.</p>
        )
      ) : (
        <p className="text-gray-900 dark:text-white">
          Click "View" to see products.
        </p>
      )}

      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Confirm Deletion"
      >
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this product?
        </p>
        <div className="flex justify-end space-x-2">
          <Button onClick={() => setShowConfirmDelete(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}