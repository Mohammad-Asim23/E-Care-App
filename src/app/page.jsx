'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUser } from "../context/userContext";
import { Spinner } from "../components/Spinner";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useUser();

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
    if (!session) {
      // If no session, redirect to the sign-in page
      router.push("/api/auth/signin");
    } else {
      // If session exists, redirect to the dashboard
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Fallback content or loading state
  return <Spinner/>;
}
