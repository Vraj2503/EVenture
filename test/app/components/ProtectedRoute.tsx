// components/ProtectedRoute.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // User is not authenticated, redirect to login
        router.push("/login");
      } else {
        // User is authenticated, allow access to the protected route
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we verify your access.</p>
        </div>
      </div>
    );
  }

  // Render children only if authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;