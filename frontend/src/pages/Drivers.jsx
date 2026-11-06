
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Search, Plus, Pencil, UserX, X, Users, RefreshCw
} from "lucide-react";
import { driversApi } from "../api/drivers.api";

const emptyForm = {
  full_name: "",
  phone: "",
  address: "",
  notes: "",
};

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await driversApi.getDrivers({ search: search.trim() });
      const list = Array.isArray(data)
        ? data
        : data?.drivers ?? data?.items ?? data?.results ?? [];
      setDrivers(list);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadDrivers, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openAdd = () => {
    setEditingDriver(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (driver) => {
    setEditingDriver(driver);
    setForm({
      full_name: driver.full_name || "",
      phone: driver.phone || "",
      address: driver.address || "",
      notes: driver.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error("Driver name and phone are required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      };

      if (editingDriver) {
        const id = editingDriver.id ?? editingDriver.driver_id;
        await driversApi.updateDriver(id, payload);
        toast.success("Driver updated successfully");
      } else {
        await driversApi.createDriver(payload);
        toast.success("Driver added successfully");
      }

      setModalOpen(false);
      setForm(emptyForm);
      await loadDrivers();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "Could not save driver. Please check the details."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (driver) => {
    const id = driver.id ?? driver.driver_id;
    if (!id) {
      toast.error("Driver ID is missing");
      return;
    }

    if (!window.confirm(`Deactivate ${driver.full_name}?`)) return;

    try {
      await driversApi.deactivateDriver(id);
      toast.success("Driver deactivated");
      await loadDrivers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to deactivate driver");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Garage management</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Drivers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage registered drivers and their details.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
        >
          <Plus size={18} /> Add Driver
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Users size={17} /> {drivers.length} drivers
          </span>
          <button
            onClick={loadDrivers}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            title="Refresh drivers"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Driver list</h2>
          <p className="mt-1 text-xs text-slate-500">
            Driver information and account status
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading drivers...
          </div>
        ) : drivers.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto text-slate-300" size={35} />
            <p className="mt-3 font-semibold text-slate-700">No drivers found</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first driver or try another search.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile driver cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {drivers.map((driver) => {
                const id = driver.id ?? driver.driver_id;
                const active = driver.is_active !== false;
                return (
                  <div key={id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-900">
                          {driver.full_name || "Unnamed driver"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {driver.phone || "No phone number"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {driver.address || "No address provided"}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => openEdit(driver)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700"
                      >
                        <Pencil size={15} /> Edit
                      </button>
                      {active && (
                        <button
                          onClick={() => handleDeactivate(driver)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 py-2 text-sm font-medium text-red-600"
                        >
                          <UserX size={15} /> Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Driver</th>
                    <th className="px-5 py-4">Phone</th>
                    <th className="px-5 py-4">Address</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers.map((driver) => {
                    const id = driver.id ?? driver.driver_id;
                    const active = driver.is_active !== false;
                    return (
                      <tr key={id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {driver.full_name || "Unnamed driver"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {driver.phone || "—"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {driver.address || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(driver)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                              title="Edit driver"
                            >
                              <Pencil size={17} />
                            </button>
                            {active && (
                              <button
                                onClick={() => handleDeactivate(driver)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                title="Deactivate driver"
                              >
                                <UserX size={17} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingDriver ? "Edit Driver" : "Add New Driver"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the driver's information below.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: "full_name", label: "Full name", placeholder: "Enter driver name", required: true },
                { name: "phone", label: "Phone number", placeholder: "Enter phone number", required: true },
                { name: "address", label: "Address", placeholder: "Enter address" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    required={field.required}
                    value={form[field.name]}
                    onChange={(e) =>
                      setForm({ ...form, [field.name]: e.target.value })
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ))}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes about this driver"
                  className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingDriver ? "Save Changes" : "Add Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
