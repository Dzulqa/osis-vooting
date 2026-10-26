"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Shared dialog: fixed header (title + description) and footer (actions), at most 90% of the
// screen tall, with only the body scrolling. Every confirmation in the app goes through it.

const TONES = {
  primary: {
    icon: "bg-violet-100 text-violet-700 ring-violet-200",
    confirm: "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-300",
  },
  danger: {
    icon: "bg-rose-100 text-rose-600 ring-rose-200",
    confirm: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300",
  },
  warning: {
    icon: "bg-amber-100 text-amber-700 ring-amber-200",
    confirm: "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-300",
  },
  success: {
    icon: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    confirm: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300",
  },
};

const noopSubscribe = () => () => {};

const SIZES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

export default function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  tone = "primary",
  size = "md",
  dismissible = true,
  footer,
  children,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  // Portals only exist in the browser; render nothing during SSR and hydration
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Esc closes, the page behind stops scrolling, focus moves into the dialog and back afterwards
  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      const panel = panelRef.current;
      const target = panel?.querySelector("[data-autofocus]") || panel?.querySelector("input, button, [href], select, textarea");
      target?.focus();
    }, 30);

    function onKeyDown(event) {
      if (event.key === "Escape" && dismissible) {
        event.stopPropagation();
        closeRef.current?.();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, dismissible]);

  if (!open || !isClient) return null;

  const toneStyle = TONES[tone] || TONES.primary;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={() => dismissible && onClose?.()}
        className="absolute inset-0 bg-[#1f2a48]/40 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`fx-pop-in relative flex max-h-[90vh] w-full ${SIZES[size] || SIZES.md} flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_30px_80px_-30px_rgba(31,42,72,0.55)] ring-1 ring-slate-200`}
      >
        {/* HEADER (tetap) */}
        <div className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-6 pb-4 pt-6">
          {icon && (
            <span
              aria-hidden="true"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ring-1 ${toneStyle.icon}`}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-lg font-bold leading-snug text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="-mr-2 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* BODY (bisa di-scroll) */}
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}

        {/* FOOTER (tetap) */}
        {footer && (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmModal({
  open,
  title,
  description,
  icon,
  tone = "primary",
  size,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  loading = false,
  loadingLabel = "Memproses…",
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}) {
  const toneStyle = TONES[tone] || TONES.primary;

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onCancel}
      dismissible={!loading}
      title={title}
      description={description}
      icon={icon}
      tone={tone}
      size={size}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            data-autofocus={tone === "danger" ? true : undefined}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            data-autofocus={tone === "danger" ? undefined : true}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${toneStyle.confirm}`}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

/**
 * const [confirm, confirmModal] = useConfirm();
 * if (await confirm({ title, description, tone: "danger", confirmLabel })) { ... }
 * Render {confirmModal} once somewhere in the page.
 */
export function useConfirm() {
  const [request, setRequest] = useState(null); // { options, resolve }

  const confirm = useCallback(
    (options) => new Promise((resolve) => setRequest({ options, resolve })),
    []
  );

  function settle(result) {
    request?.resolve(result);
    setRequest(null);
  }

  const element = (
    <ConfirmModal
      open={Boolean(request)}
      {...request?.options}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );

  return [confirm, element];
}
