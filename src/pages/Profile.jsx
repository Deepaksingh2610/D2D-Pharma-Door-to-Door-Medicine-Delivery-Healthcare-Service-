import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../context/AppointmentContext";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaUserMd, FaBell, FaFilePdf, FaDownload, FaVial, FaFlask, FaTruck, FaBoxOpen,
  FaUserEdit, FaPhoneAlt, FaEnvelope, FaExclamationTriangle, FaCamera, FaChevronRight, FaHeadset, FaShoppingBag, FaStore, FaNotesMedical, FaImage
} from "react-icons/fa";

const STATUS_CONFIG = {
  pending:          { label: "Pending",         color: "bg-yellow-100 text-yellow-700",  icon: <FaClock /> },
  placed:           { label: "Order Placed",    color: "bg-blue-100 text-blue-700",      icon: <FaClock /> },
  accepted:         { label: "Confirmed",       color: "bg-green-100 text-green-700",    icon: <FaCheckCircle /> },
  confirmed:        { label: "Confirmed",       color: "bg-green-100 text-green-700",    icon: <FaCheckCircle /> },
  dispatched:       { label: "Dispatched",      color: "bg-orange-100 text-orange-700",  icon: <FaTruck /> },
  out_for_delivery: { label: "Out for Delivery",color: "bg-orange-100 text-orange-600",  icon: <FaTruck /> },
  delivered:        { label: "Delivered",       color: "bg-emerald-100 text-emerald-700",icon: <FaCheckCircle /> },
  rejected:         { label: "Rejected",        color: "bg-red-100 text-red-600",         icon: <FaTimesCircle /> },
  cancelled:        { label: "Cancelled",       color: "bg-red-100 text-red-600",         icon: <FaTimesCircle /> },
};

const downloadFile = (fileData, fileName) => {
  const a = document.createElement("a");
  a.href = fileData;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const {
    getUserAppointments,
    getNotificationsByUser, markNotificationRead, markAllNotificationsRead,
    getReportByAppointment, submitComplaint,
    orders, fetchPatientOrders
  } = useAppointment();

  const [activeTab, setActiveTab] = useState("profile"); // profile, notifications, appointments, orders, contact, complaints
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    profilePhoto: user?.profilePhoto || ""
  });
  const [complaintForm, setComplaintForm] = useState({ reason: "", email: user?.email || "" });
  const [complaintStatus, setComplaintStatus] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.email) fetchPatientOrders(user.email);
  }, [user?.email]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-sm w-full">
          <FaUserMd className="text-5xl text-blue-200 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Please login first</h2>
          <p className="text-gray-500 mt-2">You need to login to view and manage your profile</p>
          <Link to="/login" className="mt-6 block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const appointments = getUserAppointments(user.email);
  const doctorAppts = appointments.filter(a => a.partnerRole === "doctor");
  const labAppts = appointments.filter(a => a.partnerRole === "lab");
  
  // Use new Orders model for medicine
  const medicineOrders = orders.filter(o => o.patientEmail === user.email);
  
  const notifications = getNotificationsByUser(user.email);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    submitComplaint({ ...complaintForm, name: user?.name });
    setComplaintStatus("Complaint submitted successfully! Admin will notify you soon.");
    setComplaintForm({ reason: "", email: user.email });
    setTimeout(() => setComplaintStatus(null), 5000);
  };

  const tabs = [
    { id: "profile", label: "Profile Info", icon: <FaUserEdit /> },
    { id: "notifications", label: "Notifications", icon: <FaBell />, badge: unreadCount },
    { id: "appointments", label: "Appointments", icon: <FaCalendarAlt /> },
    { id: "orders", label: "Medicine Orders", icon: <FaShoppingBag /> },
    { id: "contact", label: "Contact Us", icon: <FaHeadset /> },
    { id: "complaints", label: "Raise Complaint", icon: <FaExclamationTriangle /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-72 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
            <div className="p-6 border-b border-gray-50 bg-blue-600 text-white">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-full border-2 border-white/50 overflow-hidden bg-white/10 flex items-center justify-center text-2xl font-bold shadow-lg">
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0) || user.email?.charAt(0)
                    )}
                  </div>
                  {activeTab === "profile" && isEditing && (
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white hover:bg-blue-600 transition"
                    >
                      <FaCamera className="text-xs" />
                    </button>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-lg truncate">{user.name || "User"}</h2>
                  <p className="text-blue-100 text-xs truncate">{user.email}</p>
                </div>
              </div>
            </div>
            
            <nav className="p-2 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setIsEditing(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group
                    ${activeTab === tab.id 
                      ? "bg-blue-50 text-blue-600" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                >
                  <span className={`text-lg ${activeTab === tab.id ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>
                    {tab.icon}
                  </span>
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                  <FaChevronRight className={`text-[10px] transition-transform ${activeTab === tab.id ? "translate-x-0" : "-translate-x-2 opacity-0"}`} />
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          
          {/* ── PROFILE INFO ── */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                  <p className="text-gray-500 text-sm mt-1">Manage your account details and settings</p>
                </div>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Full Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Phone Number</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                      Save Changes
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setIsEditing(false); setFormData({ name: user.name, phone: user.phone, profilePhoto: user.profilePhoto }); }}
                      className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</p>
                    <p className="text-lg font-bold text-gray-800">{user.name || "Not set"}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-lg font-bold text-gray-800 truncate">{user.email}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</p>
                    <p className="text-lg font-bold text-gray-800">{user.phone || "Not set"}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Role</p>
                    <p className="text-lg font-bold text-blue-600 capitalize">{user.role || "User"}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
                  <p className="text-gray-500 text-sm mt-1">Stay updated with your appointments and orders</p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllNotificationsRead(user.email)}
                    className="text-blue-600 text-sm font-bold hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  <FaBell className="text-5xl text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">No notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...notifications].reverse().map(notif => (
                    <div key={notif._id || notif.id}
                      onClick={() => !notif.read && markNotificationRead(notif._id || notif.id)}
                      className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer
                        ${notif.read ? "bg-white border-gray-50" : "bg-blue-50/50 border-blue-100 hover:border-blue-200"}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg shadow-sm
                        ${
                          notif.type === "report_ready" ? "bg-purple-100 text-purple-600"
                          : notif.type === "order_dispatched" ? "bg-orange-100 text-orange-600"
                          : notif.type === "order_accepted" ? "bg-green-100 text-green-700"
                          : notif.type === "complaint_update" ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                        }`}>
                        {notif.type === "report_ready" ? <FaFilePdf />
                          : notif.type === "order_dispatched" ? <FaTruck />
                          : notif.type === "order_accepted" ? <FaBoxOpen />
                          : notif.type === "complaint_update" ? <FaExclamationTriangle />
                          : <FaVial />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={`text-sm leading-snug ${!notif.read ? "font-bold text-gray-800" : "text-gray-600"}`}>
                            {notif.message}
                          </p>
                          {!notif.read && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 shadow-sm shadow-blue-200" />}
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium">{new Date(notif.createdAt).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── APPOINTMENTS ── */}
          {activeTab === "appointments" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              
              {/* Doctor Appointments Sub-section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaUserMd className="text-blue-500" /> Doctor Appointments
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold">{doctorAppts.length} total</span>
                </div>

                {doctorAppts.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 text-sm font-medium">No doctor appointments yet.</p>
                    <Link to="/doctors" className="inline-block mt-4 bg-white text-blue-600 border border-blue-100 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition">
                      Find a Doctor →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {doctorAppts.map(appt => <ApptCard key={appt._id || appt.id} appt={appt} />)}
                  </div>
                )}
              </div>

              {/* Lab Tests Sub-section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaFlask className="text-cyan-500" /> Lab Tests
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold">{labAppts.length} total</span>
                </div>

                {labAppts.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 text-sm font-medium">No lab tests booked yet.</p>
                    <Link to="/lab-tests" className="inline-block mt-4 bg-white text-cyan-600 border border-cyan-100 px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-50 transition">
                      Book a Lab Test →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {labAppts.map(appt => <ApptCard key={appt._id || appt.id} appt={appt} isLab />)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MEDICINE ORDERS ── */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <FaShoppingBag className="text-green-500" /> My Medicine Orders
                </h2>
                <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold">{medicineOrders.length} orders</span>
              </div>

              {medicineOrders.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  <FaBoxOpen className="text-5xl text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">No medicine orders yet.</p>
                  <Link to="/medical-stores" className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                    Shop Medicines
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {medicineOrders.map(order => (
                    <div key={order._id || order.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:border-green-100 transition shadow-sm">
                      <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex flex-wrap justify-between gap-3 items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-gray-50">
                            <FaStore />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{order.storeName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Order #{order._id || order.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${STATUS_CONFIG[order.status]?.color || "bg-gray-100"}`}>
                             {STATUS_CONFIG[order.status]?.label || "Pending"}
                           </span>
                           {order.dispatched && (
                             <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                               <FaTruck className="text-xs" /> Dispatched
                             </span>
                           )}
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ordered Items</p>
                            <div className="space-y-2">
                              {order.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 font-medium">{item.name} × {item.quantity}</span>
                                  <span className="text-gray-800 font-bold">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-gray-800 font-bold">Total Paid</span>
                                <span className="text-lg font-bold text-green-600">₹{order.totalAmount || order.total}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Context</p>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs text-gray-600">
                              <p>📅 <span className="font-bold text-gray-800">Date:</span> {new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                              <p>📍 <span className="font-bold text-gray-800">Address:</span> {order.deliveryAddress}</p>
                              <p>📞 <span className="font-bold text-gray-800">Phone:</span> {order.customerPhone}</p>
                            </div>
                            
                            {/* Rider tracking section */}
                            {order.riderName && (
                              <div className="mt-3 bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs space-y-2">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest pointer-events-none mb-1">Rider Details</p>
                                <p className="flex items-center gap-2 font-bold text-gray-800"><FaTruck className="text-blue-500" /> {order.riderName}</p>
                                <p className="flex items-center gap-2 font-bold text-gray-800"><FaPhoneAlt className="text-green-500" /> {order.riderPhone}</p>
                                
                                {order.status === "out_for_delivery" && order.deliveryOTP && (
                                  <div className="mt-3 pt-3 border-t border-blue-200/50 flex items-center justify-between">
                                    <span className="font-bold text-blue-800">Delivery OTP:</span>
                                    <span className="bg-white text-blue-700 font-black tracking-widest px-3 py-1.5 rounded-lg border border-blue-200 text-sm shadow-sm">{order.deliveryOTP}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CONTACT US ── */}
          {activeTab === "contact" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-center max-w-md mx-auto py-10">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm border border-blue-100">
                  <FaHeadset />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Support & Assistance</h2>
                <p className="text-gray-500 mt-2">Need help? Our dedicated support team is available 24/7 to assist you.</p>
                
                <div className="mt-10 space-y-4">
                  <a href="tel:+918739055270" className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition group">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition">
                      <FaPhoneAlt />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Call us at</p>
                      <p className="text-lg font-bold text-gray-800">(+91) 8739055270</p>
                    </div>
                  </a>
                  <a href="mailto:d2dpharma247@gmail.com" className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition group">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-cyan-600 group-hover:scale-110 transition">
                      <FaEnvelope />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">Email us at</p>
                      <p className="text-lg font-bold text-gray-800 truncate">d2dpharma247@gmail.com</p>
                    </div>
                  </a>
                </div>
                
                <p className="text-xs text-gray-400 mt-10 italic">
                  Address: D2D Pharma HQ, Gomti Nagar, Lucknow, Uttar Pradesh 226010
                </p>
              </div>
            </div>
          )}

          {/* ── COMPLAINTS ── */}
          {activeTab === "complaints" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-red-100">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Raise a Complaint</h2>
                  <p className="text-gray-500 text-sm">We take your concerns seriously. Tell us what went wrong.</p>
                </div>
              </div>

              {complaintStatus && (
                <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 animate-in zoom-in-95">
                  <FaCheckCircle className="text-lg" /> {complaintStatus}
                </div>
              )}

              <form onSubmit={handleComplaintSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Topic / Concern</label>
                  <textarea 
                    value={complaintForm.reason}
                    onChange={e => setComplaintForm({...complaintForm, reason: e.target.value})}
                    placeholder="Describe your issue in detail (e.g., medicine not delivered, rude behavior, wrong report, etc.)"
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 min-h-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Contact Email (for updates)</label>
                  <input 
                    type="email"
                    value={complaintForm.email}
                    onChange={e => setComplaintForm({...complaintForm, email: e.target.value})}
                    placeholder="yourname@example.com"
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200"
                >
                  Submit Complaint
                </button>
              </form>
              
              <div className="mt-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="font-bold text-gray-700 block mb-1">What happens next?</span>
                  Once you submit a complaint, our admin team will review it. You will receive a notification in your profile dashboard as soon as the complaint is read and processed. Usually, action is taken within 24 hours.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

/* ── REUSABLE APPOINTMENT CARD ── */
const ApptCard = ({ appt, isLab = false }) => {
  const { getReportByAppointment } = useAppointment();
  const config = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
  const report = isLab && appt.status === "accepted" ? getReportByAppointment(appt._id || appt.id) : null;
  const isInstant = appt.appointmentTime === "ASAP";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-100 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-gray-800 truncate">
              {appt.doctorName || appt.labName || appt.storeName || "Appointment"}
            </h4>
            {isInstant && (
              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5">
                ⚡ Instant
              </span>
            )}
          </div>
          <p className="text-xs text-blue-600 font-bold mb-3">{appt.specialty || appt.clinicName || appt.reason || ""}</p>
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <FaCalendarAlt className="text-gray-300 w-3" />
              <span>{appt.appointmentDate} at {appt.appointmentTime}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <FaTruck className="text-gray-300 w-3" />
              <span className="truncate">{appt.location || appt.deliveryAddress || "Home Service"}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {appt.tokenNumber && (
            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm flex items-center justify-center">
              <span className="text-xs font-black tracking-wide">{appt.tokenNumber}</span>
            </div>
          )}
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm ${config.color}`}>
            {config.icon} {config.label}
          </span>
        </div>
      </div>

      {appt.meetingActive && (
        <div className="mt-4 p-4 bg-blue-600 rounded-2xl flex items-center justify-between gap-4 animate-pulse shadow-lg shadow-blue-100">
          <div className="flex items-center gap-3 text-white">
            <FaVideo className="text-xl" />
            <div>
              <p className="text-sm font-bold">Video Call is LIVE</p>
              <p className="text-[10px] text-blue-100">Your doctor is waiting for you</p>
            </div>
          </div>
          <a href={appt.meetingLink} target="_blank" rel="noreferrer"
             className="bg-white text-blue-600 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-50 transition shadow-sm">
             Join Meeting
          </a>
        </div>
      )}

      {isLab && appt.status === "accepted" && (
        <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
          {appt.sampleCollected ? (
            <div className="flex items-center gap-3 text-[11px] font-bold text-blue-700 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
              <FaVial className="text-lg" />
              <span>Sample Collected — Result will be uploaded soon.</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[11px] font-bold text-yellow-700 bg-yellow-50 px-4 py-3 rounded-xl border border-yellow-100">
              <FaClock className="text-lg" />
              <span>Patient Awaiting Collection.</span>
            </div>
          )}

          {report && (
            <div className="flex items-center justify-between gap-4 bg-purple-50 border border-purple-100 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <FaFilePdf className="text-red-500 text-2xl" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-purple-700">Lab Report Ready</p>
                  <p className="text-[10px] text-purple-400 truncate max-w-[150px]">{report.fileName}</p>
                </div>
              </div>
              <button 
                onClick={() => downloadFile(report.fileData, report.fileName)}
                className="bg-white text-purple-600 p-2.5 rounded-xl shadow-sm border border-purple-100 hover:bg-purple-600 hover:text-white transition"
              >
                <FaDownload />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prescription section */}
      {(appt.prescriptionText || appt.prescriptionImage) && (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
          <h5 className="text-xs font-bold text-indigo-800 flex items-center gap-2">
            <FaNotesMedical /> Doctor's Prescription
          </h5>
          
          {appt.prescriptionText && (
            <div className="bg-white p-3 rounded-lg border border-indigo-50 text-sm text-gray-700 whitespace-pre-wrap shadow-sm">
              {appt.prescriptionText}
            </div>
          )}
          
          {appt.prescriptionImage && (
            <div className="mt-3">
              <a 
                href={appt.prescriptionImage} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white border border-indigo-200 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition shadow-sm"
              >
                <FaImage /> View Attached Prescription
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
