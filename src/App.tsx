import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import GroupDetail from "./pages/GroupDetail";
import SessionRoom from "./pages/SessionRoom";
import NotFound from "./pages/NotFound";
import AllGroups from "./pages/AllGroups";
import { ProtectedRoute } from "./components/auth/protected-route";

const App = () => (
  <main className="overflow-x-hidden">
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public route - Landing page */}
          <Route path="/" element={<Index />} />
          
          {/* Protected routes - Require authentication */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/groups/:id" element={
            <ProtectedRoute>
              <GroupDetail />
            </ProtectedRoute>
          } />
          <Route path="/all-groups" element={
            <ProtectedRoute>
              <AllGroups />
            </ProtectedRoute>
          } />
          <Route path="/sessions/:id/:groupId" element={
            <ProtectedRoute>
              <SessionRoom />
            </ProtectedRoute>
          } />
          <Route path="*" element={
            <ProtectedRoute>
              <NotFound />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </main>
);

export default App;
