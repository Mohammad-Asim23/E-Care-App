'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserInDatabase } from '../../../../lib/supabaseHelpers'; // Import the helper function
import Link from "next/link";
import Image from "next/image";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [errorMessage, setErrorMessage] = useState(null); // State to handle error messages
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage(null); // Reset error message

    try {
      // Create the user in the database using the helper function
      const user = await createUserInDatabase(email, password, role);
      console.log("User created");

      // After the user is created, redirect them to the role-specific personal info page
      router.push(`/personal-info/${role}?user_id=${user.id}`);
    } catch (error) {
      console.error('Signup failed:', error.message);
      setErrorMessage(error.message); // Set the error message to display to the user
    }
  };

  return (
<div className="min-h-screen flex flex-col justify-center items-center bg-[#f0f4f8]">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row md:max-w-4xl h-[36rem] md:h-[40rem]">
        {/* Illustration Section */}
        <div className="hidden md:flex md:w-1/2 bg-[#089bab] items-center justify-center p-4">
          <Image
            src="/register.png"
            alt="Login Illustration"
            width={400}
            height={400}
            className="max-w-full h-auto"
          />
        </div>

        {/* Sign-Up Form Section */}
        <div className="w-full md:w-1/2 p-6 sm:p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-center text-[#089bab] mb-6">
            Create Your Account
          </h2>
          <form onSubmit={handleSignUp}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring focus:ring-[#089bab] focus:border-[#089bab]"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="labuser">Lab User</option>
              </select>
            </div>

            {errorMessage && (
              <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
            )}

            <button
              type="submit"
              className="w-full bg-[#089bab] hover:bg-[#067f8a] text-white font-semibold py-2.5 rounded-lg shadow-md transition duration-200"
            >
              Sign Up
            </button>
          </form>
          <div className="text-center mt-4">
            <span className="text-gray-600 text-sm">
              Already have an account?{" "}
            </span>
            <Link
              href="/api/auth/signin"
              className="text-sm text-[#089bab] hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}