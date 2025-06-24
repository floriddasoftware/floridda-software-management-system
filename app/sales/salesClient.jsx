"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { useSession } from "next-auth/react";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { useSearch } from "@/context/SearchContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

export default function SalesClient({ initialProducts }) {
  const { data: session } = useSession();
  const [products, setProducts] = useState(initialProducts || []);
  const [salesHistory, setSalesHistory] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [sellQuantities, setSellQuantities] = useState({});
  const [filterDateStart, setFilterDateStart] = useState(null);
  const [filterDateEnd, setFilterDateEnd] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { searchTerm } = useSearch();

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      },
      (err) => {
        toast.error("Failed to update products.");
      }
    );
    return () => unsubscribeProducts();
  }, []);

  const fetchSalesHistory = async () => {
    try {
      const salesSnapshot = await getDocs(collection(db, "sales"));
      const salesData = salesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSalesHistory(salesData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      toast.error("Failed to fetch sales history.");
    }
  };

  const handleProductSelect = (selectedOptions) => {
    setSelectedProducts(selectedOptions ? selectedOptions.map((option) => option.value) : []);
  };

  const handleQuantityChange = (productId, value) => {
    setSellQuantities({
      ...sellQuantities,
      [productId]: value,
    });
  };

  const confirmMultipleSell = async (e) => {
    e.preventDefault();
    if (!session) {
      setError("Authentication required.");
      toast.error("Authentication required.");
      return;
    }
    if (selectedProducts.length === 0) {
      setError("Please select at least one product.");
      toast.error("Please select at least one product.");
      return;
    }

    setLoading(true);
    try {
      for (const productId of selectedProducts) {
        const product = products.find((p) => p.id === productId);
        const quantityToSell = parseInt(sellQuantities[productId] || "0", 10);

        if (isNaN(quantityToSell) || quantityToSell <= 0) {
          throw new Error(`Invalid quantity for ${product.item}.`);
        }
        if (quantityToSell > product.quantity) {
          throw new Error(`Cannot sell more than available quantity for ${product.item}.`);
        }

        const newQuantity = product.quantity - quantityToSell;
        const saleData = {
          productId: product.id,
          item: product.item,
          quantity: quantityToSell,
          salePrice: product.salePrice,
          costPrice: product.costPrice,
          totalAmount: quantityToSell * product.salePrice,
          salespersonId: session.user.email,
          timestamp: new Date().toISOString(),
          modelNumber: product.modelNumber,
        };

        if (newQuantity === 0) {
          await deleteDoc(doc(db, "products", product.id));
        } else {
          await updateDoc(doc(db, "products", product.id), {
            quantity: newQuantity,
            status: newQuantity === 0 ? "out of stock" : "active",
            updatedAt: new Date().toISOString(),
          });
        }

        await addDoc(collection(db, "sales"), saleData);

        if (newQuantity < 5 && newQuantity > 0 && session.user.role === "admin") {
          await addDoc(collection(db, "notifications"), {
            userId: session.user.email,
            message: `${product.item} is low on stock (${newQuantity} left)`,
            read: false,
            timestamp: new Date().toISOString(),
          });
        }
      }

      toast.success("Sales processed successfully!");
      setShowSellModal(false);
      setSelectedProducts([]);
      setSellQuantities({});
    } catch (error) {
      setError(error.message || "Failed to process sales.");
      toast.error(error.message || "Failed to process sales.");
    } finally {
      setLoading(false);
    }
  };

  const productOptions = products.map((product) => ({
    value: product.id,
    label: `${product.item} (Qty: ${product.quantity})`,
  }));

  const filteredSales = salesHistory.filter((sale) => {
    const saleDate = new Date(sale.timestamp);
    if (filterDateStart && filterDateEnd) {
      return saleDate >= filterDateStart && saleDate <= filterDateEnd;
    }
    return true;
  });

  const productColumns = [
    { key: "item", label: "Item" },
    { key: "quantity", label: "Quantity" },
    { key: "salePrice", label: "Sale Price" },
    { key: "modelNumber", label: "Model" },
    { key: "serialNumber", label: "Serial" },
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Sub Category" },
    { key: "status", label: "Status" },
  ];

  const salesColumns = [
    { key: "item", label: "Item" },
    { key: "quantity", label: "Quantity" },
    { key: "salePrice", label: "Sale Price" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "salespersonId", label: "Salesperson" },
    { key: "timestamp", label: "Date", render: (value) => new Date(value).toLocaleString() },
  ];

  const filteredProducts = products.filter((product) =>
    product.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sales</h1>
      <div className="flex justify-between mb-4">
        <Button onClick={() => setShowSellModal(true)}>Make Sales</Button>
        <Button onClick={() => { fetchSalesHistory(); setShowHistoryModal(true); }}>
          View Sales History
        </Button>
      </div>
      {error && (
        <p className="text-red-500 mb-4 bg-red-100 p-2 rounded">{error}</p>
      )}
      {filteredProducts.length > 0 ? (
        <Table columns={productColumns} data={filteredProducts} />
      ) : (
        <p className="text-gray-900 dark:text-white">No products found.</p>
      )}

      <Modal isOpen={showSellModal} onClose={() => setShowSellModal(false)} title="Make Sale">
        <form onSubmit={confirmMultipleSell} className="space-y-4">
          <Select
            isMulti
            options={productOptions}
            onChange={handleProductSelect}
            placeholder="Search and select products..."
            className="dark:text-black"
            isDisabled={loading}
          />
          {selectedProducts.map((productId) => {
            const product = products.find((p) => p.id === productId);
            return (
              <div key={productId} className="flex items-center space-x-2">
                <span className="text-gray-900 dark:text-white">{product.item}</span>
                <input
                  type="number"
                  min="1"
                  max={product.quantity}
                  value={sellQuantities[productId] || ""}
                  onChange={(e) => handleQuantityChange(productId, e.target.value)}
                  className="w-20 p-1 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Qty"
                  disabled={loading}
                />
              </div>
            );
          })}
          {error && (
            <p className="text-red-500 bg-red-100 p-2 rounded">{error}</p>
          )}
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setShowSellModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Sell Selected"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Sales History">
        <div className="flex space-x-4 mb-4">
          <input
            type="date"
            onChange={(e) => setFilterDateStart(e.target.value ? new Date(e.target.value) : null)}
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="Start Date"
          />
          <input
            type="date"
            onChange={(e) => setFilterDateEnd(e.target.value ? new Date(e.target.value) : null)}
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="End Date"
          />
        </div>
        {filterDateStart && filteredSales.length > 0 ? (
          <Table columns={salesColumns} data={filteredSales} />
        ) : (
          <p className="text-gray-900 dark:text-white">
            {filterDateStart ? "No sales found for this date range." : "Please select a date range."}
          </p>
        )}
      </Modal>
    </div>
  );
}