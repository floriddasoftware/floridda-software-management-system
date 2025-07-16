"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Smartphone } from "lucide-react";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError(result.error);
      } else {
        setMessage("Check your email for login instructions");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-400 rounded-xl overflow-hidden flex flex-col lg:flex-row w-full lg:max-w-6xl shadow-2xl">
        <div className="hidden lg:block relative lg:w-1/2">
          <Image
            src="/Phones.jpg"
            alt="Login illustration"
            fill
            className="object-cover"
          />
        </div>

        <div className="p-8 w-full lg:w-1/2">
          <div className="flex flex-col items-center mb-8">
            <Smartphone className="h-12 w-12 text-purple-600" />
            <p className="mt-1 text-gray-600 dark:text-gray-100">
              Welcome to{" "}
              <span className="font-semibold">Floridda Software</span>
            </p>
          </div>

          <h2 className="text-xl font-semibold mb-6 text-center text-gray-900 dark:text-white">
            Login To Dashboard
          </h2>
          <hr className="border-gray-300 mb-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                Enter Email Address
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-950"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "Sending..." : "Login"}
            </button>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}