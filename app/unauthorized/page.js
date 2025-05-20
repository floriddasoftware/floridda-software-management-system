"use client"; 
import { motion } from "framer-motion";

export default function UnauthorizedPage() {
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
          You do not have permission to view this page.
        </p>
      </div>
    </motion.div>
  );
}