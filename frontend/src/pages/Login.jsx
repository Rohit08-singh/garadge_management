
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Zap, LockKeyhole, User } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      await login({
        username: username.trim(),
        password,
      });

      toast.success("Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";

      toast.error(
        typeof message === "string" ? message : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Zap size={32} fill="white" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mt-5">
            Garage Management
          </h1>

          <p className="text-slate-500 mt-2">
            Manage your garage operations in one place
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-200">

          <h2 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h2>

          <p className="text-slate-500 text-sm mt-2 mb-7">
            Sign in to access your garage dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Username
              </label>

              <div className="relative">
                <User
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-200"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          EV Garage Management System
        </p>

      </div>
    </div>
  );
}

export default Login;
