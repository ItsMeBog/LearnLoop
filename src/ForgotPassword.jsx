import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logo from "./Images/Hams.png";
import { supabase } from "./lib/supabase";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setErrorMsg("");
        setSuccessMsg("Recovery verified. You can now set a new password.");
      }
    });

    const hash = window.location.hash;
    const search = window.location.search;

    const hasRecoveryTokens =
      hash.includes("access_token") ||
      hash.includes("refresh_token") ||
      hash.includes("type=recovery") ||
      search.includes("type=recovery");

    if (hasRecoveryTokens) {
      setRecoveryMode(true);
      setSuccessMsg("Recovery verified. You can now set a new password.");
    }

    return () => subscription.unsubscribe();
  }, []);

  const sendResetLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/forgot-password`,
      });

      if (error) throw error;

      setSuccessMsg(
        "Password reset link sent. Please check your email and open the link to continue.",
      );
    } catch (error) {
      setErrorMsg(error.message || "Failed to send password reset link.");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMsg("Password updated successfully. Please sign in again.");
      await supabase.auth.signOut();

      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setErrorMsg(error.message || "Failed to update password.");
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
            onClick={() => navigate("/login")}
            className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </header>

      <div className="grow flex items-center justify-center p-4 md:p-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl font-extrabold text-teal-600 text-center mb-6">
            Forgot Password
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

          {!recoveryMode ? (
            <form onSubmit={sendResetLink} className="space-y-4">
              <input
                required
                type="email"
                placeholder="Enter your active email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-400 text-sm md:text-base"
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-teal-500 text-white w-full py-4 rounded-xl font-bold hover:bg-teal-600 shadow-lg transition-all disabled:opacity-60"
              >
                {loading ? "SENDING..." : "SEND RESET LINK"}
              </button>
            </form>
          ) : (
            <form onSubmit={updatePassword} className="space-y-4">
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-5 py-4 pr-14 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-400 text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-4 pr-14 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-400 text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-teal-500 text-white w-full py-4 rounded-xl font-bold hover:bg-teal-600 shadow-lg transition-all disabled:opacity-60"
              >
                {loading ? "UPDATING..." : "UPDATE PASSWORD"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
