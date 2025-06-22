"use client";
import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import LoadingSpinner from "@/components/LoadingSpinner";

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
    serialNumber: "",
    color: "",
    storage: "",
    category: "",
    subCategory: "",
    description: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = !!productToEdit;

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        item: productToEdit.item || "",
        quantity: productToEdit.quantity.toString() || "",
        costPrice: productToEdit.costPrice.toString() || "",
        salePrice: productToEdit.salePrice.toString() || "",
        modelNumber: productToEdit.modelNumber || "",
        serialNumber: productToEdit.serialNumber || "",
        color: productToEdit.color || "",
        storage: productToEdit.storage || "",
        category: productToEdit.category || "",
        subCategory: productToEdit.subCategory || "",
        description: productToEdit.description || "",
        imageUrl: productToEdit.imageUrl || "",
      });
      if (productToEdit.imageUrl) {
        setImagePreview(productToEdit.imageUrl);
      }
    } else {
      setFormData({
        item: "",
        quantity: "",
        costPrice: "",
        salePrice: "",
        modelNumber: "",
        serialNumber: "",
        color: "",
        storage: "",
        category: "",
        subCategory: "",
        description: "",
        imageUrl: "",
      });
      setImagePreview(null);
    }
  }, [productToEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      return await getDownloadURL(storageRef);
    } catch (error) {
      toast.error("Failed to upload image");
      return null;
    }
  };

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
      !formData.serialNumber.trim() ||
      !formData.category.trim() ||
      !formData.subCategory.trim()
    ) {
      setError("Please fill in all required fields with valid data.");
      toast.error("Please fill in all required fields with valid data.");
      setLoading(false);
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be a positive number.");
      toast.error("Quantity must be a positive number.");
      setLoading(false);
      return;
    }
    if (costPrice <= 0 || salePrice <= 0) {
      setError("Prices must be positive numbers.");
      toast.error("Prices must be positive numbers.");
      setLoading(false);
      return;
    }
    if (salePrice < costPrice) {
      setError("Sale Price must be greater than or equal to Cost Price.");
      toast.error("Sale Price must be greater than or equal to Cost Price.");
      setLoading(false);
      return;
    }

    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const timestamp = new Date().toISOString();
      const productData = {
        item: formData.item.trim(),
        quantity,
        costPrice,
        salePrice,
        modelNumber: formData.modelNumber.trim(),
        serialNumber: formData.serialNumber.trim(),
        color: formData.color.trim(),
        storage: formData.storage.trim(),
        category: formData.category.trim(),
        subCategory: formData.subCategory.trim(),
        description: formData.description.trim(),
        owner: session?.user?.email || "",
        createdAt: isEditing ? productToEdit.createdAt : timestamp,
        updatedAt: timestamp,
        imageUrl: imageUrl || "",
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
      setError("Failed to save product. Please try again.");
      toast.error("Failed to save product. Please try again.");
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
          <FormField
            label="Storage"
            name="storage"
            value={formData.storage}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div className="md:col-span-2 space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Product Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-100"
            disabled={loading}
          />
          {imagePreview && (
            <div className="mt-2">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-32 w-32 object-contain border rounded"
              />
            </div>
          )}
          {!imagePreview && formData.imageUrl && (
            <div className="mt-2">
              <img 
                src={formData.imageUrl} 
                alt="Current" 
                className="h-32 w-32 object-contain border rounded"
              />
            </div>
          )}
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
          <p className="md:col-span-2 text-red-500 text-sm bg-red-100 p-2 rounded dark:bg-red-900 dark:text-red-100">
            {error}
          </p>
        )}
        <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : isEditing ? "Save" : "Register"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}