import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logo from "./Images/Hams.png";
import { supabase } from "./lib/supabase";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    });
    setShowPassword(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;

        navigate("/dashboard/home");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              first_name: form.firstName,
              last_name: form.lastName,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          navigate("/dashboard/home");
          return;
        }

        setSuccessMsg(
          "Account created. Please check your active email address and verify the account before signing in.",
        );
        setIsLogin(true);
        resetForm();
      }
    } catch (error) {
      setErrorMsg(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans overflow-x-hidden">
      <header className="bg-white shadow-sm py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div
            className="flex items-center gap-2 md:gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-teal-50 flex items-center justify-center shadow-sm">
              <img
                src={logo}
                alt="Logo"
                className="w-15 h-15 md:w-12 md:h-12 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-teal-600">LearnLoop</h1>
          </div>

          <button
            onClick={() => navigate("/")}
            className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-600 transition-colors"
          >
            Home
          </button>
        </div>
      </header>

      <div className="grow flex items-center justify-center p-4 md:p-10">
        <div className="relative w-full max-w-5xl min-h-137.5 md:min-h-150 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div
            className={`w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-6 md:p-12 transition-all duration-700 ease-in-out z-10 ${
              !isLogin ? "md:translate-x-full" : ""
            }`}
          >
            <form onSubmit={handleAuth} className="w-full max-w-sm text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-teal-600 mb-6 md:mb-8">
                {isLogin ? "Sign In" : "Create Account"}
              </h2>

              {errorMsg && (
                <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMsg}
                </p>
              )}

              <div className="space-y-3 md:space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <input
                      required
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full px-5 py-3 md:py-4 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-400 text-sm md:text-base"
                    />
                    <input
                      required
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full px-5 py-3 md:py-4 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-400 text-sm md:text-base"
                    />
                  </div>
                )}

                <div className="text-left">
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Active Email Address"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-5 py-3 md:py-4 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-400 text-sm md:text-base"
                  />
                  {!isLogin && (
                    <p className="mt-2 text-xs text-gray-500">
                      Use an email address the student can access for
                      verification and password recovery.
                    </p>
                  )}
                </div>

                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-5 py-3 md:py-4 pr-14 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-400 text-sm md:text-base"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600 transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {isLogin && (
                  <div className="w-full text-right">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-teal-500 text-white w-full py-3 md:py-4 rounded-xl font-bold hover:bg-teal-600 shadow-lg mt-4 transition-all active:scale-95 text-sm md:text-base disabled:opacity-60"
                >
                  {loading ? "PLEASE WAIT..." : isLogin ? "SIGN IN" : "SIGN UP"}
                </button>
              </div>
            </form>
          </div>

          <div
            className={`w-full md:w-1/2 flex-1 md:flex-none bg-teal-500 text-white flex flex-col justify-center items-center text-center p-8 md:p-10 transition-all duration-700 ease-in-out z-20 ${
              !isLogin ? "md:-translate-x-full" : ""
            }`}
          >
            <div className="max-w-xs">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">
                {isLogin ? "Hello, Friend!" : "Welcome Back!"}
              </h2>

              <p className="mb-8 md:mb-10 text-sm md:text-lg opacity-90">
                {isLogin
                  ? "Enter your details to start your journey with us"
                  : "To keep connected with us please login with your info"}
              </p>

              <button
                onClick={() => {
                  clearMessages();
                  resetForm();
                  setIsLogin(!isLogin);
                }}
                className="border-2 border-white px-8 md:px-12 py-2 md:py-3 rounded-full font-bold hover:bg-white hover:text-teal-500 transition-all text-sm md:text-base active:scale-95"
              >
                {isLogin ? "SIGN UP" : "SIGN IN"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
