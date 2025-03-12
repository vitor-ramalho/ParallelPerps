import { useState } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export function useToast() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  return { show };
}

export function ToastContainer() {
  const [toasts] = useState<Toast[]>([]);

  return (
    <div className="toast toast-end">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`alert ${
            toast.type === "error" ? "alert-error" : toast.type === "success" ? "alert-success" : "alert-info"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
