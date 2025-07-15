"use client";
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { deleteDoc, doc } from "firebase/firestore";
import RegisterProduct from "@/components/RegisterProduct";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { Edit, Trash } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { useSession } from "next-auth/react";

export default function ProductsClient({ initialProducts }) {
  const { data: session } = useSession();
  const [products, setProducts] = useState(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const { searchTerm } = useSearch();

  const handleProductSave = (savedProduct) => {
    if (productToEdit) {
      setProducts(
        products.map((p) => (p.id === savedProduct.id ? savedProduct : p))
      );
    } else {
      setProducts([...products, savedProduct]);
    }
    setShowModal(false);
    setProductToEdit(null);
  };

  const handleDelete = (product) => {
    if (!session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }
    setProductToDelete(product);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete || !session || session.user.role !== "admin") return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "products", productToDelete.id));
      setProducts(products.filter((p) => p.id !== productToDelete.id));
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setLoading(false);
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
    { onClick: handleEdit, icon: <Edit className="w-5 h-5 text-blue-600" /> },
    { onClick: handleDelete, icon: <Trash className="w-5 h-5 text-red-600" /> },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-8">
        <Button
          onClick={() => {
            setProductToEdit(null);
            setShowModal(true);
          }}
          disabled={loading || (session && session.user.role !== "admin")}
        >
          Register
        </Button>
      </div>

      {showModal && (
        <RegisterProduct
          productToEdit={productToEdit}
          onClose={() => setShowModal(false)}
          onSaveComplete={handleProductSave}
        />
      )}

      {filteredProducts.length > 0 ? (
        <Table columns={columns} data={filteredProducts} actions={actions} />
      ) : (
        <p className="text-gray-900 dark:text-white">No products found.</p>
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
          <Button
            onClick={() => setShowConfirmDelete(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}