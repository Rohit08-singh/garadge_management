
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays, RefreshCw, IndianRupee, FileText,
  Users, Download, ClipboardList
} from "lucide-react";
import { reportsApi } from "../api/reports.api";

const todayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const titleCase = (value) =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const findArray = (data) => {
  if (!data || typeof data !== "object") return [];
  for (const key of ["records", "drivers", "daily_records", "items", "payments"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};

const findSummary = (data) => {
  if (!data || typeof data !== "object") return {};
  return data.summary || data.totals || data.statistics || data;
};

export default function Reports() {
  const [reportDate, setReportDate] = useState(todayLocal());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getDailyReport(reportDate);
      setReport(data);
    } catch (error) {
      setReport(null);
      toast.error(
        error.response?.data?.detail || "Could not load the daily report"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const summary = findSummary(report);
  const rows = findArray(report);

  const summaryEntries = Object.entries(summary).filter(
    ([, value]) =>
      value === null ||
      ["string", "number", "boolean"].includes(typeof value)
  );

  const handleExport = () => {
    if (!report) return;

    const content = JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `garage-report-${reportDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Garage analytics</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review daily attendance, charging fees and collections.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={!report}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
        >
          <Download size={17} /> Export report
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Select report date
          </label>
          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 sm:max-w-xs"
            />
          </div>
        </div>
        <button
          onClick={loadReport}
          disabled={loading || !reportDate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading..." : "Generate Report"}
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Generating report...
        </div>
      ) : !report ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <FileText className="mx-auto text-slate-300" size={36} />
          <p className="mt-3 font-semibold text-slate-700">
            No report loaded
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Choose a date and generate its report.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Daily report
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Report date: {reportDate}
            </p>
          </div>

          {summaryEntries.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {summaryEntries.map(([key, value], index) => {
                const label = titleCase(key);
                const isMoney =
                  /fee|collection|amount|payment|balance|revenue/i.test(key);
                const Icon =
                  /driver|present|absent|arriv/i.test(key)
                    ? Users
                    : /fee|collection|amount|payment|balance|revenue/i.test(key)
                      ? IndianRupee
                      : ClipboardList;

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">{label}</p>
                      <Icon
                        size={19}
                        className={
                          index % 2 === 0 ? "text-blue-600" : "text-emerald-600"
                        }
                      />
                    </div>
                    <p className="mt-2 break-words text-2xl font-bold text-slate-900">
                      {isMoney && typeof value === "number"
                        ? money(value)
                        : displayValue(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {rows.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-bold text-slate-900">Daily records</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {rows.length} records in this report
                </p>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {rows.map((row, index) => (
                  <div key={row.id ?? row.record_id ?? index} className="space-y-2 p-4">
                    {Object.entries(row)
                      .filter(([, value]) =>
                        value === null ||
                        ["string", "number", "boolean"].includes(typeof value)
                      )
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4 text-sm">
                          <span className="shrink-0 text-slate-500">
                            {titleCase(key)}
                          </span>
                          <span className="break-all text-right font-medium text-slate-800">
                            {displayValue(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      {Object.keys(rows[0])
                        .filter((key) => typeof rows[0][key] !== "object")
                        .map((key) => (
                          <th key={key} className="px-4 py-3">
                            {titleCase(key)}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, index) => (
                      <tr key={row.id ?? row.record_id ?? index}>
                        {Object.entries(row)
                          .filter(([, value]) => typeof value !== "object")
                          .map(([key, value]) => (
                            <td key={key} className="px-4 py-3 text-slate-700">
                              {displayValue(value)}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {summaryEntries.length === 0 && rows.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-900">Report data</h2>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
