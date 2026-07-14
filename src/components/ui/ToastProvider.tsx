import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ShowToastOptions = {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (options: ShowToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<
  ToastType,
  {
    container: string;
    iconContainer: string;
    icon: ReactNode;
  }
> = {
  success: {
    container:
      "border-green-500/30 bg-green-950/95",
    iconContainer:
      "bg-green-400 text-green-950",
    icon: <CheckCircle2 size={22} />,
  },

  error: {
    container:
      "border-red-500/30 bg-red-950/95",
    iconContainer:
      "bg-red-400 text-red-950",
    icon: <XCircle size={22} />,
  },

  warning: {
    container:
      "border-yellow-500/30 bg-yellow-950/95",
    iconContainer:
      "bg-yellow-400 text-yellow-950",
    icon: <AlertTriangle size={22} />,
  },

  info: {
    container:
      "border-blue-500/30 bg-blue-950/95",
    iconContainer:
      "bg-blue-400 text-blue-950",
    icon: <Info size={22} />,
  },
};

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 4000,
    }: ShowToastOptions) => {
      const id = crypto.randomUUID();

      const newToast: Toast = {
        id,
        type,
        title,
        message,
      };

      setToasts((currentToasts) => [
        ...currentToasts,
        newToast,
      ]);

      window.setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const contextValue = useMemo(
    () => ({
      showToast,
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div
        className="
          pointer-events-none
          fixed
          bottom-4
          right-4
          z-[100]
          flex
          w-[calc(100%-2rem)]
          max-w-md
          flex-col
          gap-3
          sm:bottom-6
          sm:right-6
        "
      >
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];

          return (
            <div
              key={toast.id}
              className={`
                pointer-events-auto
                scale-enter
                overflow-hidden
                rounded-2xl
                border
                shadow-2xl
                backdrop-blur-xl
                ${style.container}
              `}
            >
              <div className="flex items-start gap-3 p-4">
                <div
                  className={`
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    ${style.iconContainer}
                  `}
                >
                  {style.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-black text-white">
                    {toast.title}
                  </p>

                  {toast.message && (
                    <p className="mt-1 text-sm leading-6 text-white/70">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    text-white/60
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                  aria-label="Meldung schliessen"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="h-1 overflow-hidden bg-black/20">
                <div className="toast-progress h-full bg-white/35" />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast muss innerhalb des ToastProvider verwendet werden."
    );
  }

  return context;
}