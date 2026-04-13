import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../context/AppointmentContext";
import { useNavigate } from "react-router-dom";
import {
  FaUserMd, FaVial, FaPrescriptionBottleAlt, FaUsers,
  FaCheck, FaTimes, FaSignOutAlt, FaFilePdf, FaEye,
  FaClipboardList, FaClock, FaSearch, FaChevronDown, FaChevronUp,
  FaExpand, FaStore, FaUser, FaExclamationTriangle, FaEnvelope, FaCheckCircle,
  FaPhoneAlt, FaMoneyBillWave, FaWallet, FaMotorcycle
} from "react-icons/fa";
import { MdDashboard, MdAdminPanelSettings } from "react-icons/md";

/* ──────────────────────────────────────────────────────────────
   FULLSCREEN LIGHTBOX
────────────────────────────────────────────────────────────── */
const Lightbox = ({ src, label, onClose }) => {
  if (!src) return null;
  const isPdf = src.startsWith("data:application");
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">{label}</span>
        <button onClick={onClose} className="bg-white/15 hover:bg-white/25 text-white w-9 h-9 rounded-full flex items-center justify-center text-lg transition">✕</button>
      </div>
      {isPdf ? (
        <div className="bg-white rounded-xl p-10 text-center" onClick={e => e.stopPropagation()}>
          <FaFilePdf className="text-red-500 text-6xl mx-auto mb-4" />
          <p className="font-bold text-gray-800 mb-4">PDF Document: {label}</p>
          <a href={src} download="document.pdf" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold">⬇ Download PDF</a>
        </div>
      ) : (
        <img src={src} alt={label} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
      )}
    </div>
  );
};

/* ── Clickable photo thumbnail ── */
const Thumb = ({ src, label, onOpen }) => {
  if (!src) return null;
  const isPdf = src.startsWith("data:application");
  return (
    <div className="flex flex-col items-center gap-1">
      <button onClick={() => onOpen(src, label)} title={`View: ${label}`}
        className="relative group rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition w-20 h-20 bg-gray-100 flex-shrink-0">
        {isPdf
          ? <div className="w-full h-full flex flex-col items-center justify-center text-red-500"><FaFilePdf className="text-2xl" /><p className="text-[9px] mt-1 text-gray-600 font-semibold">PDF</p></div>
          : <img src={src} alt={label} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <FaExpand className="text-white text-sm" />
        </div>
      </button>
      <p className="text-[9px] text-gray-500 font-medium text-center max-w-[72px] leading-tight">{label}</p>
    </div>
  );
};

/* ── Section label ── */
const SL = ({ t }) => <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-3 mb-1.5">{t}</p>;
const DI = ({ label, value }) => value ? (
  <div className="flex gap-2 text-sm">
    <span className="text-gray-400 font-medium min-w-[150px] shrink-0">{label}:</span>
    <span className="text-gray-800 font-semibold">{value}</span>
  </div>
) : null;

/* ──────────────────────────────────────────────────────────────
   KYC DETAIL PANELS
────────────────────────────────────────────────────────────── */

/* ── Doctor KYC Panel ── */
const DoctorKYCPanel = ({ p, onApprove, onReject, onRevoke, onOpen }) => (
  <div className="mt-3 border-t border-gray-100 pt-4 space-y-2">
    <div className="flex gap-3 flex-wrap">
      <Thumb src={p.profilePhoto} label="Profile Photo" onOpen={onOpen} />
      <Thumb src={p.idPhoto} label={p.idType === "pan" ? "PAN Card" : "Aadhaar"} onOpen={onOpen} />
      <Thumb src={p.licenseDoc} label="Medical Licence" onOpen={onOpen} />
      <Thumb src={p.regCertDoc} label="Reg. Certificate" onOpen={onOpen} />
      <Thumb src={p.bank?.cancelledCheque} label="Cancelled Cheque" onOpen={onOpen} />
    </div>
    <SL t="Personal" />
    <DI label="Gender" value={p.gender} /> <DI label="DOB" value={p.dob} />
    <DI label="Email" value={p.email} /> <DI label="Phone" value={p.phone} />
    <SL t="Government ID" />
    <DI label="ID Type" value={p.idType === "aadhaar" ? "Aadhaar card" : "PAN Card"} />
    <DI label="ID Number" value={p.idNumber} />
    <SL t="Medical Council" />
    <DI label="Specialty" value={p.specialty} />
    <DI label="Qualification" value={p.qualification} />
    <DI label="Council" value={p.councilName} />
    <DI label="Reg. Number" value={p.regNumber} />
    <DI label="Reg. Year" value={p.regYear} />
    <SL t="Clinic" />
    <DI label="Clinic Name" value={p.clinicName} />
    <DI label="Full Address" value={p.fullAddress || p.location} />
    <DI label="Timings" value={p.consultationTimings} />
    <DI label="Fees" value={p.fees ? `₹${p.fees}` : null} />
    <SL t="Bank Details" />
    <DI label="Account Holder" value={p.bank?.accountHolder} />
    <DI label="Bank Name" value={p.bank?.bankName} />
    <DI label="Account Number" value={p.bank?.accountNumber} />
    <DI label="IFSC Code" value={p.bank?.ifsc} />
    <ActionBtns p={p} onApprove={onApprove} onReject={onReject} onRevoke={onRevoke} />
  </div>
);

/* ── Lab KYC Panel ── */
const LabKYCPanel = ({ p, onApprove, onReject, onRevoke, onOpen }) => (
  <div className="mt-3 border-t border-gray-100 pt-4 space-y-2">
    <div className="flex gap-3 flex-wrap">
      <Thumb src={p.profilePhoto} label="Profile Photo" onOpen={onOpen} />
      <Thumb src={p.idPhoto} label={p.idType === "pan" ? "PAN Card" : "Aadhaar"} onOpen={onOpen} />
      <Thumb src={p.qualCert} label="Qualification Cert" onOpen={onOpen} />
      <Thumb src={p.bank?.cancelledCheque} label="Cancelled Cheque" onOpen={onOpen} />
    </div>
    <SL t="Personal" />
    <DI label="Gender" value={p.gender} /> <DI label="DOB" value={p.dob} />
    <DI label="Email" value={p.email} /> <DI label="Phone" value={p.phone} />
    <SL t="Government ID" />
    <DI label="ID Type" value={p.idType === "aadhaar" ? "Aadhaar Card" : "PAN Card"} />
    <DI label="ID Number" value={p.idNumber} />
    <SL t="Qualification" />
    <DI label="Qualification" value={p.qualification} />
    <DI label="Institute" value={p.institute} />
    <DI label="Year of Passing" value={p.yearOfPassing} />
    <SL t="Lab Details" />
    <DI label="Lab Name" value={p.labName} />
    <DI label="Reg. Number" value={p.labRegNumber} />
    <DI label="Reg. Authority" value={p.regAuthority === "state" ? "State Government" : "Private Body"} />
    <DI label="Full Address" value={p.fullAddress || p.location} />
    <DI label="NABL Accredited" value={p.nablCert === "yes" ? "Yes ✓" : "No"} />
    <DI label="Services" value={p.services} />
    <SL t="Bank Details" />
    <DI label="Account Holder" value={p.bank?.accountHolder} />
    <DI label="Bank Name" value={p.bank?.bankName} />
    <DI label="Account Number" value={p.bank?.accountNumber} />
    <DI label="IFSC Code" value={p.bank?.ifsc} />
    <ActionBtns p={p} onApprove={onApprove} onReject={onReject} onRevoke={onRevoke} />
  </div>
);

/* ── Pharmacy KYC Panel ── */
const PharmacyKYCPanel = ({ p, onApprove, onReject, onRevoke, onOpen }) => (
  <div className="mt-3 border-t border-gray-100 pt-4 space-y-2">
    <div className="flex gap-3 flex-wrap">
      <Thumb src={p.idPhoto} label={p.idType === "pan" ? "PAN Card" : "Aadhaar"} onOpen={onOpen} />
      <Thumb src={p.storePhoto} label="Store Photo" onOpen={onOpen} />
      <Thumb src={p.drugLicCert} label="Drug Licence Cert" onOpen={onOpen} />
      <Thumb src={p.pharmacistCert} label="Pharmacist Cert" onOpen={onOpen} />
      <Thumb src={p.bank?.cancelledCheque} label="Cancelled Cheque" onOpen={onOpen} />
    </div>
    <SL t="Personal & Govt ID" />
    <DI label="Name" value={p.name} /> <DI label="Email" value={p.email} /> <DI label="Phone" value={p.phone} />
    <DI label="ID Type" value={p.idType === "aadhaar" ? "Aadhaar Card" : "PAN Card"} />
    <DI label="ID Number" value={p.idNumber} />
    <SL t="Store Details" />
    <DI label="Store Name" value={p.storeName || p.clinicName} />
    <DI label="Full Address" value={p.fullAddress || p.location} />
    <SL t="Drug Licence" />
    <DI label="Retail Lic. No." value={p.drugLicRetail} />
    <DI label="Wholesale Lic. No." value={p.drugLicWholesale} />
    <DI label="Issuing Authority" value={p.drugLicAuthority} />
    <DI label="Issue Date" value={p.drugLicIssueDate} />
    <DI label="Expiry Date" value={p.drugLicExpiry} />
    <SL t="Pharmacist Registration" />
    <DI label="Pharmacist Name" value={p.pharmacistName} />
    <DI label="State Council" value={p.pharmacyCouncil} />
    <DI label="Reg. Number" value={p.pharmacistRegNum} />
    <DI label="Qualification" value={p.pharmacistQual} />
    <DI label="Store Timings" value={p.storeTimings} />
    <SL t="Bank Details" />
    <DI label="Account Holder" value={p.bank?.accountHolder} />
    <DI label="Bank Name" value={p.bank?.bankName} />
    <DI label="Account Number" value={p.bank?.accountNumber} />
    <DI label="IFSC Code" value={p.bank?.ifsc} />
    <DI label="GST Number" value={p.gstNumber} />
    <ActionBtns p={p} onApprove={onApprove} onReject={onReject} onRevoke={onRevoke} />
  </div>
);

/* ── Approve/Reject/Revoke buttons ── */
const ActionBtns = ({ p, onApprove, onReject, onRevoke }) => (
  <div className="flex gap-2 pt-3 flex-wrap">
    {p.approved !== true && (
      <button onClick={() => onApprove(p.email)}
        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shadow-sm">
        <FaCheck /> Approve & Unlock Dashboard
      </button>
    )}
    {p.approved !== false && (
      <button onClick={() => onReject(p.email)}
        className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition">
        <FaTimes /> Reject
      </button>
    )}
    {p.approved === true && (
      <button onClick={() => onRevoke(p.email)}
        className="flex items-center gap-1.5 border border-red-300 text-red-500 hover:bg-red-50 text-xs px-4 py-2.5 rounded-xl font-bold transition">
        <FaTimes /> Revoke Access
      </button>
    )}
  </div>
);

/* ──────────────────────────────────────────────────────────────
   PARTNER ROW (expandable for all roles)
────────────────────────────────────────────────────────────── */
const StatusBadge = ({ approved }) => {
  if (approved === true) return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✓ Approved</span>;
  if (approved === false) return <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">✗ Rejected</span>;
  return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full flex items-center gap-1"><FaClock className="text-[10px]" /> Pending</span>;
};

const RoleBadge = ({ role }) => {
  const map = {
    doctor:   { cls: "bg-blue-100 text-blue-700",   icon: <FaUserMd />,                label: "Doctor" },
    lab:      { cls: "bg-cyan-100 text-cyan-700",    icon: <FaVial />,                  label: "Lab" },
    pharmacy: { cls: "bg-green-100 text-green-700",  icon: <FaPrescriptionBottleAlt />, label: "Pharmacy" },
    user:     { cls: "bg-gray-100 text-gray-600",    icon: <FaUsers />,                 label: "User" },
  };
  const c = map[role] || map.user;
  return <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${c.cls}`}>{c.icon}{c.label}</span>;
};

const PartnerRow = ({ partner: p, onApprove, onReject, onRevoke, onOpen }) => {
  const [expanded, setExpanded] = useState(false);

  const renderPanel = () => {
    if (p.role === "doctor")   return <DoctorKYCPanel p={p} onApprove={onApprove} onReject={onReject} onRevoke={onRevoke} onOpen={onOpen} />;
    if (p.role === "lab")      return <LabKYCPanel p={p} onApprove={onApprove} onReject={onReject} onRevoke={onRevoke} onOpen={onOpen} />;
    if (p.role === "pharmacy") return <PharmacyKYCPanel p={p} onApprove={onApprove} onReject={onReject} onRevoke={onRevoke} onOpen={onOpen} />;
    return null;
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden hover:border-indigo-100 transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-indigo-100 flex-shrink-0">
            {p.profilePhoto
              ? <img src={p.profilePhoto} alt={p.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-indigo-700 font-bold text-sm">{p.name?.charAt(0) || "?"}</div>}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-800 text-sm">{p.name}</p>
              <RoleBadge role={p.role} />
              <StatusBadge approved={p.approved} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{p.email}{p.phone ? ` · ${p.phone}` : ""}</p>
            <p className="text-xs text-gray-500 mt-0.5">🏥 {p.clinicName || p.labName || p.storeName || "—"} {p.location ? `· 📍 ${p.location}` : ""}</p>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg font-semibold transition flex-shrink-0">
          <FaEye /> {expanded ? "Hide KYC" : "View KYC"}
          {expanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
        </button>
      </div>
      {expanded && <div className="px-4 pb-5">{renderPanel()}</div>}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   SIDEBAR
────────────────────────────────────────────────────────────── */
const SidebarItem = ({ icon, label, active, onClick, badge }) => (
  <div onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all group
      ${active ? "bg-white/15 text-white" : "text-indigo-100 hover:bg-indigo-500 hover:text-white"}`}>
    <span className="text-lg flex-shrink-0">{icon}</span>
    <span className="font-medium flex-1">{label}</span>
    {badge > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
  </div>
);

const StatCard = ({ icon, label, count, color, bg }) => (
  <div className={`${bg} border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition`}>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color} bg-white shadow-sm`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{count}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   MAIN ADMIN DASHBOARD
────────────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const { 
    user, logout, approvePartner, rejectPartner, getAllUsers, getAllPartners,
    callbackRequests, updateCallbackStatus 
  } = useAuth();
  const { complaints, fetchAllComplaints, updateComplaintStatus, sendNotification } = useAppointment();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [lightbox, setLightbox] = useState(null);

  // ── Async Data State ──
  const [allUsers, setAllUsers] = useState([]);
  const [allPartners, setAllPartners] = useState([]);
  const [deliveryStats, setDeliveryStats] = useState({ totalRevenue: 0, totalPayout: 0, totalKM: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      const [usersData, partnersData, distStatsRes] = await Promise.all([
        getAllUsers(),
        getAllPartners(),
        fetch(`${apiUrl}/orders/admin/delivery-stats`)
          .then(async r => {
             if (!r.ok) return { success: false, data: { totalRevenue:0, totalPayout:0, totalKM:0 } };
             return r.json().catch(() => ({ success: false }));
          }),
        fetchAllComplaints()
      ]);
      setAllUsers(Array.isArray(usersData) ? usersData : []);
      setAllPartners(Array.isArray(partnersData) ? partnersData : []);
      if (distStatsRes && distStatsRes.success) {
        setDeliveryStats(distStatsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openLightbox = (src, label) => setLightbox({ src, label });

  const partners         = allPartners.filter(p => p.role !== "user");
  const pendingPartners  = partners.filter(p => p.approved !== true && p.approved !== false);
  const approvedPartners = partners.filter(p => p.approved === true);
  const regularUsers     = allUsers.filter(u => u.role === "user");

  const handleApprove = async (email) => { 
    const success = await approvePartner(email, allPartners.find(p=>p.email===email)?.role); 
    if(success) fetchData(); 
  };
  const handleReject  = async (email) => { 
    const success = await rejectPartner(email, allPartners.find(p=>p.email===email)?.role); 
    if(success) fetchData(); 
  };
  const handleLogout  = () => { logout(); navigate("/login"); };

  const filteredPartners = partners.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      (p.clinicName || p.labName || p.storeName)?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || p.role === filterRole;
    return matchSearch && matchRole;
  });

  const filteredUsers = regularUsers.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {lightbox && <Lightbox src={lightbox.src} label={lightbox.label} onClose={() => setLightbox(null)} />}

      {/* SIDEBAR */}
      <aside className="w-64 bg-indigo-700 text-white flex flex-col fixed h-full shadow-xl z-20">
        <div className="px-6 py-6 border-b border-indigo-600/50 flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-indigo-700">
            <MdAdminPanelSettings className="text-xl" />
          </div>
          <div>
            <p className="text-base font-bold leading-tight">Admin Panel</p>
            <p className="text-indigo-300 text-xs">D2D Pharma</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <SidebarItem icon={<MdDashboard />}             label="Overview"   active={activeTab==="overview"}  onClick={() => setActiveTab("overview")} />
          <SidebarItem icon={<FaClipboardList />}         label="All Partners" active={activeTab==="partners" && filterRole==="all"} onClick={() => { setActiveTab("partners"); setFilterRole("all"); }} badge={pendingPartners.length} />
          <SidebarItem icon={<FaUsers />}                 label="Users"      active={activeTab==="users"}     onClick={() => setActiveTab("users")} />
          <SidebarItem icon={<FaUserMd />}                label="Doctors"    active={activeTab==="partners" && filterRole==="doctor"} onClick={() => { setActiveTab("partners"); setFilterRole("doctor"); }} />
          <SidebarItem icon={<FaVial />}                  label="Labs"       active={activeTab==="partners" && filterRole==="lab"} onClick={() => { setActiveTab("partners"); setFilterRole("lab"); }} />
          <SidebarItem icon={<FaPrescriptionBottleAlt />} label="Pharmacies" active={activeTab==="partners" && filterRole==="pharmacy"} onClick={() => { setActiveTab("partners"); setFilterRole("pharmacy"); }} />
          <SidebarItem icon={<FaExclamationTriangle />}   label="Complaints" active={activeTab==="complaints"} onClick={() => setActiveTab("complaints")} badge={complaints?.filter(c => c.status === "pending").length} />
          <SidebarItem icon={<FaPhoneAlt />}              label="Callbacks"  active={activeTab==="callbacks"}   onClick={() => setActiveTab("callbacks")} badge={callbackRequests?.filter(r => r.status === "pending").length} />
        </nav>
        <div className="p-4 border-t border-indigo-600/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-sm">A</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || "Admin"}</p>
              <p className="text-indigo-300 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-500/90 transition text-sm font-medium">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MdAdminPanelSettings className="text-indigo-600 text-3xl" /> Admin Control Panel
          </h1>
          <p className="text-gray-500 mt-1">Verify KYC documents, approve partners, manage users.</p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-indigo-500">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="font-semibold">Loading Admin Data...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <StatCard icon={<FaUsers />}        label="Total Users"       count={regularUsers.length}     color="text-gray-600"   bg="bg-white" />
              <StatCard icon={<FaClipboardList />} label="Total Partners"   count={partners.length}         color="text-indigo-600" bg="bg-white" />
              <StatCard icon={<FaMoneyBillWave />} label="Delivery Revenue" count={`₹${deliveryStats.totalRevenue}`} color="text-green-600" bg="bg-green-50" />
              <StatCard icon={<FaWallet />}        label="Rider Payouts"    count={`₹${deliveryStats.totalPayout}`} color="text-orange-600" bg="bg-orange-50" />
              <StatCard icon={<FaMotorcycle />}    label="Total Distance"   count={`${deliveryStats.totalKM} KM`} color="text-blue-600" bg="bg-blue-50" />
            </div>

            {pendingPartners.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
                <h2 className="text-base font-bold text-yellow-800 mb-4 flex items-center gap-2">
                  <FaClock /> {pendingPartners.length} Partner(s) Awaiting KYC Verification
                </h2>
                <div className="space-y-3">
                  {pendingPartners.map(p => (
                    <PartnerRow key={p.email} partner={p} onApprove={handleApprove} onReject={handleReject} onRevoke={handleReject} onOpen={openLightbox} />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4">Partners Summary</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 rounded-xl py-4">
                  <p className="text-2xl font-bold text-blue-700">{partners.filter(p=>p.role==="doctor").length}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">Doctors</p>
                </div>
                <div className="bg-cyan-50 rounded-xl py-4">
                  <p className="text-2xl font-bold text-cyan-700">{partners.filter(p=>p.role==="lab").length}</p>
                  <p className="text-xs text-cyan-600 font-medium mt-1">Labs</p>
                </div>
                <div className="bg-green-50 rounded-xl py-4">
                  <p className="text-2xl font-bold text-green-700">{partners.filter(p=>p.role==="pharmacy").length}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">Pharmacies</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PARTNERS */}
        {activeTab === "partners" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-800">Partner KYC Verification</h2>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input placeholder="Search name / email..." value={search} onChange={e => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-48" />
                </div>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                  className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="all">All Roles</option>
                  <option value="doctor">Doctor</option>
                  <option value="lab">Lab</option>
                  <option value="pharmacy">Pharmacy</option>
                </select>
              </div>
            </div>
            {filteredPartners.length === 0
              ? <div className="text-center py-12 text-gray-400"><FaClipboardList className="text-4xl mx-auto mb-3 text-gray-200" /><p>No partners found.</p></div>
              : <div className="space-y-3">{filteredPartners.map(p => <PartnerRow key={p.email} partner={p} onApprove={handleApprove} onReject={handleReject} onRevoke={handleReject} onOpen={openLightbox} />)}</div>
            }
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Registered Users</h2>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            {filteredUsers.length === 0
              ? <div className="text-center py-12 text-gray-400"><FaUsers className="text-4xl mx-auto mb-3 text-gray-200" /><p>No users registered yet.</p></div>
              : <div className="space-y-2">
                  {filteredUsers.map((u, i) => (
                    <div key={u.email || i} className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 hover:border-indigo-100 bg-gray-50/50 transition">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                        {u.name?.charAt(0) || u.email?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{u.name || "—"}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <p className="text-xs text-gray-400 hidden sm:block">{u.phone || "—"}</p>
                      <RoleBadge role={u.role} />
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* CALLBACK REQUESTS */}
        {activeTab === "callbacks" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2">
            <header className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FaPhoneAlt className="text-blue-600" /> Callback Requests
                </h2>
                <p className="text-xs text-gray-500 mt-1">Users waiting for a call from your team.</p>
              </div>
            </header>

            {callbackRequests?.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FaPhoneAlt className="text-4xl mx-auto mb-3 text-gray-200" />
                <p>No callback requests yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...callbackRequests].reverse().map(req => (
                  <div key={req._id || req.id} className={`p-4 rounded-2xl border transition-all ${req.status === "pending" ? "bg-blue-50/30 border-blue-100 shadow-sm" : "bg-gray-50/50 border-gray-100"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-blue-600 shadow-sm">
                          <FaPhoneAlt />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-lg">{req.phone}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {new Date(req.requestedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === "pending" ? "bg-blue-600 text-white" : "bg-green-100 text-green-700"}`}>
                        {req.status === "pending" ? "Pending" : "Notified"}
                      </span>
                    </div>

                    {req.status === "pending" ? (
                      <button 
                        onClick={() => {
                          const msg = "You will get a call by our team advisor soon.";
                          updateCallbackStatus(req._id || req.id, "called");
                          sendNotification(req.email || "anonymous", msg);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2.5 rounded-xl font-bold transition shadow-sm"
                      >
                        <FaEnvelope /> Notify User & Mark Done
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-[11px] text-green-600 font-bold bg-green-50 p-2 rounded-lg">
                        <FaCheckCircle /> Notification sent to user
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* COMPLAINTS */}
        {activeTab === "complaints" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2">
            <header className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaExclamationTriangle className="text-red-500" /> User Complaints
              </h2>
              <p className="text-xs text-gray-500 mt-1">Review and respond to issues reported by users.</p>
            </header>

            {(complaints || []).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FaExclamationTriangle className="text-4xl mx-auto mb-3 text-gray-200" />
                <p>No complaints filed yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...(complaints || [])].reverse().map(c => (
                  <div key={c._id || c.id} className={`p-5 rounded-2xl border transition-all ${c.status === "pending" ? "bg-red-50/30 border-red-100 shadow-sm" : "bg-gray-50/50 border-gray-100"}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 font-bold">
                              {c.name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{c.name || "User"}</p>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded">
                                {c.userType || "User"}
                              </p>
                              <p className="text-xs text-gray-400">{c.email}</p>
                            </div>
                          </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.status === "pending" ? "bg-red-600 text-white" : "bg-green-100 text-green-700"}`}>
                          {c.status === "pending" ? "New Complaint" : "Processed"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-gray-100 mb-4 text-sm text-gray-700 leading-relaxed italic">
                      "{c.reason}"
                    </div>

                    {c.status === "pending" && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateComplaintStatus(c._id || c.id, { status: "read" })}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition shadow-sm"
                        >
                          <FaCheck /> Mark as Read & Notify User
                        </button>
                        <button 
                          onClick={() => {
                            const reply = prompt("Enter a custom reply to the user (optional):");
                            if (reply !== null) {
                              updateComplaintStatus(c._id || c.id, { status: "read", adminReply: reply });
                            }
                          }}
                          className="flex items-center gap-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs px-4 py-2 rounded-lg font-bold transition"
                        >
                          <FaEnvelope /> Custom Reply
                        </button>
                      </div>
                    )}

                    {c.status === "read" && (
                      <div className="text-[11px] text-gray-400 font-bold flex items-center gap-1.5 px-1">
                        <FaCheckCircle className="text-green-500" /> Action has been taken on this complaint.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
