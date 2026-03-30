import { format } from "date-fns";

export function formatDateTime(value) {
  if (!value) return "-";
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function formatDate(value) {
  if (!value) return "-";
  return format(new Date(value), "MMM d, yyyy");
}

export function formatBytes(bytes = 0) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${units[i]}`;
}
