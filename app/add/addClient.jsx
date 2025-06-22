"use client";
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from "firebase/firestore";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import { Trash } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { useSearch } from "@/context/SearchContext";

export default function AddClient({ initialSalespersons }) {
  const { data: session } = useSession();
  const { searchTerm } = useSearch();
  const [salespersons, setSalespersons] = useState(initialSalespersons || []);
  const [formData, setFormData] = useState({ email: "", name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [salespersonToDelete, setSalespersonToDelete] = useState(null);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!session || session.user.role !== "admin") {
      toast.error("Only admin can add salespeople");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    try {
      const newSalesperson = {
        email: formData.email.toLowerCase(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: "salesperson",
        addedBy: session.user.email,
      };

      const q = query(
        collection(db, "users"),
        where("email", "==", newSalesperson.email)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error("This email is already registered");
      }

      const docRef = await addDoc(collection(db, "users"), newSalesperson);
      setSalespersons([...salespersons, { id: docRef.id, ...newSalesperson }]);
      toast.success("Salesperson added successfully!");
      setFormData({ email: "", name: "", phone: "" });
      setShowAddModal(false);
    } catch (error) {
      toast.error(error.message || "Failed to add salesperson");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDelete = (salesperson) => {
    if (!session || session.user.role !== "admin") {
      toast.error("Only admin can delete salespeople");
      return;
    }
    setSalespersonToDelete(salesperson);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!salespersonToDelete || !session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", salespersonToDelete.id));
      setSalespersons(
        salespersons.filter((s) => s.id !== salespersonToDelete.id)
      );
      toast.success("Salesperson deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete salesperson");
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
      setSalespersonToDelete(null);
    }
  };

  const filteredSalespersons = salespersons.filter((salesperson) =>
    salesperson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salesperson.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
  ];

  const actions = [
    { onClick: handleDelete, icon: <Trash className="w-5 h-5 text-red-600" /> },
  ];

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Manage Salespeople
      </h1>

      <div className="flex justify-end mb-8">
        <Button
          onClick={() => setShowAddModal(true)}
          disabled={loading || !session || session.user.role !== "admin"}
        >
          Add Salesperson
        </Button>
      </div>

      {filteredSalespersons.length > 0 ? (
        <Table columns={columns} data={filteredSalespersons} actions={actions} />
      ) : (
        <p className="text-gray-900 dark:text-white">
          No salespeople found.
        </p>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Salesperson"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <FormField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <FormField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
          />
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setShowAddModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Salesperson"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Confirm Removal"
      >
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Are you sure you want to remove this salesperson?
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
            {loading ? "Removing..." : "Remove"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}