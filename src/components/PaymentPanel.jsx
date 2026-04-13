/**
 * PaymentPanel — Shared payment UI used across:
 *   Appointment booking (Doctor), Lab Test booking, Cart checkout
 *
 * Props:
 *   amount     {number}   Total payable amount in ₹
 *   onPay      {fn}       Called with { method, detail } when user confirms
 *   processing {bool}     Show processing spinner
 *   label      {string}   Button label (default: "Pay ₹{amount}")
 */
import { useState } from "react";
import {
  FaCreditCard, FaUniversity, FaMobileAlt, FaMoneyBillWave,
  FaChevronDown, FaCheckCircle, FaLock
} from "react-icons/fa";
import { SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";

const METHODS = [
  { id: "card",        label: "Credit / Debit Card", icon: <FaCreditCard className="text-blue-600" /> },
  { id: "upi",         label: "UPI (ID / QR)",       icon: <FaMobileAlt className="text-indigo-600" /> },
  { id: "googlepay",   label: "Google Pay",           icon: <SiGooglepay className="text-blue-500" /> },
  { id: "phonepay",    label: "PhonePe",              icon: <SiPhonepe className="text-violet-600" /> },
  { id: "paytm",       label: "Paytm",                icon: <SiPaytm className="text-sky-600" /> },
  { id: "netbanking",  label: "Net Banking",          icon: <FaUniversity className="text-gray-600" /> },
  { id: "cod",         label: "Cash on Delivery",     icon: <FaMoneyBillWave className="text-green-600" /> },
];

const BANKS = [
  "SBI – State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
  "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda",
  "Canara Bank", "Union Bank of India", "Yes Bank", "IDFC First Bank",
];

const PaymentPanel = ({ amount = 0, onPay, processing = false, label }) => {
  const [method, setMethod] = useState("upi");
  const API = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  // Card fields
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardType, setCardType] = useState("debit");

  // UPI fields
  const [upiId, setUpiId] = useState("");

  // Net banking
  const [bank, setBank] = useState("");

  // UPI app (GPay/PhonePe/Paytm)
  const [upiLinkedNum, setUpiLinkedNum] = useState("");

  const [errors, setErrors] = useState({});

  const fmtCard = (v) => v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const fmtExpiry = (v) => {
    const d = v.replace(/\D/g, "");
    if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2, 4)}`;
    return d;
  };

  const validate = () => {
    const e = {};
    if (method === "card") {
      if (!cardNum || cardNum.replace(/\s/g, "").length < 16) e.cardNum = "Enter valid 16-digit card number";
      if (!cardName.trim()) e.cardName = "Cardholder name required";
      if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) e.expiry = "Enter valid MM/YY";
      if (!cvv || cvv.length < 3) e.cvv = "Enter valid CVV";
    }
    if (method === "upi") {
      if (!upiId.trim() || !upiId.includes("@")) e.upiId = "Enter valid UPI ID (e.g. name@upi)";
    }
    if (method === "netbanking") {
      if (!bank) e.bank = "Select a bank";
    }
    if (method === "googlepay" || method === "phonepay" || method === "paytm") {
      if (!upiLinkedNum.trim() || !/^[6-9]\d{9}$/.test(upiLinkedNum.replace(/\D/g, "")))
        e.upiLinkedNum = "Enter valid 10-digit mobile number linked to this app";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;

    // Simulate payment processing
    setTimeout(() => {
      onPay({ 
        method: method, 
        detail: { 
          transactionId: "txn_" + Math.random().toString(36).substring(7),
          status: "success"
        } 
      });
    }, 1000);
  };

  const selectedMeta = METHODS.find(m => m.id === method);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Amount banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
        <div>
          <p className="text-xs opacity-80">Amount Payable</p>
          <p className="text-2xl font-bold tracking-tight">₹{amount.toLocaleString("en-IN")}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs opacity-75">
          <FaLock className="text-[10px]" /> Secure Payment
        </div>
      </div>

      {/* Method selection */}
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Choose Payment Method</p>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map(m => (
            <button key={m.id} type="button" onClick={() => { setMethod(m.id); setErrors({}); }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all
                ${method === m.id
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
              <span className="text-lg flex-shrink-0">{m.icon}</span>
              <span className="text-xs leading-tight">{m.label}</span>
              {method === m.id && <FaCheckCircle className="ml-auto text-blue-500 text-xs flex-shrink-0" />}
            </button>
          ))}
        </div>

        {/* ── Card fields ── */}
        {method === "card" && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              {["debit", "credit"].map(t => (
                <button key={t} type="button" onClick={() => setCardType(t)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition
                    ${cardType === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  {t === "debit" ? "Debit Card" : "Credit Card"}
                </button>
              ))}
            </div>
            <div>
              <input value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))} placeholder="Card Number *" maxLength={19}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 tracking-widest" />
              {errors.cardNum && <p className="text-red-500 text-xs mt-1">{errors.cardNum}</p>}
            </div>
            <div>
              <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Name on Card *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input value={expiry} onChange={e => setExpiry(fmtExpiry(e.target.value))} placeholder="MM/YY *" maxLength={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 tracking-widest" />
                {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
              </div>
              <div>
                <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="CVV *" type="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 flex items-center gap-1"><FaLock className="text-[9px]" /> Your card details are encrypted and secure.</p>
          </div>
        )}

        {/* ── UPI fields ── */}
        {method === "upi" && (
          <div className="mt-4 space-y-3">
            <div>
              <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="Enter UPI ID (e.g. yourname@okaxis) *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              {errors.upiId && <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>}
            </div>
            <p className="text-[10px] text-gray-400">Supports all UPI apps: Google Pay, PhonePe, Paytm, BHIM, etc.</p>
          </div>
        )}

        {/* ── Google Pay / PhonePe / Paytm ── */}
        {(method === "googlepay" || method === "phonepay" || method === "paytm") && (
          <div className="mt-4 space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
              <span className="text-3xl">{selectedMeta?.icon}</span>
              <div>
                <p className="font-bold text-gray-800 text-sm">{selectedMeta?.label}</p>
                <p className="text-xs text-gray-500">Enter mobile number linked to your {selectedMeta?.label} account</p>
              </div>
            </div>
            <div>
              <input value={upiLinkedNum} onChange={e => setUpiLinkedNum(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Linked Mobile Number *" type="tel"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              {errors.upiLinkedNum && <p className="text-red-500 text-xs mt-1">{errors.upiLinkedNum}</p>}
            </div>
          </div>
        )}

        {/* ── Net Banking ── */}
        {method === "netbanking" && (
          <div className="mt-4">
            <select value={bank} onChange={e => setBank(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-700">
              <option value="">Select Your Bank *</option>
              {BANKS.map(b => <option key={b}>{b}</option>)}
            </select>
            {errors.bank && <p className="text-red-500 text-xs mt-1">{errors.bank}</p>}
          </div>
        )}

        {/* ── COD ── */}
        {method === "cod" && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            <p className="font-bold flex items-center gap-2"><FaMoneyBillWave /> Cash on Delivery</p>
            <p className="text-xs mt-1 text-green-700">Pay ₹{amount.toLocaleString("en-IN")} in cash when your order/service is delivered.</p>
          </div>
        )}

        {/* Pay Button */}
        <button type="button" onClick={handlePay} disabled={processing}
          className={`w-full mt-5 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm shadow-md transition
            ${processing ? "bg-gray-400 cursor-wait" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95"}`}>
          {processing
            ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Processing...</>
            : <><FaLock className="text-xs" /> {label || `Pay ₹${amount.toLocaleString("en-IN")}`}</>}
        </button>

        <p className="text-center text-[10px] text-gray-400 mt-2 flex items-center justify-center gap-1">
          <FaLock className="text-[9px]" /> 256-bit SSL encrypted · Payments processed securely
        </p>
      </div>
    </div>
  );
};

export default PaymentPanel;
