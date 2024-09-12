"use client";

import { useEffect, useState } from "react";
import { getSession, signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "../../../../context/userContext";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: session } = useSession(); // Access the session from NextAuth
  const { user, setUser , loading} = useUser(); // Access setUser from the global state

  const router = useRouter();

  useEffect(() => {

    // Redirect to the dashboard if there's already an active session
    if (session?.user  && !loading) {
      setUser(session.user); // Set the global user state
      router.push("/dashboard");
    }
  }, [session, user, setUser, router, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
  
    if (result?.error) {
      console.error(result.error);
      alert("Sign-in failed. Please check your credentials.");

    } else {
      // Wait for the session to be updated
      const updatedSession = await getSession();
      if (updatedSession?.user) {
        setUser(updatedSession.user);
        router.push("/dashboard");
      } else {
        console.error("Session not created after sign in");
      }
    }
  };

  return (
<div className="min-h-screen flex flex-col justify-center items-center bg-[#f0f4f8]">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row md:max-w-4xl h-[32rem] md:h-[36rem]">
        {/* Illustration Section */}
        <div className="hidden md:flex md:w-1/2 bg-[#089bab] items-center justify-center p-4">
          <Image
            src="/login.png"
            alt="Login Illustration"
            width={400}
            height={400}
            className="max-w-full h-auto"
          />
        </div>

        {/* Sign-In Form Section */}
        <div className="w-full md:w-1/2 p-6 sm:p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-center text-[#089bab] mb-6">
            Welcome Back
          </h2>
          <form onSubmit={handleSubmit}>
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
            <div className="mb-6">
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
            <button
              type="submit"
              className="w-full bg-[#089bab] hover:bg-[#067f8a] text-white font-semibold py-2.5 rounded-lg shadow-md transition duration-200"
            >
              Sign In
            </button>
          </form>
          <div className="text-center mt-4">
            <span className="text-gray-600 text-sm">
              Don't have an account?{" "}
            </span>
            <Link
              href="/api/auth/signup"
              className="text-sm text-[#089bab] hover:underline"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}