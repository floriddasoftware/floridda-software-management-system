"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { deleteDoc, doc, collection, onSnapshot } from "firebase/firestore";
import RegisterProduct from "@/components/RegisterProduct";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { Edit, Trash } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export default function ProductsClient({ initialProducts }) {
  const { data: session } = useSession();
  const [products, setProducts] = useState(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const { searchTerm } = useSearch();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const updatedProducts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(updatedProducts);
    });
    return () => unsubscribe();
  }, []);

  const handleProductSave = (savedProduct) => {
    if (productToEdit) {
      setProducts(products.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
    } else {
      setProducts([...products, savedProduct]);
    }
    setShowModal(false);
    setProductToEdit(null);
  };

  const handleDelete = (product) => {
    if (!session || session.user.role !== "admin") {
      toast.error("Only admins can delete products.");
      return;
    }
    setProductToDelete(product);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete || !session || session.user.role !== "admin") {
      toast.error("Unauthorized action.");
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, "products", productToDelete.id));
      toast.success("Product deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete product.");
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
      setProductToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!session || session.user.role !== "admin") {
      toast.error("Only admins can delete products.");
      return;
    }
    if (selectedProductIds.length === 0) {
      toast.error("No products selected.");
      return;
    }
    setLoading(true);
    try {
      await Promise.all(selectedProductIds.map((id) => deleteDoc(doc(db, "products", id))));
      toast.success("Selected products deleted successfully!");
      setSelectedProductIds([]);
    } catch (error) {
      toast.error("Failed to delete products.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    if (!session || session.user.role !== "admin") {
      toast.error("Only admins can edit products.");
      return;
    }
    setProductToEdit(product);
    setShowModal(true);
  };

  const categories = [...new Set(products.map((p) => p.category))];
  const filteredProducts = products.filter((product) =>
    (product.item.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!categoryFilter || product.category === categoryFilter)
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formattedProducts = filteredProducts.map((product) => ({
    ...product,
    createdAt: formatDate(product.createdAt),
    updatedAt: formatDate(product.updatedAt),
    status: product.status || "active",
  }));

  const columns = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedProductIds(filteredProducts.map((p) => p.id));
            } else {
              setSelectedProductIds([]);
            }
          }}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedProductIds.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedProductIds([...selectedProductIds, row.id]);
            } else {
              setSelectedProductIds(selectedProductIds.filter((id) => id !== row.id));
            }
          }}
        />
      ),
    },
    { key: "item", label: "Item" },
    { key: "quantity", label: "Quantity" },
    { key: "costPrice", label: "Cost Price" },
    { key: "salePrice", label: "Sale Price" },
    { key: "modelNumber", label: "Model" },
    { key: "serialNumber", label: "Serial" },
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Sub Category" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created At" },
    { key: "updatedAt", label: "Updated At" },
  ];

  const actions = [
    { onClick: handleEdit, icon: <Edit className="w-5 h-5 text-blue-600" /> },
    { onClick: handleDelete, icon: <Trash className="w-5 h-5 text-red-600" /> },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-8">
        <div className="space-x-2">
          <Button
            onClick={() => {
              if (!session || session.user.role !== "admin") {
                toast.error("Only admins can register products.");
                return;
              }
              setProductToEdit(null);
              setShowModal(true);
            }}
            disabled={loading}
          >
            Register
          </Button>
          <Button
            onClick={handleBulkDelete}
            disabled={loading || selectedProductIds.length === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Selected
          </Button>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-2 border rounded dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {showModal && (
        <RegisterProduct
          productToEdit={productToEdit}
          onClose={() => setShowModal(false)}
          onSaveComplete={handleProductSave}
        />
      )}

      {formattedProducts.length > 0 ? (
        <Table columns={columns} data={formattedProducts} actions={actions} />
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
          <Button onClick={() => setShowConfirmDelete(false)} disabled={loading}>
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