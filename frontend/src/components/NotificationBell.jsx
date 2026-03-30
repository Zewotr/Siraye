import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getNotifications, markAllRead } from "../api/notifications";
import { formatDateTime } from "../utils/format";

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const notifiedRef = useRef(new Set());

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });

  const unread = useMemo(() => {
    const list = data?.results || data || [];
    return list.filter((item) => !item.is_read);
  }, [data]);

  useEffect(() => {
    unread.forEach((item) => {
      if (notifiedRef.current.has(item.id)) return;
      if (window.Notification?.permission === "granted") {
        new Notification("Siraye", { body: item.message });
      }
      notifiedRef.current.add(item.id);
    });
  }, [unread]);

  const markReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="relative">
      <button
        className="relative rounded-full border border-brand-200 bg-white px-3 py-2 text-sm text-brand-700"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        Notifications
        {unread.length > 0 ? (
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs text-white">
            {unread.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-96 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-lg">Alerts</h3>
            <button
              className="text-xs text-brand-700"
              onClick={() => markReadMutation.mutate()}
              type="button"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-96 space-y-3 overflow-auto">
            {(data?.results || data || []).map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-100 p-3">
                <p className="text-sm text-slate-800">{item.message}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
              </article>
            ))}
            {!data || (data?.results || data).length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : null}
          </div>
          {window.Notification?.permission !== "granted" ? (
            <button
              className="mt-3 w-full rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white"
              onClick={() => window.Notification?.requestPermission()}
              type="button"
            >
              Enable browser notifications
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
