
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bell, CheckCheck, RefreshCw, Clock, Wallet,
  CheckCircle2, AlertCircle
} from "lucide-react";
import { notificationsApi } from "../api/notifications.api";

const getList = (data) => {
  if (Array.isArray(data)) return data;
  return data?.notifications ?? data?.items ?? data?.results ?? [];
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getIcon = (type) => {
  if (String(type).includes("PAYMENT")) return Wallet;
  if (String(type).includes("APPROVED")) return CheckCircle2;
  if (String(type).includes("REJECTED")) return AlertCircle;
  return Bell;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("ALL");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications();
      setNotifications(getList(response));
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Could not load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (notification) => {
    const id = notification.id ?? notification.notification_id;
    if (!id || notification.is_read) return;

    try {
      setUpdatingId(id);
      await notificationsApi.markAsRead(id);
      setNotifications((previous) =>
        previous.map((item) =>
          (item.id ?? item.notification_id) === id
            ? { ...item, is_read: true }
            : item
        )
      );
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Could not update notification"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "UNREAD") return !notification.is_read;
    if (filter === "READ") return notification.is_read;
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Updates</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay updated about payments and garage activities.
          </p>
        </div>

        <button
          onClick={loadNotifications}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total notifications</p>
            <Bell className="text-blue-600" size={20} />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {notifications.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Unread notifications</p>
            <Clock className="text-amber-600" size={20} />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {unreadCount}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", value: "ALL" },
          { label: "Unread", value: "UNREAD" },
          { label: "Read", value: "READ" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              filter === item.value
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Recent activity</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredNotifications.length} notifications
            </p>
          </div>
          <Bell size={20} className="text-slate-400" />
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCheck className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 font-semibold text-slate-700">
              You're all caught up
            </p>
            <p className="mt-1 text-sm text-slate-500">
              No notifications in this category.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => {
              const id = notification.id ?? notification.notification_id;
              const Icon = getIcon(notification.notification_type);
              const unread = !notification.is_read;

              return (
                <div
                  key={id}
                  className={`flex flex-col gap-3 p-4 transition sm:flex-row sm:items-start sm:p-5 ${
                    unread ? "bg-blue-50/40" : "bg-white"
                  }`}
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    unread
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <Icon size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {notification.title || "Garage notification"}
                      </h3>
                      {unread && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                      {notification.message || "You have a new update."}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>{formatDate(notification.created_at)}</span>
                      {notification.notification_type && (
                        <>
                          <span>•</span>
                          <span>
                            {String(notification.notification_type).replaceAll("_", " ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {unread && (
                    <button
                      onClick={() => markRead(notification)}
                      disabled={updatingId === id}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60 sm:self-center"
                    >
                      <CheckCheck size={15} />
                      {updatingId === id ? "Updating..." : "Mark as read"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
