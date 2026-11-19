"use client";
import { useEffect, useRef, useState } from "react";

export function UnsavedChangesDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const cancel = useRef<HTMLButtonElement>(null);
  const leave = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancel.current?.focus(); }, []);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <section role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title" aria-describedby="unsaved-description"
      className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-panel"
      onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); onStay(); }
        if (event.key === "Tab") {
          if (event.shiftKey && document.activeElement === cancel.current) { event.preventDefault(); leave.current?.focus(); }
          else if (!event.shiftKey && document.activeElement === leave.current) { event.preventDefault(); cancel.current?.focus(); }
        }
      }}>
      <h2 id="unsaved-title" className="text-lg font-semibold">Leave unsaved run parameters?</h2>
      <p id="unsaved-description" className="mt-3 text-sm text-muted">Your pending changes have not been reviewed. Stay to keep editing, or leave this page.</p>
      <div className="mt-6 flex flex-wrap gap-3"><button ref={cancel} type="button" className="rounded-md border border-line px-4 py-2" onClick={onStay}>Stay and edit</button><button ref={leave} type="button" className="rounded-md bg-red-700 px-4 py-2 text-white" onClick={onLeave}>Leave page</button></div>
    </section>
  </div>;
}

const navigate = (href: string) => window.location.assign(href);
export function useUnsavedChanges(dirty: boolean, go: (href: string) => void = navigate) {
  const [destination, setDestination] = useState<string>();
  const pending = useRef(false);
  const bypass = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      if (bypass.current) return;
      event.preventDefault(); event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      if (bypass.current || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!target || target.hasAttribute("download") || (target.target && target.target !== "_self")) return;
      const url = new URL(target.href, window.location.href);
      if (!["http:", "https:"].includes(url.protocol) || (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (pending.current) return;
      pending.current = true; trigger.current = target; setDestination(url.href);
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", click, true); };
  }, [dirty]);
  function allowNavigation() { bypass.current = true; }
  function stay() { pending.current = false; setDestination(undefined); trigger.current?.focus(); }
  function leave() { if (!destination) return; bypass.current = true; pending.current = false; setDestination(undefined); go(destination); }
  return { allowNavigation, dialog: destination ? <UnsavedChangesDialog onStay={stay} onLeave={leave} /> : null };
}

export function parametersChanged(initial: { fixture: string; timeout: string }, current: { fixture: string; timeout: string }) {
  const timeout = (value: string) => value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : value;
  return initial.fixture !== current.fixture || timeout(initial.timeout) !== timeout(current.timeout);
}
