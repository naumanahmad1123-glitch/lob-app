import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Groups from "./pages/Groups";
import Connect from "./pages/Connect";
import GroupDetail from "./pages/GroupDetail";
import CreateLob from "./pages/CreateLob";
import LobDetail from "./pages/LobDetail";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import FriendTripDetail from "./pages/FriendTripDetail";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import CreateGroup from "./pages/CreateGroup";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
    <Route path="/connect" element={<ProtectedRoute><Connect /></ProtectedRoute>} />
    <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
    <Route path="/create" element={<ProtectedRoute><CreateLob /></ProtectedRoute>} />
    <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
    <Route path="/lob/:id" element={<ProtectedRoute><LobDetail /></ProtectedRoute>} />
    <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
    <Route path="/trips/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
    <Route path="/trips/:id/friend" element={<ProtectedRoute><FriendTripDetail /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/user/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
