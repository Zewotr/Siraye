import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getNotifications, markAllRead } from "../api/notifications";
import { useAuth } from "../hooks/useAuth";
import { formatDateTime } from "../utils/format";
import Icon from "./Icon";

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const notifiedRef = useRef(new Set());

  const { data } = useQuery({
    queryKey: ["notifications", user?.id],
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

  useEffect(() => {
    notifiedRef.current.clear();
  }, [user?.id]);

  const markReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="relative z-[1200]">
      <button
        aria-label="Open notifications"
        className="relative rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-violet-600 dark:hover:bg-slate-800 dark:hover:text-violet-300"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Icon name="bell" size={19} />
        {unread.length > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold text-white ring-2 ring-[#f8f9fc] dark:ring-[#10111a]">
            {unread.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="animate-enter absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-28px))] rounded-2xl border border-slate-200 bg-white p-3 shadow-float dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg text-slate-900 dark:text-white">Inbox</h3>
              <p className="text-xs text-slate-400">Updates from your workspace</p>
            </div>
            <button
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
              onClick={() => markReadMutation.mutate()}
              type="button"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-96 space-y-3 overflow-auto">
            {(data?.results || data || []).map((item) => (
              <article key={item.id} className={`rounded-xl border p-3 ${item.is_read ? "border-slate-100 dark:border-slate-800" : "border-violet-100 bg-violet-50/60 dark:border-violet-500/20 dark:bg-violet-500/5"}`}>
                <p className="text-sm text-slate-800 dark:text-slate-200">{item.message}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
              </article>
            ))}
            {!data || (data?.results || data).length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : null}
          </div>
          {window.Notification?.permission !== "granted" ? (
            <button
              className="mt-3 w-full rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white"
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
