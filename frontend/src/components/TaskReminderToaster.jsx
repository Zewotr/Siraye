import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getNextUpcomingTask } from "../api/tasks";
import { useAuth } from "../hooks/useAuth";
import { formatDateTime } from "../utils/format";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TOAST_DURATION_MS = 10000;

export default function TaskReminderToaster() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const notifiedReminderKeysRef = useRef(new Set());
  const timersRef = useRef(new Map());

  const { data: nextTask } = useQuery({
    queryKey: ["tasks", "next-upcoming", user?.id],
    queryFn: getNextUpcomingTask,
    refetchInterval: 30000,
    enabled: Boolean(user?.id),
  });

  const normalizedNextTask = useMemo(() => {
    if (!nextTask?.id || !nextTask?.start_time) return null;
    const startAt = new Date(nextTask.start_time).getTime();
    if (!Number.isFinite(startAt)) return null;
    return { ...nextTask, startAt };
  }, [nextTask]);

  useEffect(() => {
    notifiedReminderKeysRef.current.clear();
    setToasts([]);
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current.clear();
  }, [user?.id]);

  useEffect(() => {
    if (!normalizedNextTask) return;

    const now = Date.now();
    const millisecondsUntilStart = normalizedNextTask.startAt - now;

    if (millisecondsUntilStart < 0 || millisecondsUntilStart > FIVE_MINUTES_MS) return;
    const reminderKey = `${normalizedNextTask.id}-${normalizedNextTask.start_time}`;
    if (notifiedReminderKeysRef.current.has(reminderKey)) return;

    const message = "Next task is scheduled to start in the next 5 minutes. Be ready.";
    const toastId = reminderKey;
    notifiedReminderKeysRef.current.add(reminderKey);

    setToasts((current) => {
      if (current.some((item) => item.id === toastId)) return current;
      return [
        ...current,
        {
          id: toastId,
          title: normalizedNextTask.title,
          message,
          startTime: normalizedNextTask.start_time,
        },
      ];
    });

    if (window.Notification?.permission === "granted") {
      new Notification("Siraye Reminder", {
        body: `${message} ${normalizedNextTask.title}`,
      });
    }

    const timerId = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toastId));
      timersRef.current.delete(toastId);
    }, TOAST_DURATION_MS);
    timersRef.current.set(toastId, timerId);
  }, [normalizedNextTask]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current.clear();
    };
  }, []);

  function dismissToast(id) {
    const timerId = timersRef.current.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((item) => item.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[1400] space-y-3">
      {toasts.map((toast) => (
        <article
          className="pointer-events-auto w-[min(360px,90vw)] rounded-2xl border border-brand-200 bg-white p-4 shadow-soft"
          key={toast.id}
        >
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
          <p className="mt-1 text-sm text-slate-700">{toast.message}</p>
          <p className="mt-2 text-xs text-slate-500">Starts at {formatDateTime(toast.startTime)}</p>
          <button
            className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
            onClick={() => dismissToast(toast.id)}
            type="button"
          >
            Dismiss
          </button>
        </article>
      ))}
    </div>
  );
}
