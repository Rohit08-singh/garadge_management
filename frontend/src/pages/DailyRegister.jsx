
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays, RefreshCw, Plus, Clock, IndianRupee,
  UserCheck, UserX, Save, ClipboardList
} from "lucide-react";
import { sessionsApi } from "../api/sessions.api";

const getSessionId = (session) =>
  session?.id ?? session?.session_id ?? null;

const getRecords = (data) => {
  if (Array.isArray(data)) return data;
  return data?.records ?? data?.items ?? data?.results ?? [];
};

const toDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toLocalISOString = (value) => {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
};

const getDriverName = (record) =>
  record?.driver?.full_name ??
  record?.driver_name ??
  record?.full_name ??
  record?.name ??
  `Driver #${record?.driver_id ?? "—"}`;

export default function DailyRegister() {
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const loadRegister = async () => {
    try {
      setLoading(true);

      const current = await sessionsApi.getCurrentSession();
      const activeSession = current?.session ?? current;

      setSession(activeSession);

      const sessionId = getSessionId(activeSession);
      if (!sessionId) {
        setRecords([]);
        return;
      }

      const response = await sessionsApi.getSessionRecords(sessionId);
      setRecords(
        getRecords(response).map((record) => ({
          ...record,
          attendance_status: record.attendance_status || "NOT_ARRIVED",
          charging_fee: record.charging_fee ?? 0,
          arrival_at: toDateTimeInput(record.arrival_at),
          departure_at: toDateTimeInput(record.departure_at),
        }))
      );
    } catch (error) {
      setSession(null);
      setRecords([]);
      toast.error(
        error.response?.data?.detail || "Could not load the daily register"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegister();
  }, []);

  const createRegister = async () => {
    try {
      setCreating(true);
      const created = await sessionsApi.createSession({
        notes: "Daily garage register",
      });
      setSession(created?.session ?? created);
      toast.success("Daily register opened");
      await loadRegister();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Could not open the register"
      );
    } finally {
      setCreating(false);
    }
  };

  const updateLocalRecord = (recordId, field, value) => {
    setRecords((previous) =>
      previous.map((record) =>
        (record.id ?? record.record_id) === recordId
          ? { ...record, [field]: value }
          : record
      )
    );
  };

  const saveRecord = async (record) => {
    const recordId = record.id ?? record.record_id;

    if (!recordId) {
      toast.error("Record ID is missing");
      return;
    }

    const fee = Number(record.charging_fee);
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error("Enter a valid charging fee");
      return;
    }

    try {
      setSavingId(recordId);

      await sessionsApi.updateRecord(recordId, {
        attendance_status: record.attendance_status,
        charging_fee: fee,
        arrival_at: toLocalISOString(record.arrival_at),
        departure_at: toLocalISOString(record.departure_at),
      });

      toast.success(`${getDriverName(record)} updated`);
      await loadRegister();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Could not save this driver record"
      );
    } finally {
      setSavingId(null);
    }
  };

  const presentCount = records.filter(
    (record) => record.attendance_status === "PRESENT"
  ).length;

  const totalFees = records
    .filter((record) => record.attendance_status === "PRESENT")
    .reduce((sum, record) => sum + Number(record.charging_fee || 0), 0);

  const sessionDate =
    session?.created_at || session?.start_time || session?.session_date;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Daily operations</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Daily Register
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track driver attendance, charging fees and timings.
          </p>
        </div>

        <button
          onClick={loadRegister}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading daily register...
        </div>
      ) : !session || !getSessionId(session) ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ClipboardList size={28} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No active register
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Open a new daily register to load your active drivers and start
            recording attendance.
          </p>
          <button
            onClick={createRegister}
            disabled={creating}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Plus size={18} />
            {creating ? "Opening register..." : "Open Daily Register"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-3 text-blue-600">
                <CalendarDays size={22} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Active garage register
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {sessionDate
                    ? new Date(sessionDate).toLocaleString("en-IN")
                    : `Session #${getSessionId(session)}`}
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Total drivers</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {records.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Present</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {presentCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Recorded charging fees</p>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                ₹{totalFees.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Driver attendance</h2>
              <p className="mt-1 text-xs text-slate-500">
                Update each driver's status, fee and arrival/departure time.
              </p>
            </div>

            {records.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No driver records found in this register.
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {records.map((record) => {
                    const id = record.id ?? record.record_id;
                    const present = record.attendance_status === "PRESENT";

                    return (
                      <div key={id} className="space-y-4 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words font-semibold text-slate-900">
                              {getDriverName(record)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {record.driver?.phone ?? record.phone ?? ""}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            present
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {present ? "Present" : "Not arrived"}
                          </span>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-slate-600">
                            Attendance
                          </label>
                          <select
                            value={record.attendance_status}
                            onChange={(e) =>
                              updateLocalRecord(id, "attendance_status", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                          >
                            <option value="NOT_ARRIVED">Not arrived</option>
                            <option value="PRESENT">Present</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-slate-600">
                            Charging fee (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={record.charging_fee}
                            onChange={(e) =>
                              updateLocalRecord(id, "charging_fee", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                              Arrival time
                            </label>
                            <input
                              type="datetime-local"
                              value={record.arrival_at}
                              onChange={(e) =>
                                updateLocalRecord(id, "arrival_at", e.target.value)
                              }
                              className="w-full min-w-0 rounded-xl border border-slate-200 px-2 py-3 text-xs outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                              Departure time
                            </label>
                            <input
                              type="datetime-local"
                              value={record.departure_at}
                              onChange={(e) =>
                                updateLocalRecord(id, "departure_at", e.target.value)
                              }
                              className="w-full min-w-0 rounded-xl border border-slate-200 px-2 py-3 text-xs outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => saveRecord(record)}
                          disabled={savingId === id}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          <Save size={16} />
                          {savingId === id ? "Saving..." : "Save record"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[950px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-4">Driver</th>
                        <th className="px-4 py-4">Attendance</th>
                        <th className="px-4 py-4">Fee (₹)</th>
                        <th className="px-4 py-4">Arrival</th>
                        <th className="px-4 py-4">Departure</th>
                        <th className="px-4 py-4 text-right">Save</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((record) => {
                        const id = record.id ?? record.record_id;
                        return (
                          <tr key={id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 font-semibold text-slate-800">
                              {getDriverName(record)}
                            </td>
                            <td className="px-4 py-4">
                              <select
                                value={record.attendance_status}
                                onChange={(e) =>
                                  updateLocalRecord(id, "attendance_status", e.target.value)
                                }
                                className="rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-blue-500"
                              >
                                <option value="NOT_ARRIVED">Not arrived</option>
                                <option value="PRESENT">Present</option>
                              </select>
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="number"
                                min="0"
                                value={record.charging_fee}
                                onChange={(e) =>
                                  updateLocalRecord(id, "charging_fee", e.target.value)
                                }
                                className="w-28 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="datetime-local"
                                value={record.arrival_at}
                                onChange={(e) =>
                                  updateLocalRecord(id, "arrival_at", e.target.value)
                                }
                                className="rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="datetime-local"
                                value={record.departure_at}
                                onChange={(e) =>
                                  updateLocalRecord(id, "departure_at", e.target.value)
                                }
                                className="rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() => saveRecord(record)}
                                disabled={savingId === id}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                              >
                                <Save size={14} />
                                {savingId === id ? "Saving" : "Save"}
                              </button>
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
        </>
      )}
    </div>
  );
}
