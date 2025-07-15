"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useSession } from "next-auth/react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Table from "@/components/Table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ManageBranches({
  initialBranches,
  initialSalespersons,
  initialProducts,
}) {
  const { data: session } = useSession();
  const [branches, setBranches] = useState(initialBranches || []);
  const [salespersons, setSalespersons] = useState(initialSalespersons || []);
  const [products, setProducts] = useState(initialProducts || []);
  const [formData, setFormData] = useState({ name: "", location: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }

    setLoading(true);
    try {
      const newBranch = { name: formData.name, location: formData.location };
      const docRef = await addDoc(collection(db, "branches"), newBranch);
      setBranches([...branches, { id: docRef.id, ...newBranch }]);
      toast.success("Branch added successfully!");
      setFormData({ name: "", location: "" });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding branch:", error);
      toast.error("Failed to add branch.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = (branch) => {
    setSelectedBranch(branch);
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }

    setLoading(true);
    try {
      const selectedSalesperson = e.target.salesperson.value;
      const selectedProduct = e.target.product.value;

      if (selectedSalesperson) {
        await updateDoc(doc(db, "salespeople", selectedSalesperson), {
          branchId: selectedBranch.id,
        });
        setSalespersons(
          salespersons.map((s) =>
            s.id === selectedSalesperson
              ? { ...s, branchId: selectedBranch.id }
              : s
          )
        );
      }

      if (selectedProduct) {
        await updateDoc(doc(db, "products", selectedProduct), {
          branchId: selectedBranch.id,
        });
        setProducts(
          products.map((p) =>
            p.id === selectedProduct ? { ...p, branchId: selectedBranch.id } : p
          )
        );
      }

      toast.success("Assignments updated successfully!");
      setShowAssignModal(false);
    } catch (error) {
      console.error("Error assigning:", error);
      toast.error("Failed to assign.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const columns = [
    { key: "name", label: "Branch Name" },
    { key: "location", label: "Location" },
  ];

  const actions = [{ label: "Assign", onClick: handleAssign }];

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Manage Branches
      </h1>
      <Button onClick={() => setShowAddModal(true)} disabled={loading}>
        Add Branch
      </Button>

      {branches.length > 0 ? (
        <Table columns={columns} data={branches} actions={actions} />
      ) : (
        <p className="text-gray-900 dark:text-white">No branches added yet.</p>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Branch"
      >
        <form onSubmit={handleAddBranch} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Branch Name
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={loading}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Location
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={loading}
            />
          </label>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setShowAddModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Branch"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign to ${selectedBranch?.name}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assign Salesperson
            <select
              name="salesperson"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            >
              <option value="">Select Salesperson</option>
              {salespersons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assign Product
            <select
              name="product"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.item} (Model: {p.modelNumber})
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setShowAssignModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}