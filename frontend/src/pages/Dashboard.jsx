
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, UserCheck, Clock, Wallet, IndianRupee,
  AlertCircle, RefreshCw, ArrowUpRight, CalendarDays
} from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const StatCard = ({ title, value, icon: Icon, color, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h2 className="mt-2 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
          {value}
        </h2>
        <p className="mt-2 text-xs text-slate-500">{description}</p>
      </div>
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not load dashboard. Please check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = [
    {
      title: "Total Drivers",
      value: summary?.total_drivers ?? 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      description: "Registered drivers",
    },
    {
      title: "Present Today",
      value: summary?.present_drivers ?? 0,
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600",
      description: "Drivers marked present",
    },
    {
      title: "Not Arrived",
      value: summary?.not_arrived_drivers ?? 0,
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      description: "Awaiting arrival",
    },
    {
      title: "Total Charging Fees",
      value: money(summary?.total_charging_fees),
      icon: Wallet,
      color: "bg-violet-50 text-violet-600",
      description: "Fees recorded",
    },
    {
      title: "Verified Collection",
      value: money(summary?.verified_collection),
      icon: IndianRupee,
      color: "bg-green-50 text-green-600",
      description: "Payments approved",
    },
    {
      title: "Pending Payments",
      value: money(summary?.pending_payments),
      icon: AlertCircle,
      color: "bg-orange-50 text-orange-600",
      description: "Awaiting confirmation",
    },
    {
      title: "Outstanding Balance",
      value: money(summary?.outstanding_balance),
      icon: Wallet,
      color: "bg-rose-50 text-rose-600",
      description: "Amount still due",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Overview</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening at your garage.
          </p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <CalendarDays className="shrink-0 text-blue-600" size={22} />
        <div>
          <p className="text-sm font-semibold text-slate-800">Garage overview</p>
          <p className="text-xs text-slate-600">
            Check attendance, charging fees and payment status.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button onClick={loadDashboard} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading dashboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Jump directly to your daily garage work.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Manage Drivers", path: "/drivers", detail: "Add or update drivers" },
            { label: "Open Daily Register", path: "/daily-register", detail: "Mark attendance and fees" },
            { label: "Review Payments", path: "/payments", detail: "Check submitted payments" },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div>
                <p className="font-semibold text-slate-800">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
              </div>
              <ArrowUpRight
                size={18}
                className="text-slate-400 group-hover:text-blue-600"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
