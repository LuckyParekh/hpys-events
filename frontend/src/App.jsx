import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AudioPlayer from "./components/AudioPlayer";
import ProtectedRoute from "./components/ProtectedRoute";
import { AudioProvider } from "./lib/AudioContext";
import { AuthProvider } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import AddEvent from "./pages/AddEvent";
import Vakta from "./pages/Vakta";
import VaktaProfile from "./pages/VaktaProfile";
import Topics from "./pages/Topics";
import TopicEvents from "./pages/TopicEvents";
import EditEvent from "./pages/EditEvent";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <AudioProvider>
        <BrowserRouter>
          <Navbar />
          <AudioPlayer />
          <main className="max-w-2xl mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route
                path="/events/:id/edit"
                element={
                  <ProtectedRoute adminOnly>
                    <EditEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-event"
                element={
                  <ProtectedRoute adminOnly>
                    <AddEvent />
                  </ProtectedRoute>
                }
              />
              <Route path="/vakta" element={<Vakta />} />
              <Route path="/vakta/:id" element={<VaktaProfile />} />
              <Route path="/topics" element={<Topics />} />
              <Route path="/topics/:topic" element={<TopicEvents />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/account" element={<Account />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </BrowserRouter>
      </AudioProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
