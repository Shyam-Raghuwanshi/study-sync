
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import GroupDetail from "./pages/GroupDetail";
import SessionRoom from "./pages/SessionRoom";
import NotFound from "./pages/NotFound";

const App = () => (
  <main className="overflow-x-hidden">
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/sessions/:id" element={<SessionRoom />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </main>
);

export default App;
