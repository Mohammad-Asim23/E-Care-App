"use client";

import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-grow p-4 container mx-auto">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
