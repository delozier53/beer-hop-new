import { useState, useEffect } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('useAuth state:', { user, isLoading, isAuthenticated: !!user });

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem("beer-hop-user");
    console.log('Stored user data:', storedUser);
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('Parsed user data:', userData);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("beer-hop-user");
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("beer-hop-user");
    setUser(null);
    // Force page refresh to ensure proper state reset
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}