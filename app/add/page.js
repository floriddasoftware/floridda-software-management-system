"use client";
import { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import { Trash } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AddPage() {
  const [salespersons, setSalespersons] = useState([]);
  const [formData, setFormData] = useState({ email: "", name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [salespersonToDelete, setSalespersonToDelete] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSalespersons = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSalespersons(data.filter((user) => user.role === "salesperson"));
      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching salespersons:", error);
      toast.error("Failed to load salespeople");
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (email) => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        toast.error("Email already exists.");
        setLoading(false);
        return;
      }
      await addDoc(collection(db, "users"), {
        ...formData,
        role: "salesperson",
      });
      setFormData({ email: "", name: "", phone: "" });
      setShowAddModal(false);
      fetchSalespersons();
    } catch (error) {
      toast.error("Failed to add salesperson.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDelete = (salesperson) => {
    setSalespersonToDelete(salesperson);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (salespersonToDelete) {
      try {
        await deleteDoc(doc(db, "users", salespersonToDelete.id));
        setSalespersons(
          salespersons.filter((s) => s.id !== salespersonToDelete.id)
        );
      } catch (error) {
        console.error("Error deleting salesperson:", error);
        toast.error("Failed to delete salesperson");
      }
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
    {
      onClick: handleDelete,
      icon: <Trash className="w-5 h-5 text-red-600" />,
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Manage Salespeople
      </h1>

      <div className="flex justify-between mb-8">
        <Button onClick={fetchSalespersons} disabled={loading}>
          {loading ? "Loading..." : "View"}
        </Button>
        <Button onClick={() => setShowAddModal(true)}>Add</Button>
      </div>

      {hasFetched ? (
        salespersons.length > 0 ? (
          <Table columns={columns} data={salespersons} actions={actions} />
        ) : (
          <p className="text-gray-900 dark:text-white">
            No salespeople added yet.
          </p>
        )
      ) : (
        <p className="text-gray-900 dark:text-white">
          Click "View" to see salespeople.
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
          />
          <FormField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <FormField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
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
          <Button onClick={() => setShowConfirmDelete(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}