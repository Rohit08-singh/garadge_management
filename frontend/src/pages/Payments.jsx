
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus, RefreshCw, IndianRupee, Clock, CheckCircle2,
  XCircle, Wallet, X, Search, CreditCard
} from "lucide-react";
import { paymentsApi } from "../api/payments.api";
import { sessionsApi } from "../api/sessions.api";
import { driversApi } from "../api/drivers.api";
import useAuth from "../hooks/useAuth";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getList = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

const getStatus = (payment) =>
  String(payment.status || payment.payment_status || "PENDING").toUpperCase();

const getPaymentId = (payment) => payment.id ?? payment.payment_id;

const getDriverName = (payment) =>
  payment.driver?.full_name ||
  payment.daily_record?.driver?.full_name ||
  payment.driver_name ||
  payment.daily_record?.driver_name ||
  `Record #${payment.daily_record_id ?? "—"}`;

const getRecordId = (record) => record.id ?? record.record_id;

const getRecordDriverId = (record) =>
  record.driver_id ?? record.driver?.id ?? record.driver?.driver_id;

const getRecordStatus = (record) =>
  String(record.attendance_status || record.status || "").toUpperCase();

export default function Payments() {
  const { user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [records, setRecords] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [rejectPayment, setRejectPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [form, setForm] = useState({
    daily_record_id: "",
    amount: "",
    payment_method: "CASH",
    transaction_reference: "",
  });

  const role = String(user?.role || "").toLowerCase();
  const isOwner = role === "owner";

  const loadData = async () => {
    try {
      setLoading(true);

      const [paymentResponse, driverResponse] = await Promise.all([
        paymentsApi.getPayments(),
        driversApi.getDrivers(),
      ]);

      setPayments(getList(paymentResponse, ["payments", "items", "results"]));
      setDrivers(getList(driverResponse, ["drivers", "items", "results"]));

      try {
        const current = await sessionsApi.getCurrentSession();
        const session = current?.session ?? current;
        const sessionId = session?.id ?? session?.session_id;

        if (sessionId) {
          const response = await sessionsApi.getSessionRecords(sessionId);
          setRecords(getList(response, ["records", "items", "results"]));
        } else {
          setRecords([]);
        }
      } catch {
        setRecords([]);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Could not load payment information"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const driversById = useMemo(() => {
    const map = new Map();
    drivers.forEach((driver) => {
      map.set(String(driver.id ?? driver.driver_id), driver);
    });
    return map;
  }, [drivers]);

  const getRecordDriverName = (record) => {
    const nestedName =
      record.driver?.full_name ||
      record.driver_name ||
      record.full_name ||
      record.name;
    if (nestedName) return nestedName;

    const driverId = getRecordDriverId(record);
    const driver = driverId != null ? driversById.get(String(driverId)) : null;
    return driver?.full_name || driver?.name || "Unknown driver";
  };

  const getSubmittedAmountForRecord = (recordId) =>
    payments
      .filter(
        (payment) =>
          String(payment.daily_record_id ?? payment.daily_record?.id) ===
            String(recordId) &&
          ["APPROVED", "PENDING"].includes(getStatus(payment))
      )
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const getOutstandingBalance = (record) => {
    const fee = Number(record.charging_fee || 0);
    return Math.max(0, fee - getSubmittedAmountForRecord(getRecordId(record)));
  };

  const eligibleRecords = useMemo(
    () =>
      records.filter((record) => {
        const status = getRecordStatus(record);
        return (
          status === "PRESENT" &&
          Number(record.charging_fee || 0) > 0 &&
          getOutstandingBalance(record) > 0
        );
      }),
    [records, payments, driversById]
  );

  const selectedRecord = eligibleRecords.find(
    (record) => String(getRecordId(record)) === String(form.daily_record_id)
  );
  const selectedBalance = selectedRecord
    ? getOutstandingBalance(selectedRecord)
    : 0;

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const status = getStatus(payment);
      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const text = [
        getDriverName(payment),
        payment.transaction_reference,
        payment.payment_method,
        getPaymentId(payment),
      ].join(" ").toLowerCase();

      return matchesStatus && text.includes(search.toLowerCase());
    });
  }, [payments, search, statusFilter]);

  const pendingCount = payments.filter(
    (payment) => getStatus(payment) === "PENDING"
  ).length;

  const approvedTotal = payments
    .filter((payment) => getStatus(payment) === "APPROVED")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const pendingTotal = payments
    .filter((payment) => getStatus(payment) === "PENDING")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const openCreateModal = () => {
    setForm({
      daily_record_id: "",
      amount: "",
      payment_method: "CASH",
      transaction_reference: "",
    });
    setModalOpen(true);
  };

  const submitPayment = async (event) => {
    event.preventDefault();

    const amount = Number(form.amount);
    if (!form.daily_record_id || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Select a driver and enter a valid amount");
      return;
    }

    const record = eligibleRecords.find(
      (item) => String(getRecordId(item)) === String(form.daily_record_id)
    );
    const remaining = record ? getOutstandingBalance(record) : 0;

    if (!record || amount > remaining) {
      toast.error(`Amount cannot exceed the remaining balance of ${money(remaining)}`);
      return;
    }

    try {
      setSaving(true);

      await paymentsApi.createPayment({
        daily_record_id: Number(form.daily_record_id),
        amount,
        payment_method: form.payment_method,
        payment_date: new Date().toISOString(),
        transaction_reference:
          form.payment_method === "ONLINE"
            ? form.transaction_reference.trim() || null
            : null,
      });

      toast.success("Payment submitted for confirmation");
      setModalOpen(false);
      await loadData();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Could not submit payment"
      );
    } finally {
      setSaving(false);
    }
  };

  const approve = async (payment) => {
    const id = getPaymentId(payment);
    if (!id) return toast.error("Payment ID is missing");

    if (!window.confirm("Approve this payment?")) return;

    try {
      setActionId(id);
      await paymentsApi.approvePayment(id);
      toast.success("Payment approved");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not approve payment");
    } finally {
      setActionId(null);
    }
  };

  const reject = async (event) => {
    event.preventDefault();
    if (!rejectPayment) return;

    const id = getPaymentId(rejectPayment);
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    try {
      setActionId(id);
      await paymentsApi.rejectPayment(id, {
        rejection_reason: rejectionReason.trim(),
      });
      toast.success("Payment rejected");
      setRejectPayment(null);
      setRejectionReason("");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not reject payment");
    } finally {
      setActionId(null);
    }
  };

  const statusStyle = (status) => {
    if (status === "APPROVED") return "bg-emerald-50 text-emerald-700";
    if (status === "REJECTED") return "bg-red-50 text-red-700";
    return "bg-amber-50 text-amber-700";
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Garage finances</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Payments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record payments and manage payment confirmations.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} /> Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Approved collection</p>
            <CheckCircle2 className="text-emerald-600" size={20} />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {money(approvedTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Pending amount</p>
            <Clock className="text-amber-600" size={20} />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {money(pendingTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Pending transactions</p>
            <Wallet className="text-blue-600" size={20} />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {pendingCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver, transaction reference..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Payment history</h2>
          <p className="mt-1 text-xs text-slate-500">
            {filteredPayments.length} transactions
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading payments...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-10 text-center">
            <CreditCard className="mx-auto text-slate-300" size={34} />
            <p className="mt-3 font-semibold text-slate-700">
              No payments found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Payments will appear here after they are submitted.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile payment cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredPayments.map((payment) => {
                const id = getPaymentId(payment);
                const status = getStatus(payment);
                return (
                  <div key={id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-900">
                          {getDriverName(payment)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Payment #{id}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}>
                        {status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Amount</span>
                      <span className="text-lg font-bold text-slate-900">
                        {money(payment.amount)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">Method</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {payment.payment_method || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Date</p>
                        <p className="mt-1 text-xs text-slate-700">
                          {formatDate(payment.payment_date || payment.created_at)}
                        </p>
                      </div>
                    </div>

                    {payment.transaction_reference && (
                      <p className="break-all text-xs text-slate-500">
                        Reference: {payment.transaction_reference}
                      </p>
                    )}

                    {isOwner && status === "PENDING" && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => approve(payment)}
                          disabled={actionId === id}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          <CheckCircle2 size={16} /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectPayment(payment);
                            setRejectionReason("");
                          }}
                          disabled={actionId === id}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-60"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop payments table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Method</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Status</th>
                    {isOwner && <th className="px-5 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((payment) => {
                    const id = getPaymentId(payment);
                    const status = getStatus(payment);
                    return (
                      <tr key={id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {getDriverName(payment)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            #{id}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {money(payment.amount)}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {payment.payment_method || "—"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(payment.payment_date || payment.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}>
                            {status}
                          </span>
                        </td>
                        {isOwner && (
                          <td className="px-5 py-4">
                            {status === "PENDING" ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => approve(payment)}
                                  disabled={actionId === id}
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectPayment(payment);
                                    setRejectionReason("");
                                  }}
                                  disabled={actionId === id}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <p className="text-right text-xs text-slate-400">—</p>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Record payment modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Record Payment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Submit a payment for owner confirmation.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitPayment} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Driver record
                </label>
                <select
                  required
                  value={form.daily_record_id}
                  onChange={(e) =>
                    setForm({ ...form, daily_record_id: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Select a driver</option>
                  {eligibleRecords.map((record) => {
                    const id = getRecordId(record);
                    return (
                      <option key={id} value={id}>
                        {getRecordDriverName(record)} — Remaining: {money(getOutstandingBalance(record))}
                      </option>
                    );
                  })}
                </select>
                {eligibleRecords.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No present drivers with an outstanding balance. Check attendance and charging fees in the Daily Register.
                  </p>
                )}
              </div>

              {selectedRecord && (
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-blue-50 p-3">
                  <div>
                    <p className="text-xs text-blue-700">Total charging fee</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {money(selectedRecord.charging_fee)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">Remaining balance</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {money(selectedBalance)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Payment amount (₹)
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  max={selectedRecord ? selectedBalance : undefined}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  placeholder="Enter amount received"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                />
                {selectedRecord && (
                  <p className="mt-1 text-xs text-slate-500">
                    Maximum payable now: {money(selectedBalance)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Payment method
                </label>
                <select
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payment_method: e.target.value,
                      transaction_reference: "",
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online / UPI</option>
                </select>
              </div>

              {form.payment_method === "ONLINE" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Transaction reference
                  </label>
                  <input
                    value={form.transaction_reference}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        transaction_reference: e.target.value,
                      })
                    }
                    placeholder="Enter UPI transaction ID (if available)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                This payment will be marked as pending until an owner confirms it.
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
                  disabled={saving || eligibleRecords.length === 0 || !form.daily_record_id}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Submitting..." : "Submit Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject payment modal */}
      {rejectPayment && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <div className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Reject payment
              </h2>
              <button
                onClick={() => setRejectPayment(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Enter a reason so the payment rejection is recorded clearly.
            </p>
            <form onSubmit={reject} className="mt-4 space-y-4">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setRejectPayment(null)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionId === getPaymentId(rejectPayment)}
                  className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {actionId === getPaymentId(rejectPayment)
                    ? "Rejecting..."
                    : "Confirm rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
