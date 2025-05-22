"use client";
export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="text-gray-600 dark:text-white text-[0.7em]">
      <span>© {currentYear} Floridda Software</span>
    </footer>
  );
}