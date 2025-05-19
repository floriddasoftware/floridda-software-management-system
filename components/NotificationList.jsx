"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useSession } from "next-auth/react";

export default function NotificationList({ onClose }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (session?.user?.email) {
      const fetchNotifications = async () => {
        try {
          const q = query(
            collection(db, "notifications"),
            where("userId", "==", session.user.email),
            where("read", "==", false)
          );
          const querySnapshot = await getDocs(q);
          setNotifications(
            querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };
      fetchNotifications();
    }
  }, [session]);

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="w-64 max-h-64 overflow-y-auto">
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className="px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <p>{notification.message}</p>
            <p className="text-xs">
              {new Date(notification.timestamp).toLocaleString()}
            </p>
            <button
              onClick={() => markAsRead(notification.id)}
              className="text-blue-600 hover:underline text-sm"
            >
              Mark as Read
            </button>
          </div>
        ))
      ) : (
        <p className="px-4 py-2 text-gray-800 dark:text-white">
          No new notifications
        </p>
      )}
    </div>
  );
}