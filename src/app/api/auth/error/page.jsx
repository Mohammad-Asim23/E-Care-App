'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-500">{error || 'An unknown error occurred'}</p>
        <Link href="/api/auth/signin" className="mt-4 text-blue-500 hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}