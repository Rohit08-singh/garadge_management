
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CreditCard,
  FileText,
  Bell,
  Zap,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Drivers", path: "/drivers", icon: Users },
  { name: "Daily Register", path: "/daily-register", icon: ClipboardList },
  { name: "Payments", path: "/payments", icon: CreditCard },
  { name: "Reports", path: "/reports", icon: FileText },
  { name: "Notifications", path: "/notifications", icon: Bell },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Zap size={23} fill="white" />
            </div>
            <div>
              <h2 className="font-bold">EV Garage</h2>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          </div>

          <button onClick={onClose} className="lg:hidden">
            <X size={21} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={19} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-5">
          <p className="text-xs text-slate-500">EV Garage Management</p>
          <p className="mt-1 text-sm text-slate-300">Version 1.0</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
