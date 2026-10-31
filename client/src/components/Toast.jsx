import { useState, useEffect, useCallback } from 'react';

// Global toast state — components call window.toast.success/error/info
let _setToasts = null;

export function initToast(setter) {
  _setToasts = setter;
}

export const toast = {
  success: (msg) => _fire('success', msg),
  error:   (msg) => _fire('error',   msg),
  info:    (msg) => _fire('info',    msg),
};

function _fire(type, message) {
  if (!_setToasts) return;
  const id = Date.now() + Math.random();
  _setToasts((prev) => [...prev, { id, type, message }]);
  setTimeout(() => {
    _setToasts((prev) => prev.filter((t) => t.id !== id));
  }, 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    initToast(setToasts);
  }, []);

  function dismiss(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => dismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
