import { useState, useMemo, useEffect } from "react";
import { useAppointment } from "../context/AppointmentContext";
import { useMedical } from "../context/MedicalContext";
import { useCart } from "../context/CartContext";
import { FaArrowLeft, FaPlus, FaPills, FaStore, FaSearch, FaFilter, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Medicines = () => {
  const { medical, selectMedical } = useMedical();
  const { medicines: allMedicines, getMedicinesByStore, fetchAllMedicines } = useAppointment();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllMedicines();
  }, []);

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState(medical?.email || "all");

  // Get unique pharmacies that have medicines
  const pharmacies = useMemo(() => {
    const unique = {};
    allMedicines.forEach(m => {
      if (m.storeEmail && m.storeName) {
        unique[m.storeEmail] = m.storeName;
      }
    });
    return Object.entries(unique).map(([email, name]) => ({ email, name }));
  }, [allMedicines]);

  // Combined logic for filtering medicines
  const filteredMedicines = useMemo(() => {
    let list = selectedPharmacy === "all" ? allMedicines : getMedicinesByStore(selectedPharmacy);
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(m => 
        m.name.toLowerCase().includes(term) || 
        m.type?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [allMedicines, selectedPharmacy, searchTerm, getMedicinesByStore]);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto">
        <button 
          onClick={() => { selectMedical(null); navigate(-1); }} 
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
        >
          <FaArrowLeft /> Back
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-3xl shadow-lg shadow-green-100">
                <FaPills />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {selectedPharmacy !== "all" ? pharmacies.find(p => p.email === selectedPharmacy)?.name : "All Medicines"}
                </h1>
                <p className="text-gray-500 mt-1">
                  Discover and order medicines from top pharmacies near you
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 px-4 py-2 rounded-2xl">
              <span className="text-green-700 font-bold text-lg">{filteredMedicines.length}</span>
              <span className="text-green-600/70 text-sm font-medium">Items available</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Search Bar */}
          <div className="lg:col-span-2 relative group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by medicine name, type (e.g. Syrup, Tablet)..."
              className="w-full pl-12 pr-10 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-50 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Pharmacy Filter */}
          <div className="relative">
            <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-50 transition-all shadow-sm appearance-none cursor-pointer"
              value={selectedPharmacy}
              onChange={(e) => {
                setSelectedPharmacy(e.target.value);
                if (e.target.value === "all") selectMedical(null);
                else {
                  const p = pharmacies.find(item => item.email === e.target.value);
                  if (p) selectMedical({ email: p.email, name: p.name });
                }
              }}
            >
              <option value="all">All Pharmacies</option>
              {pharmacies.map(p => (
                <option key={p.email} value={p.email}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Medicine Grid */}
        {filteredMedicines.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaPills className="text-4xl text-gray-200" />
            </div>
            <h3 className="text-xl text-gray-800 font-bold mb-2">No medicines found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We couldn't find any results matching your search or filters. Try adjusting them.
            </p>
            <button 
              onClick={() => { setSearchTerm(""); setSelectedPharmacy("all"); selectMedical(null); }}
              className="mt-6 text-green-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredMedicines.map((m) => (
              <div
                key={m._id || m.id}
                className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col h-full"
              >
                {/* Image Section */}
                <div className="relative mb-3 bg-gray-50 rounded-xl aspect-square overflow-hidden border border-gray-50">
                  {m.imageURL || m.image ? (
                    <img 
                      src={m.imageURL || m.image} 
                      alt={m.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-green-200 bg-gradient-to-br from-green-50 to-white">
                      <FaPills className="text-3xl" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[8px] font-bold text-gray-600 uppercase tracking-widest border border-gray-100">
                    {m.type}
                  </div>
                  {m.discount > 0 && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-1.5 py-0.5 rounded-md text-[8px] font-bold shadow-lg shadow-orange-100">
                      {m.discount}% OFF
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 mb-1 leading-tight">
                    {m.name}
                  </h3>
                  <div className="flex flex-col gap-0.5 mb-3">
                    {m.companyName && (
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight truncate">
                        {m.companyName}
                      </p>
                    )}
                    {m.storeName && (
                      <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1 truncate">
                        <FaStore className="text-[8px]" /> {m.storeName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 flex-wrap">
                       <span className="text-base font-black text-gray-900">₹{m.discount > 0 ? (m.price * (1 - m.discount/100)).toFixed(0) : m.price}</span>
                       {m.discount > 0 && <span className="text-[10px] text-gray-400 line-through">₹{m.price}</span>}
                    </div>
                    <span className="text-[8px] text-gray-400 font-medium">incl. taxes</span>
                  </div>
                  <button
                    onClick={() => addToCart({ ...m, type: "medicine", finalPrice: m.discount > 0 ? (m.price * (1 - m.discount/100)).toFixed(0) : m.price })}
                    className="bg-green-600 hover:bg-green-700 active:scale-95 text-white w-9 h-9 rounded-xl flex items-center justify-center transition shadow-lg shadow-green-100 group"
                    title="Add to Cart"
                  >
                    <FaPlus className="text-xs group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Medicines;
