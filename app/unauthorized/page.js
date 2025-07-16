"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"
    >
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Access Restricted
        </h1>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            You don't have permission to access this page
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Please contact your administrator if you believe this is an error
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Login Again
          </button>
        </div>
      </div>
    </motion.div>
  );
}