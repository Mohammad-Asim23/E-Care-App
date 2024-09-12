"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser(session.user);
    } else if (status === "unauthenticated") {
      setUser(null);
    }
    setLoading(false);
  }, [session, status]);

  return (
    <UserContext.Provider value={{ user, setUser, status, loading }}>
      {children}
    </UserContext.Provider>
  );
};
