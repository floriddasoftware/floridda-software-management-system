"use client";
import Image from "next/image";
import { Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);

  const ADMIN_EMAIL = "floriddasoftware@gmail.com".toLowerCase();

  useEffect(() => {
    const checkEmailValidity = async () => {
      const lowerEmail = email.trim().toLowerCase();
      if (!lowerEmail) {
        setIsValidEmail(false);
        return;
      }

      if (lowerEmail === ADMIN_EMAIL) {
        setIsValidEmail(true);
        return;
      }

      try {
        const q = query(
          collection(db, "userProfiles"),
          where("email", "==", lowerEmail),
          where("role", "==", "salesperson")
        );
        const querySnapshot = await getDocs(q);
        setIsValidEmail(!querySnapshot.empty);
      } catch (error) {
        console.error("Error checking email:", error);
        setIsValidEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmailValidity, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail) return;

    setError("");
    setMessage("");
    setLoading(true);

    const res = await signIn("nodemailer", {
      email: email.trim().toLowerCase(),
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);
    if (res?.error) {
      setError("Failed to send login email.");
    } else {
      setMessage("Check your email! You should receive a login link shortly.");
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 shadow-lg dark:shadow-lg">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-400 rounded-xl overflow-hidden flex flex-col lg:flex-row w-full lg:max-w-6xl shadow-2xl lg:mx-0 md:mx-4 mx-2">
        <div className="hidden lg:block relative lg:w-1/2">
          <Image
            src="/Phones.jpg"
            alt="Shopping illustration"
            fill
            className="object-cover"
          />
        </div>

        <div className="p-8 w-full lg:w-1/2">
          <div className="flex flex-col items-center mb-8">
            <Smartphone className="h-12 w-12 text-purple-600" />
            <p className="mt-1 text-gray-600 dark:text-gray-100">
              Welcome to{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                <i>Floridda Software</i>
              </span>
            </p>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Login To Dashboard
          </h2>
          <hr className="border-gray-300 mb-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 dark:text-white"
              >
                Enter Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter Email Address"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-950"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 text-white rounded-lg font-medium transition ${
                isValidEmail
                  ? "bg-purple-600 hover:bg-purple-700 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={loading || !isValidEmail}
            >
              {loading ? "Sending..." : "Login"}
            </button>

            {error && (
              <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}