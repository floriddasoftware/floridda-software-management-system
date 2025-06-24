import React from "react";

export default function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in"
      onClick={onClose} 
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl overflow-y-auto max-h-screen"
        onClick={(e) => e.stopPropagation()} 
      >
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}