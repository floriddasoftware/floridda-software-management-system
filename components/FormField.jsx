import React from "react";

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  disabled = false,
}) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label} {required && "*"}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        required={required}
        disabled={disabled}
      />
    </label>
  );
}