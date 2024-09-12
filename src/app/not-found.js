"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-6xl font-bold text-[#089bab] mb-4">404</h1>
      <p className="text-2xl font-semibold text-gray-800 mb-4">
        Page Not Found
      </p>
      <p className="text-lg text-gray-600 mb-8">
        Oops! The page you're looking for doesn't exist.
      </p>
      <div className="space-x-4">
        <button
          onClick={() => router.back()}
          className="bg-[#089bab] text-white py-2 px-4 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors"
        >
          Go Back
        </button>
        <Link
          href="/dashboard"
          className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-white hover:text-gray-600 border border-gray-600 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
