"use client";

import { useEffect, useState } from "react";
import { useUser } from "../context/userContext";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FiMenu, FiX } from "react-icons/fi";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const { user, setUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname(); // Get the current path
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/api/auth/signin");
    }
  }, [user, session, router]);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setUser(null); // Clear the user from the global context
  };

  const getLinkClass = (path) => {
    return pathname === path
      ? "bg-white text-[#089bab] rounded p-2 transition-colors"
      : "hover:bg-white hover:text-[#089bab] rounded p-2 transition-colors";
  };

  return (
    <header className="bg-[#089bab] text-white">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Patient-Centric-Care</h1>
        <nav className="hidden md:flex space-x-6">
          <Link href="/dashboard" className={getLinkClass("/dashboard")}>
            Dashboard
          </Link>

          {user?.role === "labuser" && (
            <Link
              href="/dashboard/view-records"
              className={getLinkClass("/dashboard/view-records")}
            >
              View Records
            </Link>
          )}

          {user?.role === "patient" && (
            <>
              <Link
                href="/dashboard/appointments"
                className={getLinkClass("/dashboard/appointments")}
              >
                Appointments
              </Link>
              <Link
                href="/dashboard/lab-tests"
                className={getLinkClass("/dashboard/lab-tests")}
              >
                Lab Tests
              </Link>
              <Link
                href="/dashboard/consult-doctor"
                className={getLinkClass("/dashboard/consult-doctor")}
              >
                Consult Doctor
              </Link>
            </>
          )}

          {user?.role === "doctor" && (
            <>
              <Link
                href="/dashboard/appointments"
                className={getLinkClass("/dashboard/appointments")}
              >
                Appointments
              </Link>
              <Link
                href="/dashboard/consult-doctor"
                className={getLinkClass("/dashboard/consult-doctor")}
              >
                Consultation
              </Link>
            </>
          )}

          <Link href="/dashboard/profile" className={getLinkClass("/dashboard/profile")}>
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="hover:bg-white hover:text-[#089bab] rounded p-2 transition-colors"
          >
            Logout
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button onClick={toggleNavbar} className="md:hidden">
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <nav className="md:hidden bg-[#089bab]  text-white p-4">
          <Link
            href="/dashboard"
            className={`${getLinkClass("/dashboard")} block py-2`}
            onClick={toggleNavbar}
          >
            Dashboard
          </Link>

          {user?.role === "labuser" && (
            <Link
              href="/dashboard/view-records"
              className={`${getLinkClass("/dashboard/view-records")} block py-2`}
              onClick={toggleNavbar}
            >
              View Records
            </Link>
          )}

          {user?.role === "patient" && (
            <>
              <Link
                href="/dashboard/appointments"
                className={`${getLinkClass("/dashboard/appointments")} block py-2`}
                onClick={toggleNavbar}
              >
                Appointments
              </Link>
              <Link
                href="/dashboard/lab-tests"
                className={`${getLinkClass("/dashboard/lab-tests")} block py-2`}
                onClick={toggleNavbar}
              >
                Lab Tests
              </Link>
              <Link
                href="/dashboard/consult-doctor"
                className={`${getLinkClass("/dashboard/consult-doctor")} block py-2`}
                onClick={toggleNavbar}
              >
                Consult Doctor
              </Link>
            </>
          )}

          {user?.role === "doctor" && (
            <>
              <Link
                href="/dashboard/appointments"
                className={`${getLinkClass("/dashboard/appointments")} block py-2`}
                onClick={toggleNavbar}
              >
                Appointments
              </Link>
              <Link
                href="/dashboard/consult-doctor"
                className={`${getLinkClass("/dashboard/consult-doctor")} block py-2`}
                onClick={toggleNavbar}
              >
                Consultation
              </Link>
            </>
          )}

          <Link
            href="/dashboard/profile"
            className={`${getLinkClass("/dashboard/profile")} block py-2`}
            onClick={toggleNavbar}
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="block p-2 hover:bg-white  hover:text-[#089bab] rounded transition-colors"
          >
            Logout
          </button>
        </nav>
      )}
    </header>
  );
}
