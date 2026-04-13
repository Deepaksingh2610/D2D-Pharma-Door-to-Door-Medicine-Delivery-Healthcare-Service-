import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn, FaPhoneAlt, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  const { addCallbackRequest } = useAuth();
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleCallback = () => {
    if (phone.length < 10) {
      alert("Please enter a valid 10-digit number.");
      return;
    }
    addCallbackRequest(phone);
    setPhone("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <footer className="bg-[#050b1a] relative pt-12 pb-8 overflow-hidden font-sans text-gray-400">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2" />

      {/* ================= CALLBACK SECTION (Glassmorphism) ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 mb-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h2 className="text-white text-xl md:text-2xl font-bold mb-1 tracking-tight">
                Get a <span className="text-blue-400">Callback</span>
              </h2>
              <p className="text-gray-400 text-sm max-w-lg">
                Our Health Advisors are ready to assist you. Enter your number below and we'll reach out shortly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full lg:w-auto">
              {submitted ? (
                <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  Your request has been sent! We'll call you soon.
                </div>
              ) : (
                <>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10 digit number"
                    className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm
                               placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner w-full sm:w-64"
                  />
                  <button
                    onClick={handleCallback}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm
                               transition-all active:scale-[0.98] whitespace-nowrap"
                  >
                    Call Me Back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MAIN FOOTER CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Main Card-like Container */}
        <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-[32px] p-8 md:p-10 mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            
            {/* Column 1: Brand & About */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">D</div>
                <h3 className="text-xl font-bold text-white tracking-tight font-sans">D2D Pharma</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed max-w-[240px]">
                D2D Pharma connects users with top medical advisors providing quality healthcare solutions and medications directly to your door.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { icon: <FaFacebookF />, color: "hover:bg-blue-600" },
                  { icon: <FaInstagram />, color: "hover:bg-pink-600" },
                  { icon: <FaTwitter />, color: "hover:bg-blue-400" },
                  { icon: <FaLinkedinIn />, color: "hover:bg-blue-700" }
                ].map((s, idx) => (
                  <button key={idx} className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 text-xs ${s.color} hover:text-white transition-all duration-300`}>
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Useful Links */}
            <div className="lg:pl-4">
              <h4 className="text-white font-bold text-base mb-4 relative inline-block">
                Useful Links
                <span className="absolute -bottom-1.5 left-0 w-6 h-[2px] bg-blue-500 rounded-full" />
              </h4>
              <ul className="space-y-2.5">
                {['Home', 'About Us', 'Contact Us', 'Terms & Conditions'].map((link) => (
                  <li key={link}>
                    <Link to="/" className="text-gray-400 hover:text-white text-xs transition-colors flex items-center group">
                      <span className="w-0 group-hover:w-1.5 h-[1px] bg-blue-500 mr-0 group-hover:mr-1.5 transition-all" />
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact Info */}
            <div>
              <h4 className="text-white font-bold text-base mb-4 relative inline-block">
                Contact Info
                <span className="absolute -bottom-1.5 left-0 w-6 h-[2px] bg-blue-500 rounded-full" />
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-gray-400 group">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <FaPhoneAlt size={12} />
                  </div>
                  <span className="text-xs">+91-7722004333</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-400 group">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <FaEnvelope size={12} />
                  </div>
                  <span className="text-xs">support@d2dpharma.com</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5">
                <p className="text-gray-500 text-[10px] leading-relaxed">
                  © 2024 D2D Pharma.<br />All rights reserved.
                </p>
              </div>
            </div>

            {/* Column 4: App Download */}
            <div>
              <h4 className="text-white font-bold text-base mb-4 relative inline-block">
                Download App
                <span className="absolute -bottom-1.5 left-0 w-6 h-[2px] bg-blue-500 rounded-full" />
              </h4>
              <div className="flex flex-col gap-2.5">
                <button className="bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl px-4 py-2 transition-colors group flex items-center justify-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="h-6 group-hover:scale-105 transition-transform" />
                </button>
                <button className="bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl px-4 py-2 transition-colors group flex items-center justify-center">
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-6 group-hover:scale-105 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM BAR ================= */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] font-medium">
            <span className="text-white font-bold opacity-80">D2D Pharma</span>
            <span className="mx-2">|</span>
            <span>© 2024 All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-500 hover:text-white text-[10px] uppercase font-bold transition-colors">Privacy Policy</Link>
            <Link to="/" className="text-gray-500 hover:text-white text-[10px] uppercase font-bold transition-colors">Refund Policy</Link>
            <Link to="/" className="text-gray-500 hover:text-white text-[10px] uppercase font-bold transition-colors">Shipping Policy</Link>
          </div>

          <div className="flex items-center gap-3">
             {[<FaFacebookF />, <FaInstagram />, <FaTwitter />, <FaLinkedinIn />].map((icon, i) => (
                <button key={i} className="text-gray-500 hover:text-white transition-colors text-xs">
                  {icon}
                </button>
             ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;




