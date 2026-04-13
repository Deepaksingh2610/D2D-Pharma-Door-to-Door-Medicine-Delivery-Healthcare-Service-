import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../context/AppointmentContext";
import { useNavigate } from "react-router-dom";
import { FaMotorcycle, FaMapMarkerAlt, FaPhoneAlt, FaCheckCircle, FaBoxOpen, FaUser, FaClock, FaChartLine, FaExclamationTriangle, FaCog, FaWallet, FaSignOutAlt, FaMap, FaBolt } from "react-icons/fa";
import toast from "react-hot-toast";
import MapTracker from "../components/MapTracker";

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { fetchAvailableRiderOrders, fetchMyDeliveries, acceptDelivery, completeDelivery, submitComplaint } = useAppointment();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'available', 'mydeliveries', 'complaints', 'settings'
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpInputs, setOtpInputs] = useState({});
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);
  const [earningsData, setEarningsData] = useState({ totalKM: 0, totalEarnings: 0, todayEarnings: 0, completedOrders: 0, history: [] });

  // Form states
  const [complaintText, setComplaintText] = useState("");
  const [complaintSubject, setComplaintSubject] = useState("");
  
  const [profileData, setProfileData] = useState({ name: user?.name || "", phone: user?.phone || "", vehicle: "Bike" });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === "available" || activeTab === "overview") {
      const orders = await fetchAvailableRiderOrders();
      setAvailableOrders(orders || []);
    }
    if ((activeTab === "mydeliveries" || activeTab === "overview") && user?.email) {
      const deliveries = await fetchMyDeliveries(user.email);
      setMyDeliveries(deliveries || []);
      fetchEarnings();
    }
    setLoading(false);
  };

  const fetchEarnings = async () => {
    if (!user?.email) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiUrl}/riders/earnings/${user.email}`);
      const json = await res.json();
      if (json.success) setEarningsData(json.data);
    } catch (err) { console.error("Earnings fetch error:", err); }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await acceptDelivery(orderId, {
        riderEmail: user.email,
        riderName: user.name,
        riderPhone: user.phone
      });
      toast.success("Order accepted successfully! Check 'My Deliveries'.");
      setAvailableOrders(prev => prev.filter(o => o._id !== orderId && o.id !== orderId));
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to accept order");
    }
  };

  const handleCompleteDelivery = async (orderId) => {
    const otp = otpInputs[orderId];
    if (!otp || otp.length !== 4) {
      return toast.error("Please enter a valid 4-digit OTP");
    }
    try {
      await completeDelivery(orderId, otp);
      toast.success("Delivery completed successfully!");
      loadData(); 
    } catch (err) {
      toast.error(err.message || "Invalid OTP or failed to complete delivery");
    }
  };

  const submitComplaintHandler = async (e) => {
    e.preventDefault();
    if (!complaintSubject || !complaintText) return toast.error("Please fill all details");
    try {
      await submitComplaint({
        email: user?.email,
        reason: `${complaintSubject}: ${complaintText}`,
        userType: "Rider",
        name: user?.name
      });
      toast.success("Complaint raised successfully");
      setComplaintSubject("");
      setComplaintText("");
    } catch (err) {
      toast.error("Failed to submit complaint");
    }
  };

  const saveProfileHandler = (e) => {
    e.preventDefault();
    toast.success("Profile updated successfully");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Derive Statistics
  const deliveredOrders = myDeliveries.filter(m => m.status === 'delivered');
  const activeOrders = myDeliveries.filter(m => m.status === 'out_for_delivery');
  const totalEarnings = earningsData.totalEarnings; 
  const totalKM = earningsData.totalKM;
  const todayEarnings = earningsData.todayEarnings;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-50 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm">
            <FaMotorcycle />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Rider Portal</h2>
          <p className="text-xs text-gray-400">{user?.name}</p>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <button onClick={() => setActiveTab("overview")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === "overview" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-500 hover:bg-gray-50"}`}>
            <FaChartLine /> Overview
          </button>
          <button onClick={() => setActiveTab("available")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === "available" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-500 hover:bg-gray-50"}`}>
            <FaBoxOpen /> Available Pool
          </button>
          <button onClick={() => setActiveTab("mydeliveries")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition flex items-center justify-between ${activeTab === "mydeliveries" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-500 hover:bg-gray-50"}`}>
            <div className="flex flex-row items-center gap-3"><FaCheckCircle /> My Deliveries</div>
            {activeOrders.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{activeOrders.length}</span>}
          </button>
          <hr className="my-4 border-gray-100" />
          <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === "settings" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-500 hover:bg-gray-50"}`}>
            <FaCog /> Profile Settings
          </button>
          <button onClick={() => setActiveTab("complaints")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === "complaints" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-500 hover:bg-gray-50"}`}>
            <FaExclamationTriangle /> Raise Complaint
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-50">
          <button 
             onClick={handleLogout} 
             className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl transition shadow-sm"
          >
             <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-5xl mx-auto">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
             <h1 className="text-2xl font-black text-gray-800">Dashboard Overview</h1>
             
             {/* Stats Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                   <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm"><FaWallet /></div>
                   <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Earnings</p>
                     <p className="text-2xl font-black text-gray-800">₹{totalEarnings}</p>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                   <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm"><FaCheckCircle /></div>
                   <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Completed</p>
                     <p className="text-2xl font-black text-gray-800">{deliveredOrders.length}</p>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                   <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm"><FaBolt /></div>
                   <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today Early</p>
                     <p className="text-2xl font-black text-gray-800">₹{todayEarnings}</p>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                   <div className="w-14 h-14 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm"><FaMotorcycle /></div>
                   <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total KM</p>
                     <p className="text-2xl font-black text-gray-800">{totalKM} KM</p>
                   </div>
                </div>
             </div>

             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
                {myDeliveries.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activity.</p>
                ) : (
                  <ul className="space-y-4">
                    {myDeliveries.slice(0, 5).map(m => (
                        <li key={m._id || m.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                          <div className="flex flex-col gap-0.5">
                             <p className="font-bold text-gray-700">Order #{m._id?.slice(-5)}</p>
                             <p className="text-[10px] text-gray-400">{m.distance} KM • ₹{m.riderEarning} earning</p>
                          </div>
                          <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${m.status==='delivered'?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}`}>
                            {m.status}
                          </span>
                        </li>
                    ))}
                  </ul>
                )}
             </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 max-w-xl">
             <h1 className="text-2xl font-black text-gray-800 mb-6">Profile Settings</h1>
             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <form onSubmit={saveProfileHandler} className="space-y-5">
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                     <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name:e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 outline-none focus:border-blue-500" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                     <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone:e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 outline-none focus:border-blue-500" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Vehicle Type</label>
                     <select value={profileData.vehicle} onChange={e => setProfileData({...profileData, vehicle:e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 outline-none focus:border-blue-500">
                        <option>Bike</option>
                        <option>Scooter</option>
                        <option>Electric EV</option>
                     </select>
                   </div>
                   <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">Update Settings</button>
                </form>
             </div>
          </div>
        )}

        {/* COMPLAINTS TAB */}
        {activeTab === "complaints" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 max-w-xl">
             <h1 className="text-2xl font-black text-gray-800 mb-6">Raise a Complaint</h1>
             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500 mb-6">Having issues with a pharmacy, an order, or the app? Let us know below.</p>
                <form onSubmit={submitComplaintHandler} className="space-y-5">
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                     <select value={complaintSubject} onChange={e => setComplaintSubject(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 outline-none focus:border-blue-500">
                        <option value="">Select an issue...</option>
                        <option value="Pharmacy Delay">Pharmacy dragging on dispatch</option>
                        <option value="App Bug">App is glitching</option>
                        <option value="Payment Issue">Earnings missing</option>
                        <option value="Other">Other / General</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                     <textarea value={complaintText} onChange={e => setComplaintText(e.target.value)} rows="4" className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 outline-none focus:border-blue-500" placeholder="Describe the problem..."></textarea>
                   </div>
                   <button type="submit" className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition">Submit Ticket</button>
                </form>
             </div>
          </div>
        )}

        {/* AVAILABLE POOL TAB */}
        {activeTab === "available" && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-gray-800">Available Deliveries</h1>
              <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">{availableOrders.length} found</span>
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-10 font-bold">Checking local pharmacies...</p>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <FaClock className="text-5xl text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">No confirmed orders waiting for delivery right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableOrders.map(order => (
                  <div key={order._id || order.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                         <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg">Ready for pickup</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-500">Payout: ₹{order.deliveryCharge}</p>
                        <p className="text-[10px] text-gray-400">{order.distance} KM</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pickup At</p>
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-2"><FaMapMarkerAlt className="text-blue-500"/> {order.storeName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deliver To</p>
                        <p className="text-sm font-bold text-gray-800 flex items-start gap-2 max-w-[250px]">
                           <FaMapMarkerAlt className="text-orange-500 mt-0.5 flex-shrink-0"/> 
                           <span className="truncate whitespace-normal">{order.deliveryAddress}</span>
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleAcceptOrder(order._id || order.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                    >
                      <FaCheckCircle /> Accept Delivery
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY DELIVERIES TAB */}
        {activeTab === "mydeliveries" && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <h1 className="text-2xl font-black text-gray-800 mb-6">My Deliveries</h1>
            
             {loading ? (
              <p className="text-center text-gray-500 py-10 font-bold">Loading your active jobs...</p>
            ) : myDeliveries.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <FaMotorcycle className="text-5xl text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">You don't have any active deliveries.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {myDeliveries.map(order => (
                  <div key={order._id || order.id} className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8">
                    
                    {/* Details Column */}
                    <div className="flex-1 space-y-5">
                      <div className="flex items-center gap-3">
                         {order.status === "out_for_delivery" ? (
                           <span className="bg-orange-100 text-orange-700 text-xs font-black uppercase px-3 py-1.5 rounded-xl border border-orange-200">Out for Delivery</span>
                         ) : order.status === "delivered" ? (
                           <span className="bg-emerald-100 text-emerald-700 text-xs font-black uppercase px-3 py-1.5 rounded-xl border border-emerald-200">Delivered</span>
                         ) : (
                           <span className="bg-gray-100 text-gray-700 text-xs font-black uppercase px-3 py-1.5 rounded-xl border border-gray-200">{order.status}</span>
                         )}
                         <span className="text-gray-400 text-xs font-bold">Order #{order._id?.slice(-6).toUpperCase() || order.id?.slice(-6).toUpperCase()}</span>
                         {order.status === "out_for_delivery" && (
                           <button 
                             onClick={() => setActiveTrackingOrder(activeTrackingOrder === (order._id || order.id) ? null : (order._id || order.id))}
                             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${activeTrackingOrder === (order._id || order.id) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-600 border-blue-100 hover:bg-blue-50"}`}
                           >
                             <FaMap /> {activeTrackingOrder === (order._id || order.id) ? "Hide Map" : "Track on Map"}
                           </button>
                         )}
                      </div>
                      
                      {activeTrackingOrder === (order._id || order.id) && (
                        <div className="mt-4 animate-in zoom-in-95 duration-200">
                           <MapTracker 
                             pickup={[order.pickupLat, order.pickupLng]} 
                             delivery={[order.deliveryLat, order.deliveryLng]} 
                           />
                           <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                             Live location tracking active. Map shows 🏥 Pickup, 📍 Destination and 🛵 Your Position.
                           </p>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 pointer-events-none">Customer Info</p>
                               <p className="text-sm font-bold text-gray-800 flex items-center gap-2"><FaUser className="text-blue-400"/> {order.customerName}</p>
                               <p className="text-sm font-bold text-gray-600 flex items-center gap-2 mt-1"><FaPhoneAlt className="text-green-500"/> {order.customerPhone}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 pointer-events-none">Drop Address</p>
                               <p className="text-sm font-bold text-gray-800 flex items-start gap-2"><FaMapMarkerAlt className="text-red-500 mt-1"/> {order.deliveryAddress}</p>
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Action Column */}
                    <div className="w-full md:w-72 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                       {order.status === "out_for_delivery" ? (
                          <div className="space-y-4 bg-blue-50 p-5 rounded-2xl border border-blue-100">
                             <p className="text-xs font-bold text-blue-800 text-center uppercase tracking-wider">Complete Delivery</p>
                             <input 
                               type="text" 
                               placeholder="Enter 4-digit OTP" 
                               maxLength="4"
                               value={otpInputs[order._id || order.id] || ""}
                               onChange={(e) => setOtpInputs({ ...otpInputs, [order._id || order.id]: e.target.value.replace(/\D/g, '') })}
                               className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-center text-lg font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500"
                             />
                             <button
                               onClick={() => handleCompleteDelivery(order._id || order.id)}
                               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-200"
                             >
                               Verify & Complete
                             </button>
                          </div>
                       ) : order.status === "delivered" ? (
                          <div className="text-center bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                             <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
                               <FaCheckCircle />
                             </div>
                             <p className="font-bold text-emerald-800">Earned: ₹40</p>
                             <p className="text-[10px] text-emerald-600 mt-1 uppercase font-bold">Delivery Completed</p>
                          </div>
                       ) : (
                          <div className="text-center p-5">
                             <p className="text-sm text-gray-500 font-bold italic">Status: {order.status}</p>
                          </div>
                       )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default RiderDashboard;
