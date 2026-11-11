import React from "react";

// Cuadros propios de la app en lugar de los del navegador (alert, confirm, prompt)
type DialogKind = "alert" | "confirm" | "prompt";

interface PromptOptions {
  placeholder?: string;
  maxLength?: number;
  numeric?: boolean;
  confirmLabel?: string;
}

interface DialogRequest {
  id: number;
  kind: DialogKind;
  message: string;
  options?: PromptOptions;
  resolve: (value: any) => void;
}

let nextId = 1;
let pushRequest: ((request: DialogRequest) => void) | null = null;
const waiting: DialogRequest[] = [];

function open<T>(kind: DialogKind, message: unknown, options?: PromptOptions): Promise<T> {
  return new Promise<T>((resolve) => {
    const request: DialogRequest = { id: nextId++, kind, message: String(message ?? ""), options, resolve };
    if (pushRequest) pushRequest(request);
    else waiting.push(request);
  });
}

export const appAlert = (message: unknown) => open<void>("alert", message);
export const appConfirm = (message: unknown, confirmLabel?: string) =>
  open<boolean>("confirm", message, { confirmLabel });
export const appPrompt = (message: unknown, options?: PromptOptions) =>
  open<string | null>("prompt", message, options);

// Los avisos sueltos (alert) de toda la app pasan por el cuadro propio
export function installAppAlert() {
  window.alert = (message?: unknown) => {
    void appAlert(message);
  };
}

export const AppDialogHost: React.FC = () => {
  const [queue, setQueue] = React.useState<DialogRequest[]>([]);
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const okRef = React.useRef<HTMLButtonElement>(null);
  const current = queue[0];

  React.useEffect(() => {
    pushRequest = (request) => setQueue((prev) => [...prev, request]);
    if (waiting.length) setQueue((prev) => [...prev, ...waiting.splice(0)]);
    return () => {
      pushRequest = null;
    };
  }, []);

  React.useEffect(() => {
    if (!current) return;
    setValue("");
    const timer = window.setTimeout(() => {
      if (current.kind === "prompt") inputRef.current?.focus();
      else okRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [current?.id]);

  if (!current) return null;

  const close = (result: any) => {
    current.resolve(result);
    setQueue((prev) => prev.slice(1));
  };

  const accept = () => close(current.kind === "prompt" ? value : current.kind === "confirm" ? true : undefined);
  const cancel = () => close(current.kind === "prompt" ? null : current.kind === "confirm" ? false : undefined);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") cancel();
    if (e.key === "Enter") {
      e.preventDefault();
      accept();
    }
  };

  const options = current.options || {};

  return (
    <div className="app-dialog-overlay" onKeyDown={onKeyDown} role="dialog" aria-modal="true">
      <div className="app-dialog">
        <p className="app-dialog-message">{current.message}</p>

        {current.kind === "prompt" && (
          <input
            ref={inputRef}
            className={`app-dialog-input ${options.numeric ? "numeric" : ""}`}
            value={value}
            onChange={(e) => setValue(options.numeric ? e.target.value.replace(/\D/g, "") : e.target.value)}
            placeholder={options.placeholder}
            maxLength={options.maxLength}
            inputMode={options.numeric ? "numeric" : undefined}
            autoComplete="off"
          />
        )}

        <div className="app-dialog-actions">
          {current.kind !== "alert" && (
            <button type="button" className="app-dialog-btn secondary" onClick={cancel}>
              Cancelar
            </button>
          )}
          <button ref={okRef} type="button" className="app-dialog-btn primary" onClick={accept}>
            {options.confirmLabel || (current.kind === "alert" ? "Entendido" : "Aceptar")}
          </button>
        </div>
      </div>
    </div>
  );
};
