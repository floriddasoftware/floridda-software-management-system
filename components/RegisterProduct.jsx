"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useSession } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RegisterProduct({
  productToEdit,
  onClose,
  onSaveComplete,
}) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    item: "",
    quantity: "",
    costPrice: "",
    salePrice: "",
    modelNumber: "",
    serialNumbers: [],
    color: "",
    storage: "",
    category: "",
    subCategory: "",
    description: "",
    branchId: "",
  });
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditing = !!productToEdit;

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const snapshot = await getDocs(collection(db, "branches"));
        const branchData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBranches(branchData);
        if (!isEditing && branchData.length === 1) {
          setFormData((prev) => ({ ...prev, branchId: branchData[0].id }));
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        toast.error("Failed to fetch branches.");
      }
    };
    fetchBranches();
  }, [isEditing]);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        item: productToEdit.item || "",
        quantity: productToEdit.quantity || "",
        costPrice: productToEdit.costPrice || "",
        salePrice: productToEdit.salePrice || "",
        modelNumber: productToEdit.modelNumber || "",
        serialNumbers: productToEdit.serialNumbers || [],
        color: productToEdit.color || "",
        storage: productToEdit.storage || "",
        category: productToEdit.category || "",
        subCategory: productToEdit.subCategory || "",
        description: productToEdit.description || "",
        branchId: productToEdit.branchId || "",
      });
    } else {
      setFormData({
        item: "",
        quantity: "",
        costPrice: "",
        salePrice: "",
        modelNumber: "",
        serialNumbers: [],
        color: "",
        storage: "",
        category: "",
        subCategory: "",
        description: "",
        branchId: "",
      });
    }
  }, [productToEdit, branches]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const quantity = parseInt(formData.quantity, 10);
    const costPrice = parseFloat(formData.costPrice);
    const salePrice = parseFloat(formData.salePrice);

    if (
      !formData.item.trim() ||
      isNaN(quantity) ||
      isNaN(costPrice) ||
      isNaN(salePrice) ||
      !formData.modelNumber.trim() ||
      !formData.category.trim() ||
      !formData.subCategory.trim() ||
      !formData.branchId
    ) {
      setError("Please fill in all required fields.");
      toast.error("Missing required fields.");
      setLoading(false);
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be a positive number.");
      toast.error("Quantity must be positive.");
      setLoading(false);
      return;
    }
    if (costPrice <= 0 || salePrice <= 0) {
      setError("Prices must be positive numbers.");
      toast.error("Prices must be positive.");
      setLoading(false);
      return;
    }
    if (salePrice < costPrice) {
      setError("Sale Price must be greater than or equal to Cost Price.");
      toast.error("Sale Price too low.");
      setLoading(false);
      return;
    }
    if (formData.serialNumbers.length !== quantity) {
      setError("Number of serial numbers must match quantity.");
      toast.error("Serial numbers mismatch.");
      setLoading(false);
      return;
    }

    try {
      const productData = {
        item: formData.item.trim(),
        quantity,
        costPrice,
        salePrice,
        modelNumber: formData.modelNumber.trim(),
        serialNumbers: formData.serialNumbers,
        color: formData.color.trim(),
        storage: formData.storage.trim(),
        category: formData.category.trim(),
        subCategory: formData.subCategory.trim(),
        description: formData.description.trim(),
        owner: session?.user?.email || "",
        branchId: formData.branchId,
        createdAt: isEditing
          ? productToEdit.createdAt
          : new Date().toISOString(),
      };

      let savedProduct;
      if (isEditing) {
        await updateDoc(doc(db, "products", productToEdit.id), productData);
        savedProduct = { id: productToEdit.id, ...productData };
      } else {
        const docRef = await addDoc(collection(db, "products"), productData);
        savedProduct = { id: docRef.id, ...productData };
      }

      if (quantity < 5 && session?.user?.email) {
        await addDoc(collection(db, "notifications"), {
          userId: session.user.email,
          message: `${formData.item} is low on stock (${quantity} left)`,
          read: false,
          timestamp: new Date().toISOString(),
        });
      }
      toast.success("Product saved successfully!");
      onSaveComplete(savedProduct);
    } catch (err) {
      console.error("Error saving product:", err);
      setError("Failed to save product. Please try again.");
      toast.error("Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSerialNumbersChange = (e) => {
    const serials = e.target.value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    setFormData({ ...formData, serialNumbers: serials });
  };

  if (!session || session.user.role !== "admin") {
    return (
      <Modal isOpen={true} onClose={onClose} title="Unauthorized">
        <p className="text-gray-700 dark:text-gray-300">
          You do not have permission to register or edit products.
        </p>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? "Edit Product" : "Register New Product"}
    >
      <ToastContainer />
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="space-y-4">
          <FormField
            label="Item Name"
            name="item"
            value={formData.item}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <FormField
            label="Quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            required
            disabled={loading}
            min="1"
          />
          <FormField
            label="Cost Price per Unit"
            name="costPrice"
            type="number"
            value={formData.costPrice}
            onChange={handleChange}
            required
            disabled={loading}
            step="0.01"
            min="0.01"
          />
          <FormField
            label="Sale Price per Unit"
            name="salePrice"
            type="number"
            value={formData.salePrice}
            onChange={handleChange}
            required
            disabled={loading}
            step="0.01"
            min="0.01"
          />
        </div>
        <div className="space-y-4">
          <FormField
            label="Model Number"
            name="modelNumber"
            value={formData.modelNumber}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Serial Numbers (comma-separated)
            <input
              type="text"
              value={formData.serialNumbers.join(", ")}
              onChange={handleSerialNumbersChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={loading}
              placeholder="e.g., SN1, SN2, SN3"
            />
          </label>
          <FormField
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <FormField
            label="Sub Category"
            name="subCategory"
            value={formData.subCategory}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <FormField
            label="Color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            disabled={loading}
          />
          <FormField
            label="Storage"
            name="storage"
            value={formData.storage}
            onChange={handleChange}
            disabled={loading}
          />
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Branch
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={loading}
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.location})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="md:col-span-2 space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </label>
        </div>
        {error && (
          <p className="md:col-span-2 text-red-500 text-sm bg-red-100 p-2 rounded">
            {error}
          </p>
        )}
        <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Save" : "Register"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}