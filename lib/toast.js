// Tiny toast store: call toast("Pesan", "success" | "warning" | "error" | "info") from anywhere in the
// browser; <Toaster /> (rendered by DashboardShell) shows them at the bottom-right of the screen.

const MAX_VISIBLE = 4;
const EMPTY = [];

let toasts = EMPTY;
let nextId = 1;
const listeners = new Set();
const timers = new Map();

function emit() {
  listeners.forEach((listener) => listener());
}

export function dismissToast(id) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(message, type = "success", { duration } = {}) {
  if (typeof window === "undefined" || !message) return null;

  const id = nextId++;
  toasts = [...toasts, { id, message, type }].slice(-MAX_VISIBLE);
  emit();

  // Warnings and errors stay a little longer so they are not missed
  const ms = duration ?? (type === "success" || type === "info" ? 4500 : 7000);
  if (ms > 0) timers.set(id, setTimeout(() => dismissToast(id), ms));
  return id;
}

export function subscribeToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts() {
  return toasts;
}

export function getServerToasts() {
  return EMPTY;
}
