"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useSession } from "next-auth/react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Table from "@/components/Table";
import { Edit, Trash } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ManageBranches({
  initialBranches = [],
  initialSalespersons = [],
  initialProducts = [],
}) {
  const { data: session } = useSession();
  const [branches, setBranches] = useState(initialBranches);
  const [formData, setFormData] = useState({
    branchId: "",
    name: "",
    location: "",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "admin") return;

    const fetchBranches = async () => {
      try {
        const snapshot = await getDocs(collection(db, "branches"));
        setBranches(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Error fetching branches:", error);
        toast.error("Failed to load branches.");
      }
    };
    fetchBranches();
  }, [session]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }
    if (
      !formData.branchId.trim() ||
      !formData.name.trim() ||
      !formData.location.trim()
    ) {
      toast.error("Branch ID, name, and location are required.");
      return;
    }
    setLoading(true);
    try {
      const newBranch = {
        name: formData.name.trim(),
        location: formData.location.trim(),
      };
      await setDoc(doc(db, "branches", formData.branchId), newBranch);
      setBranches([...branches, { id: formData.branchId, ...newBranch }]);
      toast.success("Branch added successfully!");
      setFormData({ branchId: "", name: "", location: "" });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding branch:", error);
      toast.error("Failed to add branch. Branch ID may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    if (!session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }
    setSelectedBranch(branch);
    setFormData({
      branchId: branch.id,
      name: branch.name,
      location: branch.location,
    });
    setShowEditModal(true);
  };

  const handleUpdateBranch = async (e) => {
    e.preventDefault();
    if (!session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.error("Branch name and location are required.");
      return;
    }
    setLoading(true);
    try {
      const updatedBranch = {
        name: formData.name.trim(),
        location: formData.location.trim(),
      };
      await updateDoc(doc(db, "branches", selectedBranch.id), updatedBranch);
      setBranches(
        branches.map((b) =>
          b.id === selectedBranch.id ? { ...b, ...updatedBranch } : b
        )
      );
      toast.success("Branch updated successfully!");
      setShowEditModal(false);
      setSelectedBranch(null);
      setFormData({ branchId: "", name: "", location: "" });
    } catch (error) {
      console.error("Error updating branch:", error);
      toast.error("Failed to update branch.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (branch) => {
    if (!session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }
    setSelectedBranch(branch);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!selectedBranch || !session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }
    setLoading(true);
    try {
      await deleteDoc(doc(db, "branches", selectedBranch.id));
      setBranches(branches.filter((b) => b.id !== selectedBranch.id));
      toast.success("Branch deleted successfully!");
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast.error("Failed to delete branch.");
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
      setSelectedBranch(null);
    }
  };

  const columns = [
    { key: "id", label: "Branch ID" }, 
    { key: "name", label: "Branch Name" },
    { key: "location", label: "Location" },
  ];

  const actions = [
    { onClick: handleEdit, icon: <Edit className="w-5 h-5 text-blue-600" /> },
    { onClick: handleDelete, icon: <Trash className="w-5 h-5 text-red-600" /> },
  ];

  if (!session || session.user.role !== "admin") {
    return (
      <p className="text-gray-900 dark:text-white p-4">Unauthorized access.</p>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Manage Branches
      </h1>
      <div className="flex space-x-4 mb-8">
        <Button onClick={() => setShowAddModal(true)} disabled={loading}>
          Add Branch
        </Button>
      </div>
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
            Branch ID
            <input
              type="text"
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={loading}
              placeholder="e.g., dutse"
            />
          </label>
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
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Branch"
      >
        <form onSubmit={handleUpdateBranch} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Branch ID (Cannot be changed)
            <input
              type="text"
              name="branchId"
              value={formData.branchId}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-100 dark:bg-gray-600"
              disabled
            />
          </label>
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
            <Button onClick={() => setShowEditModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Branch"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Confirm Deletion"
      >
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Are you sure you want to delete the branch "{selectedBranch?.name}"?
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