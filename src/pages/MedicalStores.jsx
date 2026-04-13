import { useState, useRef, useEffect } from "react";
import { useAppointment } from "../context/AppointmentContext";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import { useMedical } from "../context/MedicalContext";
import { useNavigate } from "react-router-dom";
import {
  FaStore, FaStar, FaMapMarkerAlt, FaClock, FaArrowRight,
  FaTimes, FaCheck, FaShoppingBag, FaBolt, FaCalendarAlt,
  FaLocationArrow, FaFileMedical, FaPlus, FaMinus, FaPills,
  FaUpload, FaTrash, FaSearch
} from "react-icons/fa";
import { MdEmail, MdPhone, MdNotes } from "react-icons/md";
import { FaChevronLeft, FaLock } from "react-icons/fa";
import PaymentPanel from "../components/PaymentPanel";

/* ══════════════════════════════════════════════════════════════════
   LUCKNOW AREA LIST (for GPS snap)
══════════════════════════════════════════════════════════════════ */
const AREAS = [
  { name: "Hazratganj",   lat: 26.8467, lng: 80.9462 },
  { name: "Gomti Nagar",  lat: 26.8574, lng: 81.0054 },
  { name: "Alambagh",     lat: 26.8006, lng: 80.9191 },
  { name: "Indira Nagar", lat: 26.8713, lng: 80.9955 },
  { name: "Chowk",        lat: 26.8697, lng: 80.9124 },
  { name: "Aminabad",     lat: 26.8488, lng: 80.9329 },
  { name: "Kapoorthala",  lat: 26.8577, lng: 80.9800 },
  { name: "Mahanagar",    lat: 26.8716, lng: 80.9564 },
  { name: "Jankipuram",   lat: 26.9124, lng: 80.9740 },
  { name: "Telibagh",     lat: 26.7900, lng: 80.9990 },
  { name: "Tiwariganj",   lat: 26.8860, lng: 81.0820 },
];
const nearestArea = (lat, lng) => {
  let best = AREAS[0].name, bestD = Infinity;
  for (const a of AREAS) {
    const d = Math.hypot(lat - a.lat, lng - a.lng);
    if (d < bestD) { bestD = d; best = a.name; }
  }
  return best;
};

/* ══════════════════════════════════════════════════════════════════
   ENHANCED ORDER MODAL
══════════════════════════════════════════════════════════════════ */
const OrderModal = ({ store, onClose }) => {
  const { placeOrder, sendNotification, getMedicinesByStore, fetchMedicinesByStore } = useAppointment();
  const { user } = useAuth();

  useEffect(() => {
    if (store?.email) fetchMedicinesByStore(store.email);
  }, [store?.email]);

  // ── form state ──
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("instant"); // "instant" | "scheduled"
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [orderMode, setOrderMode] = useState("select"); // "select" | "notes" | "prescription"
  const [selectedMeds, setSelectedMeds] = useState({}); // { medId: qty }
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState(null);  // base64
  const [prescPreview, setPrescPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detectErr, setDetectErr] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [payStep, setPayStep] = useState(false);
  const [paying, setPaying] = useState(false);
  const [distData, setDistData] = useState({ distance: 0, deliveryCharge: 0 });
  const [loadingDist, setLoadingDist] = useState(false);
  const [medSearch, setMedSearch] = useState("");
  const [finalData, setFinalData] = useState(null);
  const prescRef = useRef();

  // Store's uploaded medicines
  const storeMedicines = getMedicinesByStore(store.email);

  // ── Optimized Instant Detect ──
  const { fastDetectLocation } = useLocation();
  const detectAddress = () => {
    setDetecting(true); setDetectErr("");
    fastDetectLocation((loc) => {
      if (loc?.fullAddress) {
        setAddress(loc.fullAddress);
      } else if (loc?.area) {
        setAddress(loc.area);
      }
      if (loc?.lat && loc?.lng) {
        setDeliveryLat(loc.lat);
        setDeliveryLng(loc.lng);
      }
      setDetecting(false);
    });
  };

  // ── Calculate Distance & Charges ──
  useEffect(() => {
    const getCharges = async () => {
      if (!deliveryLat || !deliveryLng || !store.latitude || !store.longitude) return;
      setLoadingDist(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
        const res = await fetch(`${apiUrl}/orders/calculate-distance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickupLat: store.latitude,
            pickupLng: store.longitude,
            deliveryLat,
            deliveryLng
          })
        });
        const json = await res.json();
        if (json.success) setDistData(json.data);
      } catch (err) { console.error("Dist calc error:", err); }
      setLoadingDist(false);
    };
    getCharges();
  }, [deliveryLat, deliveryLng, store.latitude, store.longitude]);

  // ── prescription upload ──
  const handlePrescUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setErrors(p => ({ ...p, presc: "Max 3MB allowed" })); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPrescription(ev.target.result);
      setPrescPreview({ name: file.name, type: file.type });
      setErrors(p => ({ ...p, presc: "" }));
    };
    reader.readAsDataURL(file);
  };

  // ── medicine qty controls ──
  const incQty = (id) => setSelectedMeds(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const decQty = (id) => setSelectedMeds(p => {
    const q = (p[id] || 0) - 1;
    if (q <= 0) { const n = { ...p }; delete n[id]; return n; }
    return { ...p, [id]: q };
  });

  const chosenMedsList = storeMedicines.filter(m => selectedMeds[m._id] > 0);
  const chosenSummary = chosenMedsList.map(m => `${m.name} x${selectedMeds[m._id]}`).join(", ");
  const totalMedsPrice = chosenMedsList.reduce((acc, m) => acc + (m.price * selectedMeds[m._id]), 0);
  // Using distance-based delivery charge
  const totalAmount = totalMedsPrice + distData.deliveryCharge;

  // ── validate ──
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!/^[6-9]\d{9}$/.test(phone)) e.phone = "Enter valid 10-digit number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter valid email";
    if (!address.trim() || address.trim().length < 5) e.address = "Enter complete delivery address";
    if (deliveryMode === "scheduled") {
      if (!deliveryDate) e.date = "Select delivery date";
      if (!deliveryTime) e.time = "Select time slot";
    }
    if (orderMode === "select" && chosenMedsList.length === 0) e.meds = "Select at least one medicine";
    if (orderMode === "notes" && notes.trim().length < 3) e.notes = "Please describe your order";
    if (orderMode === "prescription" && !prescription) e.presc = "Please upload a prescription";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const reasonText = orderMode === "select"
      ? `Medicines: ${chosenSummary}`
      : orderMode === "notes"
      ? `Notes: ${notes}`
      : "Prescription uploaded";

    setFinalData({
      name, phone, email,
      deliveryAddress: address,
      deliveryMode,
      appointmentDate: deliveryMode === "instant" ? "Instant Delivery" : deliveryDate,
      appointmentTime: deliveryMode === "instant" ? "ASAP" : deliveryTime,
      reason: reasonText,
      prescription: prescription || null,
      selectedMedicines: chosenMedsList.map(m => ({ id: m._id, name: m.name, qty: selectedMeds[m._id], price: m.price })),
      patientEmail: user?.email || email,
      partnerEmail: store.email,
      partnerRole: "pharmacy",
      storeName: store.name || store.clinicName,
      location: store.location,
      pickupLng: store.longitude,
      distance: distData.distance,
      deliveryCharge: distData.deliveryCharge,
      medicineTotal: totalMedsPrice,
      amount: totalAmount, // This is already totalMedsPrice + distData.deliveryCharge
    });
    setPayStep(true);
  };

  const onPay = async ({ method, detail }) => {
    setPaying(true);
    try {
      // Build items array - if medicines selected, use them; otherwise create a text-only order item
      let items;
      if (orderMode === "select" && chosenMedsList.length > 0) {
        items = chosenMedsList.map(m => ({
          medicineId: m._id,
          name: m.name,
          price: m.price,
          quantity: selectedMeds[m._id] || 1,
          storeEmail: store.email
        }));
      } else {
        // For notes/prescription-based orders, create a placeholder item
        items = [{
          medicineId: "000000000000000000000000",
          name: orderMode === "notes" ? `Custom Order: ${notes.substring(0,50)}` : "Prescription Order",
          price: totalAmount,
          quantity: 1,
          storeEmail: store.email
        }];
      }

      await placeOrder({
        patientEmail:    user?.email || finalData.patientEmail,
        customerName:    finalData.name,
        customerPhone:   finalData.phone,
        items,
        totalAmount:     totalAmount,
        deliveryAddress: finalData.deliveryAddress,
        paymentMethod:   method,
        paymentStatus:   "paid",
        prescriptionUrl: finalData.prescription || null,
        storeEmail:      store.email,
        storeName:       store.name || store.clinicName,
        deliveryLat:     finalData.deliveryLat,
        deliveryLng:     finalData.deliveryLng,
        pickupLat:       finalData.pickupLat,
        pickupLng:       finalData.pickupLng,
        distance:        finalData.distance,
        deliveryCharge:  finalData.deliveryCharge,
        medicineTotal:   finalData.medicineTotal,
        riderEarning:    finalData.deliveryCharge, // Rider gets the full delivery charge
      });

      // Notify the pharmacy 
      await sendNotification(
        store.email,
        `New medicine order from ${finalData.name}. Review and accept.`,
        "order"
      );

      setPaying(false);
      setSubmitted(true);
    } catch (err) {
      console.error("Order failed:", err);
      alert(err.message || "Order placement failed. Please try again.");
      setPaying(false);
    }
  };

  const inp = (hasErr) =>
    `w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition bg-gray-50
     ${hasErr ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-green-300 focus:border-transparent"}`;

  const sectionTitle = (icon, text) => (
    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
      <span className="text-green-500">{icon}</span> {text}
    </p>
  );

  const modeBtn = (active, onClick, icon, label, sub) => (
    <button type="button" onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition text-center
        ${active ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-500 hover:border-green-300"}`}>
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-bold">{label}</span>
      {sub && <span className="text-[10px] text-gray-400 leading-tight">{sub}</span>}
    </button>
  );

  const today = new Date().toISOString().split("T")[0];
  const timeSlots = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3 py-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[96vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-t-2xl p-5 flex items-start justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              <FaShoppingBag /> Place Medicine Order
            </h2>
            <p className="text-green-100 text-sm mt-0.5 font-medium">{store.name || store.clinicName}</p>
            <p className="text-green-200 text-xs mt-1 flex items-center gap-1">
              <FaMapMarkerAlt /> {store.fullAddress || store.location}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition">
            <FaTimes />
          </button>
        </div>

        {submitted ? (
          /* ── SUCCESS ── */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <FaCheck className="text-2xl text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Order Placed! 🎉</h3>
            <p className="text-gray-500 text-sm mb-1">Your order to <strong>{store.name || store.clinicName}</strong> is <span className="text-yellow-600 font-semibold">Pending</span>.</p>
            <p className="text-gray-400 text-xs mb-6">
              {deliveryMode === "instant" ? "⚡ Instant delivery requested." : `📅 Scheduled for ${deliveryDate} at ${deliveryTime}.`}
            </p>
            <button onClick={onClose} className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 transition shadow-md shadow-green-200">
              Done
            </button>
          </div>
        ) : payStep ? (
          /* ── PAYMENT ── */
          <div className="p-5 font-sans">
            <button type="button" onClick={() => setPayStep(false)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 font-medium">
              <FaChevronLeft className="text-xs" /> Back to Details
            </button>
            <div className="bg-green-50 rounded-2xl px-5 py-4 mb-6 border border-green-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Medicine Total</span>
                <span className="text-sm font-bold text-gray-700">₹{totalMedsPrice}</span>
              </div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider italic">Distance (KM)</span>
                <span className="text-sm font-bold text-gray-600 italic">
                   {loadingDist ? "..." : `${distData.distance} KM`}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Delivery Charge</span>
                <span className="text-sm font-bold text-green-600">
                  {loadingDist ? "Calculating..." : `₹${distData.deliveryCharge}`}
                </span>
              </div>
              <div className="border-t border-green-100 pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">Grand Total</span>
                <span className="text-xl font-black text-green-700">₹{totalMedsPrice + distData.deliveryCharge}</span>
              </div>
            </div>
            <PaymentPanel amount={totalAmount} onPay={onPay} processing={paying} label={`Pay ₹${totalAmount} · Confirm Order`} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5" noValidate>

            {/* ── CONTACT INFO ── */}
            <div className="space-y-3">
              {sectionTitle(<MdPhone />, "Contact Details")}
              <input placeholder="Full Name *" className={inp(errors.name)} value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }} />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input placeholder="Phone *" className={inp(errors.phone)} value={phone}
                    onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: "" })); }} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <input placeholder="Email *" className={inp(errors.email)} value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* ── DELIVERY ADDRESS ── */}
            <div>
              {sectionTitle(<FaMapMarkerAlt />, "Delivery Address")}
              <div className="flex gap-2 mb-1.5">
                <textarea rows={2} placeholder="House No, Street, Area, City, Pincode *"
                  className={`${inp(errors.address)} resize-none flex-1`} value={address}
                  onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: "" })); }} />
              </div>
              <button type="button" onClick={detectAddress} disabled={detecting}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition
                  ${detecting ? "bg-blue-50 text-blue-400 border-blue-200 cursor-wait" : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"}`}>
                {detecting
                  ? <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Detecting…</>
                  : <><FaLocationArrow /> Auto-Detect My Location</>}
              </button>
              {detectErr && <p className="text-red-500 text-xs mt-1">{detectErr}</p>}
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* ── DELIVERY MODE ── */}
            <div>
              {sectionTitle(<FaClock />, "Delivery Time")}
              <div className="flex gap-3 mb-3">
                {modeBtn(deliveryMode === "instant", () => setDeliveryMode("instant"),
                  <FaBolt />, "Instant", "Deliver ASAP")}
                {modeBtn(deliveryMode === "scheduled", () => setDeliveryMode("scheduled"),
                  <FaCalendarAlt />, "Scheduled", "Pick date & time")}
              </div>

              {deliveryMode === "instant" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700 flex items-center gap-2">
                  <FaBolt className="text-yellow-500 flex-shrink-0" />
                  Pharmacy will deliver as soon as your order is accepted.
                </div>
              )}

              {deliveryMode === "scheduled" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-semibold mb-1 block">Delivery Date *</label>
                    <input type="date" min={today} className={inp(errors.date)} value={deliveryDate}
                      onChange={e => { setDeliveryDate(e.target.value); setErrors(p => ({ ...p, date: "" })); }} />
                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold mb-1 block">Time Slot *</label>
                    <select className={inp(errors.time)} value={deliveryTime}
                      onChange={e => { setDeliveryTime(e.target.value); setErrors(p => ({ ...p, time: "" })); }}>
                      <option value="">Select slot</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* ── ORDER / MEDICINE DETAILS ── */}
            <div>
              {sectionTitle(<FaPills />, "What Do You Need?")}
              <div className="flex gap-2 mb-3">
                {storeMedicines.length > 0 && modeBtn(orderMode === "select", () => setOrderMode("select"),
                  <FaPills />, "Select Medicines", "From store list")}
                {modeBtn(orderMode === "notes", () => setOrderMode("notes"),
                  <MdNotes />, "Type Request", "Write medicine names")}
                {modeBtn(orderMode === "prescription", () => setOrderMode("prescription"),
                  <FaFileMedical />, "Prescription", "Upload image/PDF")}
              </div>

              {/* SELECT FROM STORE INVENTORY */}
              {orderMode === "select" && (
                <div className="space-y-3">
                  {storeMedicines.length > 0 && (
                    <div className="relative mb-2">
                       <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                       <input 
                         type="text" 
                         placeholder="Search medicines..." 
                         className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                         value={medSearch}
                         onChange={(e) => setMedSearch(e.target.value)}
                       />
                    </div>
                  )}

                  {storeMedicines.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-4">This store hasn't listed any medicines yet.</p>
                  ) : (
                    <>
                      <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                        {storeMedicines
                          .filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()))
                          .map(m => (
                          <div key={m._id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 hover:border-green-200 transition">
                            {m.image
                              ? <img src={m.image} alt={m.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                              : <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-500 flex-shrink-0"><FaPills /></div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">{m.name}</p>
                              <p className="text-xs text-gray-500">{m.type} · ₹{m.price}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {selectedMeds[m._id] > 0 ? (
                                <>
                                  <button type="button" onClick={() => decQty(m._id)}
                                    className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition">
                                    <FaMinus className="text-[10px]" />
                                  </button>
                                  <span className="w-5 text-center text-sm font-bold text-gray-700">{selectedMeds[m._id]}</span>
                                  <button type="button" onClick={() => incQty(m._id)}
                                    className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center hover:bg-green-200 transition">
                                    <FaPlus className="text-[10px]" />
                                  </button>
                                </>
                              ) : (
                                <button type="button" onClick={() => incQty(m._id)}
                                  className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition">
                                  <FaPlus className="text-[10px]" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {chosenMedsList.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-xs text-green-700">
                          <strong>Selected:</strong> {chosenSummary}
                        </div>
                      )}
                    </>
                  )}
                  {errors.meds && <p className="text-red-500 text-xs">{errors.meds}</p>}
                </div>
              )}

              {/* MANUAL NOTES */}
              {orderMode === "notes" && (
                <div>
                  <textarea rows={3} placeholder="e.g. Paracetamol 500mg x2, Azithromycin 500mg x1, Cough syrup..."
                    className={`${inp(errors.notes)} resize-none`} value={notes}
                    onChange={e => { setNotes(e.target.value); setErrors(p => ({ ...p, notes: "" })); }} />
                  {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
                </div>
              )}

              {/* PRESCRIPTION UPLOAD */}
              {orderMode === "prescription" && (
                <div>
                  <div onClick={() => prescRef.current?.click()}
                    className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition">
                    {prescPreview ? (
                      <>
                        {prescPreview.type?.startsWith("image/") ? (
                          <img src={prescription} alt="prescription" className="w-32 h-32 object-contain rounded-lg border border-gray-200" />
                        ) : (
                          <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                            <FaFileMedical className="text-3xl" />
                          </div>
                        )}
                        <p className="text-xs font-medium text-gray-600 truncate max-w-[200px]">{prescPreview.name}</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setPrescription(null); setPrescPreview(null); }}
                          className="text-red-500 text-xs flex items-center gap-1 hover:text-red-700">
                          <FaTrash /> Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <FaUpload className="text-3xl text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">Click to upload prescription</p>
                        <p className="text-xs text-gray-400">JPG, PNG, PDF — Max 3MB</p>
                      </>
                    )}
                  </div>
                  <input ref={prescRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handlePrescUpload} />
                  {errors.presc && <p className="text-red-500 text-xs mt-1">{errors.presc}</p>}
                </div>
              )}
            </div>

            {/* ── SUBMIT ── */}
            <button type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-100 transition flex items-center justify-center gap-2 text-sm">
              <FaShoppingBag />
              {deliveryMode === "instant" ? "⚡ Place Instant Order" : "📅 Schedule Delivery"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN MEDICAL STORES PAGE
══════════════════════════════════════════════════════════════════ */
const MedicalStores = () => {
  const { getPartnersByRole } = useAppointment();
  const { location } = useLocation();
  const { selectMedical } = useMedical();
  const navigate = useNavigate();
  const [selectedStore, setSelectedStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPartnersByRole("pharmacy").then((data) => {
      setStores(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch((err) => {
      console.error("❌ ERROR FETCHING PHARMACIES:", err);
      setLoading(false);
    });
  }, []);

  const filtered = stores.filter((s) => {
    if (!location?.area || location.area === "All Areas" || location.area === "Current Location" || location.area === "Lucknow") return true;
    const storeLoc = (s.location || "").toLowerCase();
    const storeArea = (s.storeArea || "").toLowerCase();
    const currentLoc = (location.area || "").toLowerCase();
    return storeLoc.includes(currentLoc) || storeArea.includes(currentLoc);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Medical Stores & Pharmacies</h1>
        <p className="text-gray-500 mb-8">
          Showing stores in <span className="font-semibold text-green-600">{location?.area || "your area"}</span>
        </p>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Loading pharmacies...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <FaStore className="text-5xl text-gray-300 mx-auto mb-3" />
            <h3 className="text-xl text-gray-500 font-semibold">No pharmacies registered yet</h3>
            <p className="text-gray-400 mt-1">Pharmacies will appear here after they sign up on D2D Pharma.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((store) => (
              <div key={store.email}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all group flex flex-col">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-green-700 text-3xl font-bold flex-shrink-0 border border-green-100 overflow-hidden">
                    {store.profilePhoto ? (
                      <img src={store.profilePhoto} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      store.name?.charAt(0) || "P"
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                        {store.name}
                      </h3>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        {store.rating?.toFixed(1) || "5.0"} <FaStar className="text-[10px]" />
                      </span>
                    </div>
                    {store.location && (
                      <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <FaMapMarkerAlt className="text-gray-400" /> {store.location}
                      </p>
                    )}
                    {store.phone && (
                      <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <FaClock className="text-gray-400" /> {store.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 justify-end">
                  <button
                    onClick={() => setSelectedStore(store)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-md shadow-green-200">
                    <FaShoppingBag /> Order Medicines
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStore && (
        <OrderModal store={selectedStore} onClose={() => setSelectedStore(null)} />
      )}
    </div>
  );
};

export default MedicalStores;
