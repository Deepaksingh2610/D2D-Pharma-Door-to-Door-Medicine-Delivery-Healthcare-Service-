import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLocation } from "../context/LocationContext";
import { useAuth } from "../context/AuthContext";
import {
  FaMapMarkerAlt,
  FaSearch,
  FaUserMd,
  FaPills,
  FaFlask,
  FaShippingFast
} from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const { location, updateLocation, autoDetectLocation, detecting } = useLocation();
  const { getAllPartners } = useAuth();
  const [activeTab, setActiveTab] = useState("medicines"); // medicines, doctors, labs
  const [searchText, setSearchText] = useState("");
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const data = await getAllPartners();
        setPartners(Array.isArray(data) ? data.filter(p => p.approved) : []);
      } catch (err) {
        console.error("Home fetchPartners error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [getAllPartners]);

  // Categorize for the carousel
  const doctorsList = partners.filter(p => p.role === "doctor");
  const storesList = partners.filter(p => p.role === "pharmacy");
  const labsList = partners.filter(p => p.role === "lab");

  // Merge for the circular display
  const allCards = [
    ...doctorsList.map(d => ({ ...d, type: "doctor", title: `Dr. ${d.name}`, sub: d.specialty, price: `₹${d.fees}`, link: "/doctors" })),
    ...storesList.map(s => ({ ...s, type: "pharmacy", title: s.storeName, sub: "Pharmacy Store", price: "Quick Delivery", link: "/medicines" })),
    ...labsList.map(l => ({ ...l, type: "lab", title: l.labName, sub: "Diagnostic Lab", price: "Book Test", link: "/lab-tests" }))
  ];

  // If few partners, duplicate dummy-style placeholders to keep the carousel moving nicely
  const displayCards = allCards.length > 5 ? [...allCards, ...allCards] : [...allCards, ...allCards, ...allCards];

  const handleCardClick = (link) => {
    navigate(link);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === "medicines") navigate("/medicines");
    if (activeTab === "doctors") navigate("/doctors");
    if (activeTab === "labs") navigate("/lab-tests");
  };

  const handleAreaChange = (e) => {
    updateLocation({ ...location, area: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden">
      {/* Animation Styles */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-250px * ${allCards.length || 5})); }
        }
        .carousel-track {
          display: flex;
          width: calc(250px * ${displayCards.length});
          animation: scroll 30s linear infinite;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ================= HERO SECTION ================= */}
      <div className="bg-gradient-to-r from-blue-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 md:pt-20 md:pb-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">

            {/* Left Content */}
            <div className="w-full md:w-1/2 space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Your Health, <br />
                <span className="text-blue-600">Delivered to Your Doorstep</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Consult Doctors, Order Medicines & Book Lab Tests in <span className="font-bold text-gray-800">{location?.city || "your city"}</span>.
                Experience the best healthcare services at home.
              </p>

              {/* SEARCH BOX CONTAINER */}
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mt-8 w-full max-w-xl border border-gray-100">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 mb-6">
                  <button
                    onClick={() => setActiveTab("medicines")}
                    className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-all 
                      ${activeTab === "medicines" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <FaPills /> Medicines
                  </button>
                  <button
                    onClick={() => setActiveTab("doctors")}
                    className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-all 
                      ${activeTab === "doctors" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <FaUserMd /> Doctors
                  </button>
                  <button
                    onClick={() => setActiveTab("labs")}
                    className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-all 
                      ${activeTab === "labs" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <FaFlask /> Lab Tests
                  </button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex flex-col gap-4">
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={location?.area || ""}
                      onChange={handleAreaChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-700 appearance-none cursor-pointer"
                    >
                      <option value="">{location?.city ? `All Areas in ${location.city}` : "Select Area"}</option>
                      {location?.area && location.area !== "All Areas" && (
                        <option value={location.area}>{location.area}</option>
                      )}
                    </select>
                    {!location?.city && (
                      <button
                        type="button"
                        onClick={autoDetectLocation}
                        disabled={detecting}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        {detecting ? "Detecting…" : "Auto-Detect"}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search ${activeTab === 'medicines' ? 'medicines...' : activeTab === 'doctors' ? 'doctors...' : 'lab tests'}`}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-blue-200">
                      Explore
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="w-full md:w-1/2 justify-center md:justify-end hidden md:flex">
              <div className="relative">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
                <div className="absolute top-0 -left-4 w-64 h-64 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-700"></div>
                <img
                  src="https://img.freepik.com/free-vector/online-doctor-consultation-illustration_88138-414.jpg?w=826"
                  alt="Healthcare Services"
                  className="relative z-10 w-full max-w-[500px] h-auto object-contain drop-shadow-2xl rounded-3xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SERVICE CARDS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <ServiceCard to="/doctors" title="Consult Doctor" desc="Book Online" icon={<FaUserMd className="text-blue-500" />} color="border-blue-100 hover:border-blue-400" />
          <ServiceCard to="/medicines" title="Medicines" desc="Fast Delivery" icon={<FaPills className="text-green-500" />} color="border-green-100 hover:border-green-400" />
          <ServiceCard to="/lab-tests" title="Lab Tests" desc="Home Sample" icon={<FaFlask className="text-cyan-500" />} color="border-cyan-100 hover:border-cyan-400" />
          <ServiceCard to="/medicines" title="Instant Care" desc="Best Service" icon={<FaShippingFast className="text-orange-500" />} color="border-orange-100 hover:border-orange-400" />
        </div>
      </div>

      {/* ================= ANIMATED CAROUSEL SECTION ================= */}
      <div className="py-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">
            Popular <span className="text-blue-600">Healthcare Partners</span>
          </h2>
          <p className="text-gray-500 font-medium">Verified expertise at your fingertips</p>
        </div>

        <div className="relative overflow-hidden group">
          <div className="carousel-track py-4">
            {displayCards.map((card, i) => (
              <div 
                key={i} 
                onClick={() => handleCardClick(card.link)}
                className="w-[250px] flex-shrink-0 px-3 cursor-pointer"
              >
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group/card h-full">
                  <div className="relative mb-4">
                    <div className="w-full h-40 rounded-2xl bg-gray-50 overflow-hidden">
                      <img 
                        src={card.profilePhoto || card.storePhoto || card.labPhoto || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300"} 
                        alt={card.title} 
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className={`absolute top-2 left-2 text-[10px] font-black uppercase px-2 py-1 rounded-full text-white shadow-lg
                      ${card.type === 'doctor' ? 'bg-blue-600' : card.type === 'pharmacy' ? 'bg-green-600' : 'bg-cyan-600'}`}>
                      {card.type}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 line-clamp-1 group-hover/card:text-blue-600 transition-colors">{card.title}</h3>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-3 leading-tight">{card.sub}</p>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <span className="text-sm font-black text-gray-700">{card.price}</span>
                    <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-blue-600 group-hover/card:bg-blue-600 group-hover/card:text-white transition-all">
                      <FaSearch className="text-xs" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

/* Component: Service Card */
const ServiceCard = ({ to, title, desc, icon, color }) => (
  <Link to={to} className={`bg-white p-6 rounded-2xl shadow-sm border ${color} hover:shadow-lg transition-all transform hover:-translate-y-1 group`}>
    <div className="mb-4 bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    <p className="text-gray-500 text-sm mt-1">{desc}</p>
    <div className="mt-4 text-blue-600 font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      Explore Now <span>→</span>
    </div>
  </Link>
);

/* Component: Promo Card */
const PromoCard = ({ title, subtitle, price, img, tag }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
    <div className="h-48 overflow-hidden relative">
      <img src={img} alt={title} className="w-full h-full object-cover hover:scale-105 transition duration-500" />
      {tag && <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">{tag}</span>}
    </div>
    <div className="p-4">
      <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
      <div className="flex justify-between items-center mt-4">
        <span className="text-blue-600 font-bold text-xl">{price}</span>
        <button className="text-sm font-medium border border-blue-600 text-blue-600 px-4 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition">
          Book
        </button>
      </div>
    </div>
  </div>
);

export default Home;


