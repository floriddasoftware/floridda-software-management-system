"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Unauthorized Access
        </h1>
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          You do not have permission to view this page. Please log in to
          continue.
        </p>
        <button
          onClick={handleLogin}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>
      </div>
    </motion.div>
  );
}