"use client";
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import { Trash } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";

export default function AddClient({ initialSalespersons }) {
  const { data: session } = useSession();
  const [salespersons, setSalespersons] = useState(initialSalespersons || []);
  const [formData, setFormData] = useState({ email: "", name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [salespersonToDelete, setSalespersonToDelete] = useState(null);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }

    setLoading(true);
    try {
      const newSalesperson = {
        ...formData,
        role: "salesperson",
        addedBy: session.user.email,
      };

      const docRef = await addDoc(
        collection(db, "salespeople"),
        newSalesperson
      );
      setSalespersons([...salespersons, { id: docRef.id, ...newSalesperson }]);
      toast.success("Salesperson added successfully!");
      setFormData({ email: "", name: "", phone: "" });
      setShowAddModal(false);
    } catch (error) {
      toast.error("Failed to add salesperson.");
      console.error("Error adding salesperson:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDelete = (salesperson) => {
    if (!session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
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
      await deleteDoc(doc(db, "salespeople", salespersonToDelete.id));
      setSalespersons(
        salespersons.filter((s) => s.id !== salespersonToDelete.id)
      );
      toast.success("Salesperson deleted successfully!");
    } catch (error) {
      console.error("Error deleting salesperson:", error);
      toast.error("Failed to delete salesperson.");
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
      setSalespersonToDelete(null);
    }
  };

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
          disabled={loading || (session && session.user.role !== "admin")}
        >
          Add
        </Button>
      </div>

      {salespersons.length > 0 ? (
        <Table columns={columns} data={salespersons} actions={actions} />
      ) : (
        <p className="text-gray-900 dark:text-white">
          No salespeople added yet.
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