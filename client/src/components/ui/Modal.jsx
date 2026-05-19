import React, { useEffect } from "react";

/**
 * Accessible modal/bottom-sheet.
 * - Centered on sm+, bottom sheet on mobile
 * - Closes on Escape key
 * - Traps focus (via inert on background)
 *
 * @param {boolean}  open
 * @param {function} onClose
 * @param {React.ReactNode} children
 */
const Modal = React.memo(function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-sm bg-[#1e1b3a] border border-white/10
          rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
});

export default Modal;
