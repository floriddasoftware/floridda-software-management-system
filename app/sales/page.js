"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
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

export default function SalesPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellQuantity, setSellQuantity] = useState("");
  const [showSellModal, setShowSellModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { searchTerm } = useSearch();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to products:", err);
        setError("Failed to load products");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSell = (product) => {
    setSelectedProduct(product);
    setSellQuantity("");
    setShowSellModal(true);
  };

  const confirmSell = async () => {
    if (!selectedProduct || !sellQuantity || sellQuantity <= 0) return;
    const quantityToSell = parseInt(sellQuantity);
    if (quantityToSell > selectedProduct.quantity) {
      alert("Cannot sell more than available quantity!");
      return;
    }

    try {
      const newQuantity = selectedProduct.quantity - quantityToSell;
      if (newQuantity > 0) {
        await updateDoc(doc(db, "products", selectedProduct.id), {
          quantity: newQuantity,
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

      // Record the sale
      await addDoc(collection(db, "sales"), {
        productId: selectedProduct.id,
        item: selectedProduct.item,
        quantity: quantityToSell,
        salePrice: selectedProduct.salePrice,
        costPrice: selectedProduct.costPrice,
        totalAmount: quantityToSell * selectedProduct.salePrice,
        salespersonId: session?.user?.email || "unknown",
        timestamp: new Date().toISOString(),
      });

      // Low stock notification if applicable
      if (newQuantity < 5 && newQuantity > 0 && session?.user?.email) {
        await addDoc(collection(db, "notifications"), {
          userId: session.user.email,
          message: `${selectedProduct.item} is low on stock (${newQuantity} left)`,
          read: false,
          timestamp: new Date().toISOString(),
        });
      }

      setShowSellModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error processing sale:", error);
      setError("Failed to process sale");
    }
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const columns = [
    { key: "item", label: "Item" },
    { key: "quantity", label: "Quantity" },
    { key: "salePrice", label: "Sale Price" },
    { key: "modelNumber", label: "Model" },
    { key: "serialNumber", label: "Serial" },
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Sub Category" },
  ];

  const actions = [
    { label: "Sell", onClick: handleSell },
    { label: "View", onClick: handleView },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Sales
      </h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p className="text-gray-900 dark:text-white">Loading products...</p>
      ) : filteredProducts.length > 0 ? (
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
        />
        <div className="flex justify-end space-x-2">
          <Button onClick={() => setShowSellModal(false)}>Cancel</Button>
          <Button onClick={confirmSell}>Sell</Button>
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
              <strong>Serial Number:</strong> {selectedProduct.serialNumber}
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