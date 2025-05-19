"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useSession } from "next-auth/react";

export default function RegisterProduct({
  productToEdit,
  onClose,
  onSaveComplete,
}) {
  const { data: session } = useSession();
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
      if (formData.quantity < 5 && session?.user?.email) {
        await addDoc(collection(db, "notifications"), {
          userId: session.user.email,
          message: `${formData.item} is low on stock (${formData.quantity} left)`,
          read: false,
          timestamp: new Date().toISOString(),
        });
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? "Edit Product" : "Register New Product"}
    >
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
          />
          <FormField
            label="Amount per Unit"
            name="amountPerUnit"
            type="number"
            value={formData.amountPerUnit}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <FormField
            label="Model Number"
            name="modelNumber"
            value={formData.modelNumber}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-4">
          <FormField
            label="Serial Number"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            required
            disabled={loading}
          />
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
        </div>
        <div className="md:col-span-2 space-y-4">
          <FormField
            label="Storage"
            name="storage"
            value={formData.storage}
            onChange={handleChange}
            disabled={loading}
          />
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
        {error && <p className="md:col-span-2 text-red-500 text-sm">{error}</p>}
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