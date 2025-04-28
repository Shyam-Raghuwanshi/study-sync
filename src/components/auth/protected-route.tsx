import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { Loader } from "@/components/ui/loader";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to the login page, but save the current path for redirect after login
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render the protected component
  return <>{children}</>;
};