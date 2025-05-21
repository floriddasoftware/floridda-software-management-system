"use client";
import { useSession } from "next-auth/react";

const capitalize = (str) => {
  if (!str) return "Unknown"; 
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1); 
};

export default function UserInfo() {
  const { data: session } = useSession();
  if (!session) return null;

  return (
    <div className="text-gray-800 dark:text-white">
      <p>
        <strong>Name:</strong> {session.user.name || "N/A"}
      </p>
      <p>
        <strong>Email:</strong> {session.user.email}
      </p>
      <p>
        <strong>Role:</strong> {capitalize(session.user.role)}
      </p>
    </div>
  );
}