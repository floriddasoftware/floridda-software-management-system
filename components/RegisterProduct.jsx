"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";

export default function RegisterProduct({
  productToEdit,
  onClose,
  onSaveComplete,
}) {
  const [formData, setFormData] = useState({
    item: "",
    quantity: "",
    amountPerUnit: "",
    modelNumber: "",
    serialNumber: "",
    color: "",
    storage: "",
    category: "",
    subCategory: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = !!productToEdit;

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        item: productToEdit.item || "",
        quantity: productToEdit.quantity || "",
        amountPerUnit: productToEdit.amountPerUnit || "",
        modelNumber: productToEdit.modelNumber || "",
        serialNumber: productToEdit.serialNumber || "",
        color: productToEdit.color || "",
        storage: productToEdit.storage || "",
        category: productToEdit.category || "",
        subCategory: productToEdit.subCategory || "",
        description: productToEdit.description || "",
      });
    } else {
      setFormData({
        item: "",
        quantity: "",
        amountPerUnit: "",
        modelNumber: "",
        serialNumber: "",
        color: "",
        storage: "",
        category: "",
        subCategory: "",
        description: "",
      });
    }
  }, [productToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (
      !formData.item ||
      !formData.quantity ||
      !formData.amountPerUnit ||
      !formData.modelNumber ||
      !formData.serialNumber ||
      !formData.category ||
      !formData.subCategory
    ) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        await updateDoc(doc(db, "products", productToEdit.id), formData);
      } else {
        await addDoc(collection(db, "products"), formData);
      }
      onSaveComplete();
      onClose();
    } catch (err) {
      console.error("Error saving product:", err);
      setError("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {isEditing ? "Edit Product" : "Register New Product"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Required Fields */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Item Name *
              <input
                type="text"
                name="item"
                value={formData.item}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={loading}
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantity *
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={loading}
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount per Unit *
              <input
                type="number"
                name="amountPerUnit"
                step="0.01"
                value={formData.amountPerUnit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={loading}
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Model Number *
              <input
                type="text"
                name="modelNumber"
                value={formData.modelNumber}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={loading}
              />
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Serial Number *
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={loading}
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category *
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={loading}
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sub Category *
              <input
                type="text"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={loading}
              />
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={loading}
              />
            </label>
          </div>

          {/* Full-width Fields */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Storage
              <input
                type="text"
                name="storage"
                value={formData.storage}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={loading}
              />
            </label>

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
            <p className="md:col-span-2 text-red-500 text-sm">{error}</p>
          )}

          <div className="md:col-span-2 flex justify-between mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-white"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? "Saving..." : isEditing ? "Save" : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}