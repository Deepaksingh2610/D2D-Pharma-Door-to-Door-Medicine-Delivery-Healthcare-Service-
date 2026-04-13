import { useState, useRef, useEffect } from "react";
import { Link, useLocation as useRouterLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import { useMedical } from "../context/MedicalContext";
import { useCart } from "../context/CartContext";
import { useAppointment } from "../context/AppointmentContext";
import { FaLocationArrow, FaBell, FaMapMarkerAlt } from "react-icons/fa";
import LocationModal from "./LocationModal";

/* ── Notification Bell dropdown ── */
const NotifBell = ({ email }) => {
  const { getNotificationsByUser, markNotificationRead, markAllNotificationsRead } = useAppointment();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const notifs = getNotificationsByUser(email).slice().reverse(); // newest first
  const unread = notifs.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const fmtTime = (iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMin = Math.round((now - d) / 60000);
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch { return ""; }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition"
        title="Notifications"
      >
        <FaBell className="text-lg" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="font-bold text-gray-800 text-sm">🔔 Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAllNotificationsRead(email)}
                className="text-blue-600 text-xs font-semibold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              <FaBell className="text-3xl mx-auto mb-2 text-gray-200" />
              No notifications yet
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifs.map(n => (
                <li
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${!n.read ? "bg-blue-50/60" : ""}`}
                >
                  <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">{fmtTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { location, autoDetectLocation, detecting } = useLocation();
  const { medical } = useMedical();
  const { cart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const routerLocation = useRouterLocation();

  const closeMenu = () => setMenuOpen(false);

  // Format location for display: "Area, City" or just "City" or "Set Location"
  const locationDisplay = () => {
    if (!location) return "Set Location";
    const parts = [location.area, location.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Set Location";
  };

  return (
    <nav className="bg-white shadow-md relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

        {/* LEFT: Logo */}
        <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600 flex-shrink-0" onClick={closeMenu}>
          D2D Pharma
        </Link>

        {/* CENTER: Location (desktop only) */}
        <div className="hidden md:flex items-center gap-2">
          {locationModalOpen && <LocationModal onClose={() => setLocationModalOpen(false)} />}
          <div className="flex items-center gap-2">
            {/* Location Chip */}
            <button
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 text-sm bg-gray-50 hover:bg-white transition max-w-[260px] overflow-hidden"
              title="Click to change location"
            >
              <FaMapMarkerAlt className="text-blue-500 flex-shrink-0" />
              <span className="truncate text-gray-700 font-medium">{locationDisplay()}</span>
            </button>
            {/* Auto-Detect Button */}
            <button
              onClick={autoDetectLocation}
              disabled={detecting}
              title="Auto-detect my current location"
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold border transition
                ${
                  detecting
                    ? "bg-blue-50 text-blue-400 border-blue-200 cursor-wait"
                    : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95 shadow-sm"
                }`}
            >
              {detecting ? (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <FaLocationArrow className="text-xs" />
              )}
              {detecting ? "Detecting…" : "Auto-Detect"}
            </button>
          </div>
        </div>

        {/* RIGHT: Desktop Links */}
        <div className="hidden md:flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <Link to="/medical-stores" className="hover:text-blue-600">Medical Stores</Link>
          <Link to="/medicines" className="hover:text-blue-600">Medicines</Link>
          <Link to="/doctors" className="hover:text-blue-600">Doctors</Link>
          <Link to="/lab-tests" className="hover:text-blue-600">Lab Tests</Link>
          <Link to="/cart" className="relative hover:text-blue-600">
            Cart
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-1.5 rounded-full">
                {cart.length}
              </span>
            )}
          </Link>
          <Link to="/profile" className="hover:text-blue-600">Profile</Link>

          {/* Notification Bell — only for logged-in patients (not partners) */}
          {user && user.role === "patient" && <NotifBell email={user.email} />}

          {user ? (
            <button
              onClick={logout}
              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
            >
              Login
            </Link>
          )}
        </div>

        {/* RIGHT: Mobile – Cart badge + Hamburger */}
        <div className="flex md:hidden items-center gap-3">
          {/* Notification bell on mobile */}
          {user && user.role === "patient" && <NotifBell email={user.email} />}

          <Link to="/cart" className="relative text-gray-700" onClick={closeMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
          </Link>

          {/* Hamburger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-700 hover:text-blue-600 focus:outline-none p-1"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg px-4 pb-4 flex flex-col gap-0">
          {/* Location Selector - Mobile */}
          <div className="py-3 border-b border-gray-100 space-y-2">
            {locationModalOpen && <LocationModal onClose={() => setLocationModalOpen(false)} />}
            <div className="flex gap-2">
              {/* Location Chip (Mobile) */}
              <button
                onClick={() => setLocationModalOpen(true)}
                className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 hover:bg-white transition truncate"
              >
                <FaMapMarkerAlt className="text-blue-500 flex-shrink-0" />
                <span className="truncate text-gray-700 font-medium text-left">{locationDisplay()}</span>
              </button>
              <button
                onClick={autoDetectLocation}
                disabled={detecting}
                title="Detect my location"
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition flex-shrink-0
                  ${
                    detecting
                      ? "bg-blue-50 text-blue-400 border-blue-200 cursor-wait"
                      : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  }`}
              >
                {detecting ? (
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <FaLocationArrow />
                )}
                {detecting ? "…" : "Detect"}
              </button>
            </div>
          </div>

          {/* Nav Links */}
          {[
            { to: "/", label: "Home" },
            { to: "/medical-stores", label: "Medical Stores" },
            { to: "/medicines", label: "Medicines" },
            { to: "/doctors", label: "Doctors" },
            { to: "/lab-tests", label: "Lab Tests" },
            { to: "/profile", label: "Profile" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMenu}
              className="py-3 border-b border-gray-50 text-gray-700 font-medium hover:text-blue-600 transition text-sm"
            >
              {label}
            </Link>
          ))}

          {/* Auth Button */}
          <div className="mt-3">
            {user ? (
              <button
                onClick={() => { logout(); closeMenu(); }}
                className="w-full bg-red-500 text-white py-2.5 rounded-lg font-bold hover:bg-red-600 transition text-sm"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
