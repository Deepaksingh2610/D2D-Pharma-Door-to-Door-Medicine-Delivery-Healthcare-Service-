import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaGoogle, FaFacebook, FaUserMd, FaPrescriptionBottleAlt, FaVial } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import logo from "../assets/logo.svg";

const Login = () => {
  const { backendLogin, adminLogin } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("user");
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    setLoginError("");

    // Check admin credentials first
    if (adminLogin(data.email, data.password)) {
      navigate("/admin-dashboard");
      return;
    }

    try {
      const userData = await backendLogin(data.email, data.password, role);
      
      if (role === "doctor" || userData.role === "doctor") navigate("/doctor-dashboard");
      else if (role === "lab" || userData.role === "lab") navigate("/lab-dashboard");
      else if (role === "pharmacy" || userData.role === "pharmacy") navigate("/pharmacy-dashboard");
      else if (role === "rider" || userData.role === "rider") navigate("/rider-dashboard");
      else navigate("/profile");
    } catch (error) {
      setLoginError(error.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 relative overflow-hidden py-6 sm:py-10">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-green-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 mx-4 sm:mx-0">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="D2D Pharma Logo" className="w-16 h-16 mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">D2D Pharma</h1>
          <h2 className="text-xl font-semibold text-gray-700 mt-4">Welcome Back!</h2>
          <p className="text-sm text-gray-500">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          {/* Email */}
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <MdEmail className="text-xl" />
              </span>
              <input
                type="email"
                placeholder="Email Address"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all placeholder-gray-400 text-gray-700 bg-gray-50/50
                  ${errors.email ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-500 focus:border-transparent"}`}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaLock className="text-lg" />
              </span>
              <input
                type="password"
                placeholder="Password"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all placeholder-gray-400 text-gray-700 bg-gray-50/50
                  ${errors.password ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-500 focus:border-transparent"}`}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Login As:</p>
            <div className="grid grid-cols-5 gap-2">
              <RoleCard label="User" icon={<FaUser className="text-xl" />} active={role === "user"} onClick={() => setRole("user")} />
              <RoleCard label="Doctor" icon={<FaUserMd className="text-xl" />} active={role === "doctor"} onClick={() => setRole("doctor")} />
              <RoleCard label="Pharmacy" icon={<FaPrescriptionBottleAlt className="text-xl" />} active={role === "pharmacy"} onClick={() => setRole("pharmacy")} />
              <RoleCard label="Lab" icon={<FaVial className="text-xl" />} active={role === "lab"} onClick={() => setRole("lab")} />
              <RoleCard label="Rider" icon={<span className="text-xl">🛵</span>} active={role === "rider"} onClick={() => setRole("rider")} />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" className="text-sm text-green-600 font-medium hover:underline">
              Forgot Password?
            </button>
          </div>

          {loginError && (
            <p className="text-red-500 text-sm text-center bg-red-50 border border-red-200 rounded-lg py-2">{loginError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">Or Login with</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div className="space-y-3 mt-4">
            <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm">
              <FaGoogle className="text-red-500 text-xl" />
              <span>Continue with Google</span>
            </button>
            <button className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-2.5 rounded-lg hover:bg-[#166fe5] transition font-medium shadow-sm">
              <FaFacebook className="text-white text-xl" />
              <span>Continue with Facebook</span>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          New to D2D Pharma?{" "}
          <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
            Sign Up Here
          </Link>
        </p>
      </div>
    </div>
  );
};

/* Role Card Component */
const RoleCard = ({ label, icon, active, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
      ${active ? "bg-green-50 border-green-500 text-green-700 shadow-sm transform scale-105" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300"}`}
  >
    <div className={`mb-1 ${active ? "text-green-600" : "text-gray-400"}`}>{icon}</div>
    <span className="text-xs font-medium text-center">{label}</span>
  </div>
);

export default Login;
