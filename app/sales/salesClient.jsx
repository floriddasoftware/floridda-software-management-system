"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { useSession } from "next-auth/react";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { useSearch } from "@/context/SearchContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SalesClient({ initialProducts }) {
  const { data: session } = useSession();
  const [products, setProducts] = useState(initialProducts || []);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellQuantity, setSellQuantity] = useState("");
  const [selectedSerialNumber, setSelectedSerialNumber] = useState("");
  const [showSellModal, setShowSellModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { searchTerm } = useSearch();

  // Fetch products based on user role and branch
  useEffect(() => {
    let unsubscribe;
    if (session?.user?.role === "admin") {
      // Admins see all products
      unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      });
    } else if (session?.user?.branchId) {
      // Salespeople see only their branch's products
      const q = query(
        collection(db, "products"),
        where("branchId", "==", session.user.branchId)
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      });
    } else {
      // No branch assigned, show nothing
      setProducts([]);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session]);

  const filteredProducts = products.filter((product) =>
    product.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSell = (product) => {
    setSelectedProduct(product);
    setSellQuantity("");
    setSelectedSerialNumber(product.serialNumbers[0] || "");
    setShowSellModal(true);
    setError("");
  };

  const confirmSell = async () => {
    if (
      !selectedProduct ||
      !sellQuantity ||
      sellQuantity <= 0 ||
      !selectedSerialNumber
    ) {
      setError("Please enter a valid quantity and select a serial number.");
      toast.error("Please enter a valid quantity and select a serial number.");
      return;
    }

    if (!session) {
      setError("Authentication required");
      toast.error("Authentication required");
      return;
    }

    const salespersonBranchId = session.user.branchId;
    if (
      selectedProduct.branchId !== salespersonBranchId &&
      session.user.role !== "admin"
    ) {
      setError("You can only sell products from your assigned branch.");
      toast.error("You can only sell products from your assigned branch.");
      return;
    }

    const quantityToSell = parseInt(sellQuantity);
    if (quantityToSell > selectedProduct.quantity) {
      setError("Cannot sell more than available quantity!");
      toast.error("Cannot sell more than available quantity!");
      return;
    }

    setLoading(true);
    try {
      const newQuantity = selectedProduct.quantity - quantityToSell;
      const newSerialNumbers = selectedProduct.serialNumbers.filter(
        (sn) => sn !== selectedSerialNumber
      );

      if (newQuantity > 0) {
        await updateDoc(doc(db, "products", selectedProduct.id), {
          quantity: newQuantity,
          serialNumbers: newSerialNumbers,
        });
      } else {
        await deleteDoc(doc(db, "products", selectedProduct.id));
        if (session?.user?.email) {
          await addDoc(collection(db, "notifications"), {
            userId: session.user.email,
            message: `${selectedProduct.item} has been sold out and removed from inventory.`,
            read: false,
            timestamp: new Date().toISOString(),
          });
        }
      }

      await addDoc(collection(db, "sales"), {
        productId: selectedProduct.id,
        item: selectedProduct.item,
        quantity: quantityToSell,
        salePrice: selectedProduct.salePrice,
        costPrice: selectedProduct.costPrice,
        totalAmount: quantityToSell * selectedProduct.salePrice,
        serialNumberSold: selectedSerialNumber,
        salespersonId: session.user.email,
        timestamp: new Date().toISOString(),
      });

      if (newQuantity < 5 && newQuantity > 0 && session?.user?.email) {
        await addDoc(collection(db, "notifications"), {
          userId: session.user.email,
          message: `${selectedProduct.item} is low on stock (${newQuantity} left)`,
          read: false,
          timestamp: new Date().toISOString(),
        });
      }

      toast.success("Sale processed successfully!");
      setShowSellModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error processing sale:", error);
      setError("Failed to process sale. Please try again.");
      toast.error("Failed to process sale.");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
    setError("");
  };

  const columns = [
    { key: "item", label: "Item" },
    { key: "quantity", label: "Quantity" },
    { key: "salePrice", label: "Sale Price" },
    { key: "modelNumber", label: "Model" },
    {
      key: "serialNumbers",
      label: "Serial Numbers",
      render: (row) => row.serialNumbers.join(", "),
    },
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Sub Category" },
  ];

  const actions = [
    { label: "Sell", onClick: handleSell },
    { label: "View", onClick: handleView },
  ];

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Sales
      </h1>
      {error && (
        <p className="text-red-500 mb-4 bg-red-100 p-2 rounded">{error}</p>
      )}
      {filteredProducts.length > 0 ? (
        <Table columns={columns} data={filteredProducts} actions={actions} />
      ) : (
        <p className="text-gray-900 dark:text-white">No products found.</p>
      )}

      <Modal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        title="Sell Product"
      >
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Enter quantity to sell for {selectedProduct?.item}:
        </p>
        <input
          type="number"
          value={sellQuantity}
          onChange={(e) => setSellQuantity(e.target.value)}
          className="mb-4 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          min="1"
          max={selectedProduct?.quantity}
          disabled={loading}
        />
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Serial Number to Sell:
          <select
            value={selectedSerialNumber}
            onChange={(e) => setSelectedSerialNumber(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={loading}
          >
            {selectedProduct?.serialNumbers.map((sn) => (
              <option key={sn} value={sn}>
                {sn}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p className="text-red-500 mb-4 bg-red-100 p-2 rounded">{error}</p>
        )}
        <div className="flex justify-end space-x-2 mt-4">
          <Button onClick={() => setShowSellModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={confirmSell} disabled={loading}>
            {loading ? "Processing..." : "Sell"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Product Details"
      >
        {selectedProduct && (
          <div className="text-gray-700 dark:text-gray-300">
            <p>
              <strong>Item:</strong> {selectedProduct.item}
            </p>
            <p>
              <strong>Quantity:</strong> {selectedProduct.quantity}
            </p>
            {session?.user?.role === "admin" && (
              <p>
                <strong>Cost Price per Unit:</strong>{" "}
                {selectedProduct.costPrice}
              </p>
            )}
            <p>
              <strong>Sale Price per Unit:</strong> {selectedProduct.salePrice}
            </p>
            <p>
              <strong>Model Number:</strong> {selectedProduct.modelNumber}
            </p>
            <p>
              <strong>Serial Numbers:</strong>{" "}
              {selectedProduct.serialNumbers.join(", ")}
            </p>
            <p>
              <strong>Category:</strong> {selectedProduct.category}
            </p>
            <p>
              <strong>Sub Category:</strong> {selectedProduct.subCategory}
            </p>
            <p>
              <strong>Color:</strong> {selectedProduct.color || "N/A"}
            </p>
            <p>
              <strong>Storage:</strong> {selectedProduct.storage || "N/A"}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {selectedProduct.description || "N/A"}
            </p>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button onClick={() => setShowViewModal(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
}