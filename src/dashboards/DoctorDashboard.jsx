import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../context/AppointmentContext";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../context/LocationContext";
import {
  FaUserMd, FaCalendarCheck, FaUserInjured, FaChartLine, FaRupeeSign,
  FaCog, FaSignOutAlt, FaStethoscope, FaClock, FaCommentMedical,
  FaCheck, FaTimes, FaShieldAlt, FaCreditCard, FaMobileAlt,
  FaUniversity, FaMoneyBillWave, FaBell, FaPhone, FaEnvelope,
  FaCalendarAlt, FaMapMarkerAlt, FaNotesMedical, FaUserEdit, FaExclamationTriangle,
  FaCamera, FaCheckCircle, FaPhoneAlt, FaLocationArrow, FaVideo, FaClinicMedical, FaChevronLeft
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

/* ── Notification Bell ── */
const DoctorNotifBell = ({ email }) => {
  const { getNotificationsByUser, markNotificationRead, markAllNotificationsRead } = useAppointment();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const notifs = getNotificationsByUser(email).slice().reverse();
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fmt = (iso) => {
    try {
      const d = new Date(iso), diff = Math.round((new Date() - d) / 60000);
      if (diff < 1) return "Just now";
      if (diff < 60) return `${diff}m ago`;
      if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch { return ""; }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2.5 rounded-full bg-white border border-gray-200 hover:bg-blue-50 text-gray-500 hover:text-blue-600 shadow-sm transition"
        title="Notifications">
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
            {unread > 0 && <button onClick={() => markAllNotificationsRead(email)} className="text-blue-600 text-xs font-semibold hover:underline">Mark all read</button>}
          </div>
          {notifs.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm"><FaBell className="text-3xl mx-auto mb-2 text-gray-200" />No notifications yet</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifs.map((n, idx) => (
                <li key={n._id || n.id || idx} onClick={() => markNotificationRead(n.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${!n.read ? "bg-blue-50/60" : ""}`}>
                  <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-gray-800" : "text-gray-600"}`}>{n.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{fmt(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Payment method icon/pill ── */
const PayBadge = ({ method }) => {
  const icon = method === "card" ? <FaCreditCard /> : method === "netbanking" ? <FaUniversity /> : method === "cod" ? <FaMoneyBillWave /> : <FaMobileAlt />;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
      {icon} {method?.toUpperCase()}
    </span>
  );
};

// Standardized nearestArea imported via useLocation()

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
  const map = { pending: "bg-yellow-100 text-yellow-700", accepted: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-600" };
  const label = { pending: "⏳ Pending", accepted: "✓ Accepted", rejected: "✗ Rejected" };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${map[status] || "bg-gray-100 text-gray-500"}`}>{label[status] || status}</span>;
};

/* ── MAIN DASHBOARD ── */
const DoctorDashboard = () => {
  const { user, logout, updateProfile, getAccountStatus } = useAuth();
  const {
    getPartnerAppointments, updateAppointmentStatus, getNotificationsByUser,
    markNotificationRead, markAllNotificationsRead, registerPartner,
    fetchPartnerAppointments, fetchNotifications, startVideoCall, endVideoCall,
    uploadPrescription, submitComplaint
  } = useAppointment();

  // Load data from DB on mount
  useEffect(() => {
    if (user?.email) {
      fetchPartnerAppointments(user.email);
      fetchNotifications(user.email);
    }
  }, [user?.email]);
  const { nearestArea } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState("list"); // list or calendar
  const [availability, setAvailability] = useState(null);
  const [isSavingAvail, setIsSavingAvail] = useState(false);

  useEffect(() => {
    if (user?._id) fetchAvailability();
  }, [user?._id]);

  const fetchAvailability = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiUrl}/doctor/availability/${user?._id || user?.id}`);
      if (!res.ok) {
        const text = await res.text();
        console.error("Fetch availability error status:", res.status, text.slice(0, 100));
        return;
      }
      const data = await res.json();
      if (data.success) setAvailability(data.data);
    } catch (err) { console.error("Error fetching availability:", err); }
  };

  const saveAvailability = async (availData) => {
    setIsSavingAvail(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiUrl}/doctor/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: user?._id || user?.id, ...availData })
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Save availability error status:", res.status, text.slice(0, 100));
        return;
      }
      const data = await res.json();
      if (data.success) setAvailability(data.data);
    } catch (err) { console.error("Error saving availability:", err); }
    setIsSavingAvail(false);
  };

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: user?.phone || "",
    location: user?.location || "",
    fees: user?.fees || "",
    onlineFees: user?.onlineFees || "",
    onlineTimings: user?.onlineTimings || "",
    bankName: user?.bankName || user?.bank?.bankName || "",
    accountNum: user?.accountNum || user?.bank?.accountNumber || "",
    ifsc: user?.ifsc || user?.bank?.ifsc || ""
  });

  // Complaint State
  const [complaintForm, setComplaintForm] = useState({ reason: "", email: user?.email || "" });
  const [complaintStatus, setComplaintStatus] = useState("");

  // Location detection state
  const [detecting, setDetecting] = useState(false);
  const [detectErr, setDetectErr] = useState("");

  // Sync Edit Form with User Data
  useEffect(() => {
    if (user) {
      setEditForm({
        phone: user.phone || "",
        location: user.location || "",
        fees: user.fees || "",
        onlineFees: user.onlineFees || "",
        onlineTimings: user.onlineTimings || "",
        bankName: user.bankName || user.bank?.bankName || "",
        accountNum: user.accountNum || user.bank?.accountNumber || "",
        ifsc: user.ifsc || user.bank?.ifsc || ""
      });
      setComplaintForm(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  const detectAddress = () => {
    setDetecting(true); setDetectErr("");
    if (!navigator.geolocation) { setDetectErr("Geolocation not supported"); setDetecting(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const area = nearestArea(coords.latitude, coords.longitude);
        setEditForm(prev => ({ ...prev, location: `${area}` }));
        setDetecting(false);
      },
      () => { setDetectErr("Could not detect. Please enter manually."); setDetecting(false); },
      { timeout: 8000 }
    );
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const accountStatus = getAccountStatus();
  if (accountStatus !== "approved") {
    return <PendingApprovalScreen role="Doctor" onLogout={handleLogout} status={accountStatus} />;
  }

  const appointments = getPartnerAppointments(user?.email || "");
  const pending  = appointments.filter(a => a.status === "pending");
  const accepted = appointments.filter(a => a.status === "accepted");
  const rejected = appointments.filter(a => a.status === "rejected");
  const onlineAppts = appointments.filter(a => a.consultationType === "video");
  const physicalAppts = appointments.filter(a => a.consultationType !== "video");
  const paidAppts = appointments.filter(a => a.paymentStatus === "paid");
  const totalEarned = paidAppts.reduce((s, a) => s + (Number(a.amount) || Number(a.fees) || 0), 0);

  // Sidebar tabs
  const tabs = [
    { id: "overview",      icon: <MdDashboard />,        label: "Overview" },
    { id: "appointments",  icon: <FaCalendarCheck />,     label: "Appointments" },
    { id: "availability",  icon: <FaClock />,             label: "Availability" },
    { id: "patients",      icon: <FaUserInjured />,       label: "Patients" },
    { id: "earnings",      icon: <FaRupeeSign />,         label: "Earnings" },
    { id: "profile",       icon: <FaUserEdit />,          label: "Profile" },
    { id: "support",       icon: <FaExclamationTriangle />, label: "Support" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-blue-600 text-white flex flex-col fixed h-full shadow-xl z-20">
        <div className="px-6 py-6 border-b border-blue-500/50 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">D</div>
          <span className="text-xl font-bold tracking-wide">D2D Pharma</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left relative group
                ${activeTab === t.id ? "bg-white/15 text-white shadow-inner" : "text-blue-100 hover:bg-blue-500 hover:text-white"}`}>
              <span className="text-lg">{t.icon}</span>
              <span className="font-medium">{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-500/50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/90 transition text-sm font-medium">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},{" "}
              <span className="text-blue-600">Dr. {user?.name || "Doctor"}</span>
            </h1>
            <p className="text-gray-500 mt-1">
              {activeTab === "overview" && "Here's your dashboard overview."}
              {activeTab === "appointments" && "Manage your patient appointment requests."}
              {activeTab === "patients" && "All patients who have booked with you."}
              {activeTab === "earnings" && "Your earnings from paid consultations."}
              {activeTab === "profile" && "View and edit your professional profile."}
              {activeTab === "support" && "Submit support tickets to the admin team."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DoctorNotifBell email={user?.email || ""} />
            <div onClick={() => setActiveTab("profile")} className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 transition">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                {user?.profilePhoto ? <img src={user.profilePhoto} alt="p" className="w-full h-full object-cover" /> : <FaUserMd />}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">{user?.specialty || "Doctor"}</p>
                <p className="text-sm font-semibold">Dr. {user?.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ═══════════ OVERVIEW TAB ═══════════ */}
        {activeTab === "overview" && (
          <>
            {/* Stats Overview */}
            <div className="flex flex-col gap-6 mb-8">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<FaCalendarCheck />} title="Total Appts" count={appointments.length}  subtitle="All time"           color="text-blue-600"   bg="bg-blue-50" />
                <StatCard icon={<FaCheck />}         title="Confirmed"    count={accepted.length}      subtitle="Seen & confirmed"  color="text-green-600"  bg="bg-green-50" />
                <StatCard icon={<FaVideo />}         title="Online"       count={onlineAppts.length}   subtitle="Video calls"       color="text-purple-600" bg="bg-purple-50" />
                <StatCard icon={<FaClinicMedical />} title="Physical"    count={physicalAppts.length} subtitle="In-clinic visits"  color="text-indigo-600" bg="bg-indigo-50" />
              </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<FaRupeeSign />}      title="Total Earnings" count={`₹${totalEarned.toLocaleString("en-IN")}`} subtitle="Paid consultations" color="text-emerald-700" bg="bg-emerald-50" />
                <StatCard icon={<FaClock />}          title="Awaiting"      count={pending.length}    subtitle="Pending response"  color="text-yellow-600" bg="bg-yellow-50" />
                <StatCard icon={<FaUserInjured />}    title="Patients"      count={[...new Set(appointments.map(a => a.patientEmail))].length} subtitle="Unique patients" color="text-orange-600" bg="bg-orange-50" />
              </div>
            </div>

            {/* Recent appointments preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Recent Appointment Requests</h2>
                <button onClick={() => setActiveTab("appointments")} className="text-blue-600 text-sm font-semibold hover:underline">View all →</button>
              </div>
              {appointments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaCalendarCheck className="text-4xl mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No appointments yet.</p>
                  <p className="text-sm mt-1">Patients will appear here after they book with you.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.slice(0, 5).map(appt => (
                    <div key={appt.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {appt.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm">{appt.name}</p>
                            {appt.tokenNumber && (
                              <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-black">
                                {appt.tokenNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{appt.appointmentDate} at {appt.appointmentTime}</p>
                        </div>
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                  ))}
                  {appointments.length > 5 && (
                    <p className="text-center text-sm text-gray-400 pt-2">+{appointments.length - 5} more in Appointments tab</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══════════ APPOINTMENTS TAB ═══════════ */}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Patient Appointments</h2>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setViewMode("list")} 
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>List</button>
                <button onClick={() => setViewMode("calendar")} 
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === "calendar" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>Calendar</button>
              </div>
            </div>

            {viewMode === "calendar" ? (
              <DoctorCalendar appointments={appointments} />
            ) : appointments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FaCalendarCheck className="text-5xl mx-auto mb-3 text-gray-200" />
                <p className="font-semibold text-base">No appointments yet</p>
                <p className="text-sm mt-1">Patients will appear here after they book with you.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pending first */}
                {[...pending, ...accepted, ...rejected].map(appt => (
                  <AppointmentCard
                    key={appt.id} appt={appt}
                    onAccept={() => updateAppointmentStatus(appt.id, "accepted")}
                    onReject={() => updateAppointmentStatus(appt.id, "rejected")}
                    onStartCall={() => {
                      startVideoCall(appt._id || appt.id);
                      window.open(`https://meet.jit.si/D2DPharma_Consult_${appt._id || appt.id}`, "_blank");
                    }}
                    onEndCall={() => endVideoCall(appt._id || appt.id)}
                    onUploadPrescription={uploadPrescription}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ AVAILABILITY TAB ═══════════ */}
        {activeTab === "availability" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-50">
              <div>
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <FaClock className="text-blue-600" /> Manage Availability
                </h2>
                <p className="text-sm text-gray-400 mt-1">Configure your working days and consult slots.</p>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold">
                <FaStethoscope className="text-base" /> {user?.specialty || "Doctor"}
              </div>
            </div>

            {!availability ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">You haven't configured your details yet.</p>
                <button onClick={() => saveAvailability({
                  availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                  morning: { active: true, start: "09:00", end: "12:00" },
                  evening: { active: true, start: "17:00", end: "20:00" },
                  consultationTypes: ["physical"],
                  slotDuration: 30,
                  capacityPerSlot: 5
                })} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition">
                  Initialize Default Availability
                </button>
              </div>
            ) : (
              <AvailabilityEditor availability={availability} onSave={saveAvailability} saving={isSavingAvail} />
            )}
          </div>
        )}

        {/* ═══════════ PATIENTS TAB ═══════════ */}
        {activeTab === "patients" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">All Patients</h2>
              <span className="text-sm text-gray-400">{appointments.length} total records</span>
            </div>
            {appointments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FaUserInjured className="text-5xl mx-auto mb-3 text-gray-200" />
                <p className="font-semibold text-base">No patients yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map(appt => (
                  <div key={appt.id} className="border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition bg-gray-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Avatar */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                          {appt.name?.charAt(0)}
                        </div>
                        {appt.tokenNumber && (
                          <div className="bg-blue-600 text-white px-2 py-1 rounded-lg flex flex-col items-center min-w-[48px]">
                            <span className="text-[8px] font-black leading-none">{appt.tokenNumber}</span>
                          </div>
                        )}
                      </div>
                      {/* Details grid */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Patient Name</p>
                          <p className="font-bold text-gray-800">{appt.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 flex items-center gap-1"><FaPhone className="text-[10px]" /> Phone</p>
                          <p className="text-gray-700 text-sm">{appt.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 flex items-center gap-1"><FaEnvelope className="text-[10px]" /> Email</p>
                          <p className="text-gray-700 text-sm break-all">{appt.email || appt.patientEmail || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Date of Birth</p>
                          <p className="text-gray-700 text-sm">{appt.dob || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 flex items-center gap-1"><FaCalendarAlt className="text-[10px]" /> Appointment</p>
                          <p className="text-gray-700 text-sm">{appt.appointmentDate} at {appt.appointmentTime}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Consultation Fee</p>
                          <p className="text-gray-700 text-sm font-semibold">₹{appt.fees || appt.amount || 0}</p>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 flex items-center gap-1"><FaNotesMedical className="text-[10px]" /> Reason for Visit</p>
                          <p className="text-gray-700 text-sm italic">{appt.reason || "—"}</p>
                        </div>
                      </div>
                      {/* Status + Payment */}
                      <div className="flex flex-col gap-2 items-end">
                        <StatusBadge status={appt.status} />
                        {appt.paymentStatus === "paid" && <PayBadge method={appt.paymentMethod} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ EARNINGS TAB ═══════════ */}
        {activeTab === "earnings" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaRupeeSign className="text-emerald-600" /> Earnings Breakdown
              </h2>
              <div className="flex gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-emerald-600 font-semibold uppercase">Total Earned</p>
                  <p className="text-xl font-bold text-emerald-700">₹{totalEarned.toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-blue-600 font-semibold uppercase">Paid Consults</p>
                  <p className="text-xl font-bold text-blue-700">{paidAppts.length}</p>
                </div>
              </div>
            </div>

            {paidAppts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FaRupeeSign className="text-5xl mx-auto mb-3 text-gray-200" />
                <p className="font-semibold text-base">No earnings yet</p>
                <p className="text-sm mt-1">Earnings appear once patients pay for consultations.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="text-left pb-3 font-semibold">Patient</th>
                      <th className="text-left pb-3 font-semibold">Phone</th>
                      <th className="text-left pb-3 font-semibold">Date</th>
                      <th className="text-left pb-3 font-semibold">Reason</th>
                      <th className="text-left pb-3 font-semibold">Payment Via</th>
                      <th className="text-right pb-3 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paidAppts.slice().reverse().map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 transition">
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">{a.name}</p>
                            {a.tokenNumber && (
                              <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-black border border-blue-200">
                                {a.tokenNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{a.email || a.patientEmail}</p>
                        </td>
                        <td className="py-3.5 text-gray-600">{a.phone || "—"}</td>
                        <td className="py-3.5 text-gray-500">{a.appointmentDate}<br/><span className="text-xs text-gray-400">{a.appointmentTime}</span></td>
                        <td className="py-3.5 text-gray-500 text-xs max-w-[160px]">
                          <span className="line-clamp-2">{a.reason || "—"}</span>
                        </td>
                        <td className="py-3.5"><PayBadge method={a.paymentMethod} /></td>
                        <td className="py-3.5 text-right font-bold text-emerald-700 text-base">₹{Number(a.amount || a.fees || 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={5} className="pt-3 font-bold text-gray-600 text-sm">Total</td>
                      <td className="pt-3 text-right font-bold text-emerald-700 text-lg">₹{totalEarned.toLocaleString("en-IN")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ PROFILE TAB ═══════════ */}
        {activeTab === "profile" && (
          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-lg border border-gray-50">
                   <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl text-blue-600 overflow-hidden border border-blue-100">
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt="profile" className="w-full h-full object-cover" />
                    ) : (
                      <FaUserMd />
                    )}
                   </div>
                   <button 
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => updateProfile({ profilePhoto: ev.target.result });
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-xl border-4 border-white shadow-md hover:scale-110 transition"
                   >
                     <FaCamera className="text-sm" />
                   </button>
                </div>
              </div>
              
              <div className="pt-16 pb-8 px-8 flex justify-between items-end flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    Dr. {user?.name}
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified</span>
                  </h2>
                  <p className="text-gray-500 font-medium">{user?.specialty} • {user?.email}</p>
                </div>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-2xl font-bold text-sm transition">
                    <FaUserEdit /> Edit Professional Details
                  </button>
                )}
              </div>

              <div className="p-8 border-t border-gray-50 bg-gray-50/30">
                {isEditing ? (
                  <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    updateProfile(editForm); 
                    registerPartner({ ...user, ...editForm }); // Sync full profile including email/role
                    setIsEditing(false); 
                  }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Consultation Fees (₹)</label>
                        <input 
                          type="number"
                          value={editForm.fees}
                          onChange={e => setEditForm({...editForm, fees: e.target.value})}
                          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                          placeholder="e.g. 500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Location / Clinic</label>
                        <div className="relative group">
                          <input 
                            type="text"
                            value={editForm.location}
                            onChange={e => setEditForm({...editForm, location: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm pr-14"
                            placeholder="e.g. Life Care Hospital"
                          />
                          <button
                            type="button"
                            onClick={detectAddress}
                            disabled={detecting}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition ${detecting ? "text-blue-400 cursor-wait" : "text-blue-600 hover:bg-blue-50"}`}
                            title="Auto-detect location"
                          >
                            <FaLocationArrow className={detecting ? "animate-pulse" : ""} />
                          </button>
                        </div>
                        {detectErr && <p className="text-[10px] text-red-500 font-bold px-1">{detectErr}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                        <input 
                          type="text"
                          value={editForm.phone}
                          onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 py-4 border-t border-gray-100 mt-2">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <FaVideo className="text-purple-600" /> Online Consultation Settings
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Online Fees (₹)</label>
                          <input 
                            type="number"
                            value={editForm.onlineFees}
                            onChange={e => setEditForm({...editForm, onlineFees: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Online Schedule</label>
                          <input 
                            type="text"
                            value={editForm.onlineTimings}
                            onChange={e => setEditForm({...editForm, onlineTimings: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                            placeholder="e.g. 10:00 AM - 04:00 PM, Mon-Sat"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3 mb-2">
                        <FaUniversity className="text-indigo-600" /> Bank Details (Private)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Bank Name" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3" value={editForm.bankName} onChange={e => setEditForm({...editForm, bankName: e.target.value})} />
                        <input placeholder="IFSC Code" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3" value={editForm.ifsc} onChange={e => setEditForm({...editForm, ifsc: e.target.value})} />
                        <input placeholder="Account Number" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 md:col-span-2" value={editForm.accountNum} onChange={e => setEditForm({...editForm, accountNum: e.target.value})} />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">Save Changes</button>
                      <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                     <div className="group">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <FaClinicMedical className="text-blue-600" /> Physical Visit Fees
                      </p>
                      <p className="text-lg font-black text-gray-800">₹{user?.fees || "0"}</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <FaVideo className="text-purple-600" /> Online Consult Fees
                      </p>
                      <p className="text-lg font-black text-gray-800">₹{user?.onlineFees || "0"}</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-red-500" /> Clinic Location
                      </p>
                      <p className="text-sm font-bold text-gray-700 leading-relaxed">{user?.location || "Not set"}</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <FaClock className="text-orange-500" /> Online Schedule
                      </p>
                      <p className="text-sm font-bold text-gray-700">{user?.onlineTimings || "Not configured"}</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2" title="Contact number from signup">
                        <FaPhoneAlt className="text-green-500" /> Contact Number
                      </p>
                      <p className="text-sm font-bold text-gray-700">{user?.phone || "Not set"}</p>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 bg-white p-6 rounded-3xl border border-blue-50 flex items-center gap-5 shadow-sm">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                         <FaUniversity className="text-xl" />
                       </div>
                       <div>
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Bank Settlement Account</p>
                         <p className="text-sm font-bold text-gray-700 italic">
                           {user?.bankName ? `${user.bankName} (AC: ****${user.accountNum?.slice(-4)})` : "Bank details not configured"}
                         </p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ SUPPORT TAB ═══════════ */}
        {activeTab === "support" && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-3xl shadow-sm border border-red-100">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Partner Support</h2>
                  <p className="text-gray-500 font-medium">Flag issues or request assistance from the admin team.</p>
                </div>
              </div>

              {complaintStatus && (
                <div className="bg-green-50 border border-green-100 text-green-700 p-5 rounded-2xl mb-8 text-sm font-bold flex items-center gap-3 animate-in zoom-in-95">
                  <FaCheckCircle className="text-xl" /> {complaintStatus}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                submitComplaint({ ...complaintForm, userType: "Doctor", name: user?.name });
                setComplaintStatus("Support ticket raised! Admin will respond via notification shortly.");
                setComplaintForm({ ...complaintForm, reason: "" });
                setTimeout(() => setComplaintStatus(""), 5000);
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 px-1">Describe the Issue</label>
                  <textarea 
                    value={complaintForm.reason}
                    onChange={e => setComplaintForm({...complaintForm, reason: e.target.value})}
                    placeholder="e.g. Payment not received for order #123, system bug in appointments, update request, etc."
                    className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-6 py-5 min-h-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 px-1">Reply Email</label>
                  <input 
                    type="email"
                    value={complaintForm.email}
                    onChange={e => setComplaintForm({...complaintForm, email: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner"
                    readOnly
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gray-800 text-white py-5 rounded-3xl font-bold text-lg hover:bg-black transition shadow-2xl shadow-gray-200 flex items-center justify-center gap-3"
                >
                  <FaEnvelope className="text-blue-400" /> Raise Support Ticket
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/* ── Appointment Card with accept/reject ── */
/* ── Appointment Card ── */
const AppointmentCard = ({ appt, onAccept, onReject, onStartCall, onEndCall, onUploadPrescription }) => {
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [prescriptionImage, setPrescriptionImage] = useState("");
  const [savingPrescription, setSavingPrescription] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPrescriptionImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSavePrescription = async () => {
    if (!prescriptionText && !prescriptionImage) return;
    setSavingPrescription(true);
    await onUploadPrescription(appt._id || appt.id, { prescriptionText, prescriptionImage });
    setSavingPrescription(false);
    setShowPrescriptionForm(false);
  };

  return (
    <div className="border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition bg-gray-50/30">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            {appt.name?.charAt(0)}
          </div>
          {appt.tokenNumber && (
            <div className="bg-blue-600 text-white px-2 py-1 rounded-lg flex flex-col items-center min-w-[48px] text-center">
              <span className="text-[8px] font-black leading-none">{appt.tokenNumber}</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-800">{appt.name}</h4>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1
                  ${appt.consultationType === "video" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                  {appt.consultationType === "video" ? <><FaVideo className="text-[8px]" /> Video Call</> : <><FaClinicMedical className="text-[8px]" /> Physical Visit</>}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><FaPhone className="text-[10px]" /> {appt.phone} &nbsp;•&nbsp; <FaEnvelope className="text-[10px]" /> {appt.email}</p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><FaClock className="text-[10px]" /> {appt.appointmentDate} at {appt.appointmentTime}</p>
              {appt.dob && <p className="text-xs text-gray-400 mt-0.5">DOB: {appt.dob}</p>}
              <p className="text-xs text-gray-500 mt-1 italic">"{appt.reason}"</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {appt.paymentStatus === "paid" && (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-bold">
                  ₹{Number(appt.amount || appt.fees || 0).toLocaleString("en-IN")} Paid
                </span>
              )}
              <StatusBadge status={appt.status} />

              {/* Video Call Actions */}
              {appt.status === "accepted" && appt.consultationType === "video" && (
                <div className="flex flex-col items-end gap-2 mt-2">
                  <div className="flex gap-2">
                    {!appt.meetingActive ? (
                      <button onClick={() => onStartCall && onStartCall()} 
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-lg shadow-blue-100 transition">
                        <FaVideo /> Start Call
                      </button>
                    ) : (
                      <>
                        <a href={appt.meetingLink} target="_blank" rel="noreferrer"
                           className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-lg shadow-green-100 transition">
                          <FaVideo /> Re-join Call
                        </a>
                        <button onClick={() => onEndCall && onEndCall()}
                          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-lg shadow-red-100 transition">
                          <FaTimes /> End Call
                        </button>
                      </>
                    )}
                  </div>
                  {!appt.prescriptionText && !appt.prescriptionImage && (
                    <button onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}
                      className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-3 py-2 rounded-xl transition">
                      <FaNotesMedical /> {showPrescriptionForm ? "Cancel" : "Add Prescription"}
                    </button>
                  )}
                  {(appt.prescriptionText || appt.prescriptionImage) && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
                      <FaCheck /> Prescription Added
                    </span>
                  )}
                </div>
              )}
              
              {appt.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <button onClick={onAccept} className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl transition">Accept</button>
                  <button onClick={onReject} className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold px-3 py-2 rounded-xl transition border border-red-100">Reject</button>
                </div>
              )}
            </div>
          </div>

          {/* Prescription Form */}
          {showPrescriptionForm && !appt.prescriptionText && !appt.prescriptionImage && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
              <h5 className="text-xs font-bold text-indigo-800 mb-3 flex items-center gap-2">
                <FaNotesMedical /> Upload or Type Prescription
              </h5>
              <div className="space-y-4">
                <textarea 
                  className="w-full text-sm border border-indigo-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  rows="3"
                  placeholder="Type prescription notes here..."
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                />
                
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-gray-500">OR</span>
                  
                  <div className="flex-1">
                    <label className="flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-50 transition w-max">
                      <FaCamera /> Upload Image
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                    {prescriptionImage && <p className="text-[10px] text-emerald-600 font-bold mt-1 ml-1 flex items-center gap-1"><FaCheck /> Image selected</p>}
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button 
                    onClick={handleSavePrescription}
                    disabled={savingPrescription || (!prescriptionText && !prescriptionImage)}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    {savingPrescription ? "Saving..." : "Save Prescription"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, count, subtitle, color, bg }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl ${bg} ${color}`}>{icon}</div>
    <div>
      <h3 className="text-2xl font-bold text-gray-800">{count}</h3>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

const PendingApprovalScreen = ({ role, onLogout, status }) => {
  const isRejected = status === "rejected";
  
  return (
    <div className={`min-h-screen bg-gradient-to-br flex flex-col items-center justify-center p-6 ${isRejected ? "from-red-50 to-orange-100" : "from-blue-50 to-indigo-100"}`}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${isRejected ? "bg-red-100" : "bg-yellow-100"}`}>
          {isRejected ? <FaTimes className="text-red-500 text-3xl" /> : <FaClock className="text-yellow-500 text-3xl" />}
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isRejected ? "text-red-600" : "text-gray-800"}`}>
          {isRejected ? "Application Rejected" : "Approval Pending"}
        </h2>
        <p className="text-gray-500 mb-1">Your <strong>{role}</strong> account has been registered.</p>
        
        {isRejected ? (
          <>
            <p className="text-gray-500 mb-6">Unfortunately, your profile registry has been <span className="text-red-600 font-semibold">Rejected</span> by the admin team after review.</p>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 font-medium mb-6 text-left">
              📩 Please contact support at <strong>d2dpharma247@gmail.com</strong> if you believe this is a mistake or to request a re-review.
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-500 mb-6">Please wait for the <span className="text-indigo-600 font-semibold">D2D Pharma Admin</span> to review and approve your profile before you can access the dashboard.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800 font-medium mb-6">
              ⏳ Approval usually takes a few hours during working hours.
            </div>
          </>
        )}
        
        <button onClick={onLogout} className="flex items-center gap-2 mx-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition">
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );
};

/* ── Availability Editor ── */
const AvailabilityEditor = ({ availability, onSave, saving }) => {
  const [days, setDays] = useState(availability.availableDays || []);
  const [morning, setMorning] = useState(availability.morning || { start: "09:00", end: "12:00", active: true });
  const [evening, setEvening] = useState(availability.evening || { start: "17:00", end: "20:00", active: true });
  const [types, setTypes] = useState(availability.consultationTypes || ["physical"]);
  const [duration, setDuration] = useState(availability.slotDuration || 30);
  const [capacity, setCapacity] = useState(availability.capacityPerSlot || 5);

  const toggleDay = (day) => setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  const toggleType = (t) => setTypes(prev => prev.includes(t) ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) : [...prev, t]);

  return (
    <div className="space-y-10">
      {/* Days */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
          <FaCalendarAlt className="text-blue-500" /> Working Days
        </h4>
        <div className="flex flex-wrap gap-2.5">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
            <button key={day} onClick={() => toggleDay(day)}
              className={`px-5 py-3 rounded-2xl text-sm font-bold border transition-all hover:scale-105
                ${days.includes(day) ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Morning */}
        <div className={`p-6 rounded-3xl border transition-all ${morning.active ? "bg-amber-50/30 border-amber-100" : "bg-gray-50 border-gray-100 opacity-60"}`}>
          <div className="flex justify-between items-center mb-6">
             <h4 className="font-black text-gray-800 flex items-center gap-2">
               <span className="text-amber-500 text-xl text-yellow-500">☀️</span> Morning Slot
             </h4>
             <button onClick={() => setMorning({...morning, active: !morning.active})} 
               className={`text-xs font-bold px-3 py-1.5 rounded-full transition
                ${morning.active ? "bg-amber-200 text-amber-800" : "bg-gray-200 text-gray-500"}`}>
               {morning.active ? "Active" : "Disabled"}
             </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Start Time</label>
              <input type="time" value={morning.start} onChange={e => setMorning({...morning, start: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none" />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">End Time</label>
              <input type="time" value={morning.end} onChange={e => setMorning({...morning, end: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none" />
            </div>
          </div>
        </div>

        {/* Evening */}
        <div className={`p-6 rounded-3xl border transition-all ${evening.active ? "bg-indigo-50/30 border-indigo-100" : "bg-gray-50 border-gray-100 opacity-60"}`}>
          <div className="flex justify-between items-center mb-6">
             <h4 className="font-black text-gray-800 flex items-center gap-2">
               <span className="text-indigo-500 text-xl font-bold">🌙</span> Evening Slot
             </h4>
             <button onClick={() => setEvening({...evening, active: !evening.active})} 
               className={`text-xs font-bold px-3 py-1.5 rounded-full transition
                ${evening.active ? "bg-indigo-200 text-indigo-800" : "bg-gray-200 text-gray-500"}`}>
               {evening.active ? "Active" : "Disabled"}
             </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Start Time</label>
              <input type="time" value={evening.start} onChange={e => setEvening({...evening, start: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">End Time</label>
              <input type="time" value={evening.end} onChange={e => setEvening({...evening, end: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Slot Duration</h4>
          <div className="flex gap-2">
            {[15, 30, 60].map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition
                  ${duration === d ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}>
                {d === 60 ? "1 hr" : `${d} min`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Consultation Types</h4>
          <div className="flex gap-2">
            {[["physical", "Visit"], ["video", "Video"]].map(([t, lbl]) => (
              <button key={t} onClick={() => toggleType(t)}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition
                  ${types.includes(t) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Capacity / Slot</h4>
          <div className="relative">
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} min="1"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">Patients</span>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-50">
        <button 
          onClick={() => onSave({ availableDays: days, morning, evening, consultationTypes: types, slotDuration: duration, capacityPerSlot: capacity })}
          disabled={saving}
          className={`w-full py-5 rounded-3xl font-black text-white text-lg tracking-wide shadow-2xl transition-all active:scale-95
            ${saving ? "bg-gray-400 cursor-wait" : "bg-gradient-to-r from-blue-600 to-indigo-700 shadow-blue-200 hover:shadow-blue-300"}`}>
          {saving ? "Updating Availability..." : "Save Availability Settings"}
        </button>
      </div>
    </div>
  );
};

/* ── Doctor Calendar ── */
const DoctorCalendar = ({ appointments }) => {
  const [currDate, setCurrDate] = useState(new Date());
  const [selectedDayAppts, setSelectedDayAppts] = useState(null);

  const daysInMonth = new Date(currDate.getFullYear(), currDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currDate.getFullYear(), currDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrDate(new Date(currDate.getFullYear(), currDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrDate(new Date(currDate.getFullYear(), currDate.getMonth() + 1, 1));

  const getDayAppts = (day) => {
    const dateStr = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter(a => a.appointmentDate === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-black text-gray-800">
          {currDate.toLocaleString("default", { month: "long" })} {currDate.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition"><FaChevronLeft className="text-xs" /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition rotate-180"><FaChevronLeft className="text-xs" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="bg-gray-50 py-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
        ))}
        {Array(firstDay).fill(0).map((_, i) => <div key={`p-${i}`} className="bg-white min-h-[80px]" />)}
        {Array(daysInMonth).fill(0).map((_, i) => {
          const day = i + 1;
          const dayAppts = getDayAppts(day);
          const isToday = new Date().toDateString() === new Date(currDate.getFullYear(), currDate.getMonth(), day).toDateString();

          return (
            <div key={day} onClick={() => dayAppts.length > 0 && setSelectedDayAppts({ day, appts: dayAppts })}
              className={`bg-white min-h-[80px] p-2 border-t border-l border-gray-50 transition relative group
                ${dayAppts.length > 0 ? "cursor-pointer hover:bg-blue-50/50" : ""}`}>
              <span className={`text-xs font-bold ${isToday ? "bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full" : "text-gray-400"}`}>
                {day}
              </span>
              {dayAppts.length > 0 && (
                <div className="mt-2 space-y-1">
                  {dayAppts.slice(0, 2).map((a, idx) => (
                    <div key={idx} className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded truncate">
                      {a.name}
                    </div>
                  ))}
                  {dayAppts.length > 2 && <p className="text-[8px] text-gray-400 font-bold ml-1">+{dayAppts.length - 2} more</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDayAppts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-start">
              <div>
                <h4 className="text-xl font-black">Appointments</h4>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mt-1">
                  {selectedDayAppts.day} {currDate.toLocaleString("default", { month: "long" })} {currDate.getFullYear()}
                </p>
              </div>
              <button onClick={() => setSelectedDayAppts(null)} className="p-2 hover:bg-white/20 rounded-full transition"><FaTimes /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {selectedDayAppts.appts.map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                   <div>
                     <p className="font-bold text-gray-800">{a.name}</p>
                     <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5"><FaClock className="text-blue-500" /> {a.appointmentTime}</p>
                   </div>
                   <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;


