import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../context/AppointmentContext";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaArrowLeft, FaMapMarkerAlt, FaChevronLeft, FaUser, FaPhone, FaUpload, FaCheck, FaFilePrescription } from "react-icons/fa";
import { useState } from "react";
import { useLocation } from "../context/LocationContext";
import PaymentPanel from "../components/PaymentPanel";

// Standardized nearestArea imported via useLocation()

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { user } = useAuth();
  const { bookAppointment, placeOrder } = useAppointment();
  const { nearestArea } = useLocation();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [ordered, setOrdered] = useState(false);

  // Step: "cart" | "details" | "payment"
  const [step, setStep] = useState("cart");

  // Delivery details (pre-filled from user)
  const [deliveryName,  setDeliveryName]  = useState(user?.name  || "");
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || "");
  const [deliveryEmail, setDeliveryEmail] = useState(user?.email || "");
  const [address,       setAddress]       = useState("");
  const [detailErrors,  setDetailErrors]  = useState({});
  const [detecting,     setDetecting]     = useState(false);
  const [detectErr,     setDetectErr]     = useState("");
  const [prescription,  setPrescription]  = useState("");
  const [presName,      setPresName]      = useState("");

  const total = cartTotal + 15;

  /* ── GPS detect ── */
  const detectAddress = () => {
    setDetecting(true); setDetectErr("");
    if (!navigator.geolocation) { setDetectErr("Geolocation not supported"); setDetecting(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setAddress(`${nearestArea(coords.latitude, coords.longitude)}`); setDetecting(false); },
      () => { setDetectErr("Could not detect. Enter manually."); setDetecting(false); },
      { timeout: 8000 }
    );
  };

  /* ── Validate delivery form ── */
  const validateDetails = () => {
    const e = {};
    if (!deliveryName.trim()) e.name = "Name is required";
    if (!/^[6-9]\d{9}$/.test(deliveryPhone)) e.phone = "Enter valid 10-digit mobile number";
    if (!address.trim() || address.trim().length < 10) e.address = "Enter complete delivery address (min 10 chars)";
    
    const needsPrescription = cart.some(i => i.requiresPrescription);
    if (needsPrescription && !prescription) e.prescription = "Prescription is required for some items in your cart";
    
    setDetailErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePrescriptionChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPresName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setPrescription(reader.result);
      reader.readAsDataURL(file);
    }
  };

  /* ── Final checkout with payment ── */
  const handleCheckout = async ({ method, detail }) => {
    setIsProcessing(true);
    try {
      const medicines = cart.filter(i => i.type === "medicine");
      const labs      = cart.filter(i => i.type === "lab");

      // ─── Handle Medicines via New Order API ───
      if (medicines.length > 0) {
        const storeGroups = {};
        medicines.forEach(item => {
          const storeEmail = item.storeEmail || item.partnerEmail;
          const storeName  = item.storeName  || item.store || "Pharmacy";
          if (storeEmail) {
            if (!storeGroups[storeEmail]) storeGroups[storeEmail] = { storeName, total: 0, items: [] };
            storeGroups[storeEmail].total += item.price * item.quantity;
            storeGroups[storeEmail].items.push({
                medicineId: item._id || item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                storeEmail: storeEmail
            });
          }
        });

        for (const [storeEmail, group] of Object.entries(storeGroups)) {
          await placeOrder({
            patientEmail:    user?.email || deliveryEmail,
            customerName:    deliveryName,
            customerPhone:   deliveryPhone,
            items:           group.items,
            totalAmount:     group.total,
            deliveryAddress: address,
            paymentMethod:   method,
            paymentStatus:   "paid",
            prescriptionUrl: prescription,
            storeEmail:      storeEmail,
            storeName:       group.storeName
          });
        }
      }

      // ─── Handle Labs via Legacy Appointment API ───
      if (labs.length > 0) {
          for (const lab of labs) {
              await bookAppointment({
                  name:           deliveryName,
                  phone:          deliveryPhone,
                  email:          deliveryEmail,
                  deliveryAddress: address,
                  reason:         lab.name,
                  patientEmail:   user?.email || deliveryEmail,
                  partnerEmail:   lab.labEmail || lab.partnerEmail,
                  partnerRole:    "lab",
                  labName:        lab.lab || "Lab",
                  paymentMethod:  method,
                  paymentDetail:  detail,
                  paymentStatus:  "paid",
                  amount:         lab.price,
                  appointmentDate: new Date().toLocaleDateString("en-IN"),
                  appointmentTime: "ASAP",
              });
          }
      }

      setIsProcessing(false);
      clearCart();
      setOrdered(true);
    } catch (err) {
      console.error("Checkout Error:", err);
      alert(err.message || "Something went wrong during checkout");
      setIsProcessing(false);
    }
  };

  const medicines = cart.filter(i => i.type === "medicine");
  const labs      = cart.filter(i => i.type === "lab");

  /* ── Success screen ── */
  if (ordered) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Order Placed! 🎉</h2>
        <p className="text-gray-500 mb-1">Delivering to: <strong>{address}</strong></p>
        <p className="text-gray-400 text-sm mb-6">We'll notify you once your order is dispatched.</p>
        <button onClick={() => navigate("/")} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition">Back to Home</button>
      </div>
    );
  }

  /* ── Empty cart ── */
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" alt="Empty Cart" className="w-48 sm:w-64 mb-6 opacity-80" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => navigate("/medicines")} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition">Buy Medicines</button>
          <button onClick={() => navigate("/lab-tests")} className="bg-white border border-blue-600 text-blue-600 px-6 py-2 rounded-full font-bold hover:bg-blue-50 transition">Book Tests</button>
        </div>
      </div>
    );
  }

  /* ── STEP: CART REVIEW ── */
  if (step === "cart") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Your Cart <span className="text-lg font-normal text-gray-500">({cart.length} items)</span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: Items */}
            <div className="lg:col-span-2 space-y-6">
              {medicines.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-green-500 rounded-full"></span> Medicines
                  </h2>
                  <div className="space-y-4">
                    {medicines.map(item => (
                      <div key={item.id} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-800">{item.name}</h3>
                            <button onClick={() => removeFromCart(item.id, item.type)} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{item.manufacturer || "Generic"}</p>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center border border-gray-200 rounded-lg">
                              <button onClick={() => updateQuantity(item.id, item.type, -1)} className="px-3 py-1 text-gray-500 hover:bg-gray-50">-</button>
                              <span className="px-2 text-sm font-bold text-gray-800">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.type, 1)} className="px-3 py-1 text-gray-500 hover:bg-gray-50">+</button>
                            </div>
                            <p className="font-bold text-gray-800">₹{item.price * item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {labs.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span> Lab Tests
                  </h2>
                  <div className="space-y-4">
                    {labs.map(item => (
                      <div key={item.id} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                        <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 font-bold text-xl">LT</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-800">{item.name}</h3>
                            <button onClick={() => removeFromCart(item.id, item.type)} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{item.lab || "Pathology Lab"}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">Home Collection</span>
                            <p className="font-bold text-gray-800">₹{item.price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Bill + CTA */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-800 mb-4">Bill Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Item Total</span><span>₹{cartTotal}</span></div>
                  <div className="flex justify-between"><span>Delivery Charges</span><span className="text-green-600 font-bold">FREE</span></div>
                  <div className="flex justify-between"><span>Taxes & Charges</span><span>₹15</span></div>
                </div>
                <div className="border-t border-dashed border-gray-200 my-3" />
                <div className="flex justify-between font-bold text-lg text-gray-800">
                  <span>To Pay</span><span>₹{total}</span>
                </div>
              </div>
              <button
                onClick={() => setStep("details")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition text-base"
              >
                Proceed to Delivery Details →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP: DELIVERY DETAILS ── */
  if (step === "details") {
    const inp = (hasErr) =>
      `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition bg-gray-50
       ${hasErr ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-blue-300 focus:border-blue-400"}`;

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans">
        <div className="max-w-lg mx-auto">
          <button onClick={() => setStep("cart")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 font-medium text-sm">
            <FaChevronLeft className="text-xs" /> Back to Cart
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Delivery Details</h2>
            <p className="text-sm text-gray-500 mb-6">We've pre-filled your info. Just add your delivery address.</p>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Full Name *</label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    value={deliveryName} onChange={e => setDeliveryName(e.target.value)}
                    placeholder="Full name" className={`${inp(detailErrors.name)} pl-9`}
                  />
                </div>
                {detailErrors.name && <p className="text-red-500 text-xs mt-1">{detailErrors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Phone Number *</label>
                <div className="relative">
                  <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    type="tel" placeholder="10-digit mobile number" className={`${inp(detailErrors.phone)} pl-9`}
                  />
                </div>
                {detailErrors.phone && <p className="text-red-500 text-xs mt-1">{detailErrors.phone}</p>}
              </div>

              {/* Email (read-only, auto from user) */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Email</label>
                <input
                  value={deliveryEmail} readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 flex items-center justify-between">
                  <span>Delivery Address *</span>
                  <button type="button" onClick={detectAddress} disabled={detecting}
                    className="flex items-center gap-1 text-blue-600 text-xs font-bold hover:underline disabled:opacity-60">
                    <FaMapMarkerAlt className="text-[10px]" />
                    {detecting ? "Detecting…" : "Auto-detect"}
                  </button>
                </label>
                <textarea
                  value={address} onChange={e => setAddress(e.target.value)}
                  rows={3} placeholder="House No, Street, Area, City, Pincode"
                  className={`${inp(detailErrors.address)} resize-none`}
                />
                {detectErr && <p className="text-yellow-600 text-xs mt-1">{detectErr}</p>}
                {detailErrors.address && <p className="text-red-500 text-xs mt-1">{detailErrors.address}</p>}
              </div>

              {/* Prescription Upload (Conditional) */}
              {cart.some(i => i.requiresPrescription) && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-800">
                    <FaFilePrescription className="text-xl" />
                    <h3 className="font-bold text-sm">Prescription Required</h3>
                  </div>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Some items in your cart require a valid prescription. Please upload an image or PDF.
                  </p>
                  
                  <div className="relative">
                    <input
                      type="file" accept="image/*,application/pdf"
                      id="pres-upload" className="hidden"
                      onChange={handlePrescriptionChange}
                    />
                    <label htmlFor="pres-upload" className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-dashed border-blue-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition group">
                      {prescription ? (
                        <><FaCheck className="text-green-500" /> <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{presName}</span></>
                      ) : (
                        <><FaUpload className="text-blue-400 group-hover:scale-110 transition" /> <span className="text-xs font-bold text-blue-600">Click to Upload</span></>
                      )}
                    </label>
                  </div>
                  {detailErrors.prescription && <p className="text-red-500 text-[10px] font-bold">{detailErrors.prescription}</p>}
                </div>
              )}

              {/* Summary */}
              <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Total Amount</span>
                <span className="text-blue-700 font-bold text-lg">₹{total}</span>
              </div>

              <button
                onClick={() => { if (validateDetails()) setStep("payment"); }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition"
              >
                Continue to Payment →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP: PAYMENT ── */
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans">
      <div className="max-w-lg mx-auto">
        <button onClick={() => setStep("details")} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 font-medium text-sm">
          <FaChevronLeft className="text-xs" /> Back to Delivery Details
        </button>

        {/* Delivery summary pill */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex items-start gap-3">
          <FaMapMarkerAlt className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800 text-sm">{deliveryName} · {deliveryPhone}</p>
            <p className="text-gray-500 text-sm">{address}</p>
          </div>
        </div>

        <PaymentPanel amount={total} onPay={handleCheckout} processing={isProcessing} label={`Pay ₹${total} · Place Order`} />
      </div>
    </div>
  );
};

export default Cart;
