import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import CreateLob from "./pages/CreateLob";
import LobDetail from "./pages/LobDetail";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import FriendTripDetail from "./pages/FriendTripDetail";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import CreateGroup from "./pages/CreateGroup";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/create" element={<CreateLob />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/lob/:id" element={<LobDetail />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:id" element={<TripDetail />} />
          <Route path="/trips/:id/friend" element={<FriendTripDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
