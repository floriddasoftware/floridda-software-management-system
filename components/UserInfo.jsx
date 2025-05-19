"use client";
import { useSession } from "next-auth/react";

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
        <strong>Role:</strong> {session.user.role}
      </p>
    </div>
  );
}