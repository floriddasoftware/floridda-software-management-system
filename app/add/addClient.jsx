"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  setDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import Table from "@/components/Table";
import Modal from "@/components/Modal";
import { Trash } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";

export default function AddClient({ initialSalespersons = [] }) {
  const { data: session } = useSession();
  const [salespersons, setSalespersons] = useState(initialSalespersons);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    branchId: "",
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [salespersonToDelete, setSalespersonToDelete] = useState(null);

  useEffect(() => {
    if (!session || session.user.role !== "admin") return;

    const unsubscribeBranches = onSnapshot(
      collection(db, "branches"),
      (snapshot) => {
        const branchData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBranches(branchData);
        if (branchData.length === 1 && !formData.branchId) {
          setFormData((prev) => ({ ...prev, branchId: branchData[0].id }));
        }
      },
      (error) => {
        console.error("Error fetching branches:", error);
        toast.error("Failed to load branches.");
      }
    );

    const unsubscribeSalespersons = onSnapshot(
      query(collection(db, "userProfiles"), where("role", "==", "salesperson")),
      (snapshot) => {
        setSalespersons(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (error) => {
        console.error("Error fetching salespeople:", error);
        toast.error("Failed to load salespeople.");
      }
    );

    return () => {
      unsubscribeBranches();
      unsubscribeSalespersons();
    };
  }, [session]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!session || session.user.role !== "admin") {
      toast.error("Unauthorized action");
      return;
    }
    if (!formData.email.trim() || !formData.name.trim() || !formData.branchId) {
      toast.error("Email, name, and branch are required.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const lowerEmail = formData.email.trim().toLowerCase();
      const emailQuery = query(
        collection(db, "userProfiles"),
        where("email", "==", lowerEmail)
      );
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        toast.error("A user with this email already exists.");
        setLoading(false);
        return;
      }

      const newSalesperson = {
        email: lowerEmail,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        branchId: formData.branchId,
        role: "salesperson",
        addedBy: session.user.email,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "userProfiles", lowerEmail), newSalesperson);
      toast.success("Salesperson added successfully!");
      setFormData({ email: "", name: "", phone: "", branchId: "" });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding salesperson:", error);
      toast.error("Failed to add salesperson.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
      await deleteDoc(doc(db, "userProfiles", salespersonToDelete.email));
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
    {
      key: "branchId",
      label: "Branch",
      render: (row) =>
        branches.find((b) => b.id === row.branchId)?.name || "Unknown",
    },
  ];

  const actions = [
    { onClick: handleDelete, icon: <Trash className="w-5 h-5 text-red-600" /> },
  ];

  if (!session) {
    return <p className="text-gray-900 dark:text-white p-4">Loading...</p>;
  }

  if (session.user.role !== "admin") {
    return (
      <p className="text-gray-900 dark:text-white p-4">
        You do not have permission to view this page.
      </p>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Manage Salespeople
      </h1>
      <div className="flex justify-end mb-8">
        <Button
          onClick={() => setShowAddModal(true)}
          disabled={loading}
          aria-label="Add Salesperson"
        >
          Add Salesperson
        </Button>
      </div>
      {salespersons.length > 0 ? (
        <Table columns={columns} data={salespersons} actions={actions} />
      ) : (
        <p className="text-gray-900 dark:text-white">
          No salespeople available.
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Branch
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={loading || branches.length === 0}
            >
              {branches.length === 0 ? (
                <option value="">No branches available</option>
              ) : (
                <>
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.location})
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>
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
        <div className="space-x-2">
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