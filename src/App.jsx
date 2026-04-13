import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import MedicalStores from "./pages/MedicalStores";
import Medicines from "./pages/Medicines";
import Cart from "./pages/Cart";

import LabTests from "./pages/LabTests";
import Doctors from "./pages/Doctors";

import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

import { useEffect, useState } from "react";
import { useLocation as useGeoLocation } from "./context/LocationContext";
import LocationModal from "./components/LocationModal";
import IncomingCallOverlay from "./components/IncomingCallOverlay";

// ✅ DASHBOARDS
import DoctorDashboard from "./dashboards/DoctorDashboard";
import LabDashboard from "./dashboards/LabDashboard";
import PharmacyDashboard from "./dashboards/PharmacyDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import RiderDashboard from "./dashboards/RiderDashboard";

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const { location } = useGeoLocation();
  const [showModal, setShowModal] = useState(false);
  const routerLocation = useLocation();

  useEffect(() => {
    if (!location) {
      setShowModal(true);
    }
  }, [location]);

  // Hide Navbar and Footer on Login, Signup, and all partner dashboards
  const DASHBOARD_ROUTES = ["/doctor-dashboard", "/lab-dashboard", "/pharmacy-dashboard", "/admin-dashboard", "/rider-dashboard"];
  const hideNavFooter = ["/login", "/signup", ...DASHBOARD_ROUTES].includes(routerLocation.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavFooter && <Navbar />}
      <Toaster position="top-center" reverseOrder={false} />
      <IncomingCallOverlay />

      <div className="flex-1">
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* USER */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/medical-stores"
            element={
              <ProtectedRoute>
                <MedicalStores />
              </ProtectedRoute>
            }
          />

          <Route
            path="/medicines"
            element={
              <ProtectedRoute>
                <Medicines />
              </ProtectedRoute>
            }
          />



          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lab-tests"
            element={
              <ProtectedRoute>
                <LabTests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctors"
            element={
              <ProtectedRoute>
                <Doctors />
              </ProtectedRoute>
            }
          />


          {/* PARTNER DASHBOARDS */}
          <Route
            path="/doctor-dashboard"
            element={
              <ProtectedRoute>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lab-dashboard"
            element={
              <ProtectedRoute>
                <LabDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pharmacy-dashboard"
            element={
              <ProtectedRoute>
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rider-dashboard"
            element={
              <ProtectedRoute>
                <RiderDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/admin-dashboard" element={<AdminDashboard />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {showModal && (
        <LocationModal onClose={() => setShowModal(false)} />
      )}

      {!hideNavFooter && <Footer />}
    </div>
  );
}

export default App;



