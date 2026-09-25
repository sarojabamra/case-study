export type ToastTone = "error" | "success";

export type ToastMessage = {
  id: number;
  tone: ToastTone;
  title: string;
  message: string;
};

let nextToastId = 1;
let visibleToasts: ToastMessage[] = [];
const toastListeners = new Set<() => void>();

function notifyToastListeners() {
  toastListeners.forEach((listener) => listener());
}

export const toastStore = {
  push(toast: Omit<ToastMessage, "id">) {
    const toastMessage = { ...toast, id: nextToastId++ };
    visibleToasts = [...visibleToasts, toastMessage].slice(-3);
    notifyToastListeners();
    window.setTimeout(() => toastStore.dismiss(toastMessage.id), 5000);
  },
  success(title: string, message = "") {
    this.push({ tone: "success", title, message });
  },
  failure(message: string) {
    this.push({ tone: "error", title: "Something went wrong", message });
  },

  dismiss(toastId: number) {
    visibleToasts = visibleToasts.filter((toastMessage) => toastMessage.id !== toastId);
    notifyToastListeners();
  },
  subscribe(listener: () => void) {
    toastListeners.add(listener);
    return () => toastListeners.delete(listener);
  },
  getSnapshot() {
    return visibleToasts;
  },
};

export function toastFailure(error: unknown, fallbackMessage = "Something went wrong. Try again.") {
  toastStore.failure(error instanceof Error ? error.message : fallbackMessage);
}
