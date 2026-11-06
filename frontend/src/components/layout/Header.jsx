
import { Menu, LogOut, UserCircle } from "lucide-react";
import useAuth from "../../hooks/useAuth";

function Header({ onMenuClick }) {
  const { user, logout } = useAuth();

  const displayName =
    user?.full_name || user?.username || "Garage User";

  const role = user?.role || "User";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={23} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-900">
            EV Garage Management
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Manage your daily garage operations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            {displayName}
          </p>
          <p className="text-xs capitalize text-slate-500">{role}</p>
        </div>

        <UserCircle size={30} className="text-slate-500" />

        <button
          onClick={logout}
          title="Logout"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
