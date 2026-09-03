import React, { useEffect, useState, useRef } from "react";
import "./GlobalTooltip.css";

const SMART_FALLBACKS = {
  submit: "Submit form",
  save: "Save changes",
  cancel: "Cancel action",
  close: "Close window",
  delete: "Delete item",
  remove: "Remove item",
  edit: "Edit item",
  retry: "Retry action",
  next: "Next page",
  prev: "Previous page",
  previous: "Previous page",
  back: "Go back",
  search: "Search",
  refresh: "Refresh data",
  download: "Download file",
  upload: "Upload file",
  copy: "Copy to clipboard",
};

const GlobalTooltip = () => {
  const [tooltip, setTooltip] = useState({
    text: "",
    top: 0,
    left: 0,
    position: "above",
    visible: false,
  });

  const activeElementRef = useRef(null);
  const timerRef = useRef(null);
  const lastActiveTimeRef = useRef(0);

  useEffect(() => {
    const resolveTooltipText = (el) => {
      // 1. Explicit data-tooltip
      const dataTooltip = el.getAttribute("data-tooltip");
      if (dataTooltip && dataTooltip.trim()) return dataTooltip.trim();

      // 2. Native title
      const title = el.getAttribute("title") || el.getAttribute("data-orig-title");
      if (title && title.trim()) return title.trim();

      // 3. aria-label
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

      // 4. Smart fallback based on text content
      const text = (el.innerText || el.textContent || "").trim();
      if (text) {
        const lower = text.toLowerCase();
        if (SMART_FALLBACKS[lower]) {
          return SMART_FALLBACKS[lower];
        }
        if (text.length <= 25) {
          return text;
        }
      }

      return null;
    };

    const hideTooltip = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (activeElementRef.current) {
        const origTitle = activeElementRef.current.getAttribute("data-orig-title");
        if (origTitle) {
          activeElementRef.current.setAttribute("title", origTitle);
          activeElementRef.current.removeAttribute("data-orig-title");
        }
        activeElementRef.current = null;
      }
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    const showForElement = (el) => {
      const text = resolveTooltipText(el);
      if (!text) {
        hideTooltip();
        return;
      }

      // Suppress browser native tooltip
      if (el.hasAttribute("title")) {
        const titleVal = el.getAttribute("title");
        if (titleVal) {
          el.setAttribute("data-orig-title", titleVal);
        }
        el.removeAttribute("title");
      }

      activeElementRef.current = el;

      const rect = el.getBoundingClientRect();
      const placeBelow = rect.top < 46;
      const top = placeBelow ? rect.bottom + 8 : rect.top - 8;
      const rawLeft = rect.left + rect.width / 2;
      const left = Math.max(70, Math.min(window.innerWidth - 70, rawLeft));

      const isWarm = Date.now() - lastActiveTimeRef.current < 400;
      const delay = isWarm ? 0 : 120;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setTooltip({
          text,
          top,
          left,
          position: placeBelow ? "below" : "above",
          visible: true,
        });
        lastActiveTimeRef.current = Date.now();
      }, delay);
    };

    const handlePointerOver = (e) => {
      const targetBtn = e.target.closest(
        'button, [data-tooltip], [role="button"]'
      );
      if (!targetBtn) {
        hideTooltip();
        return;
      }
      showForElement(targetBtn);
    };

    const handlePointerOut = (e) => {
      if (!activeElementRef.current) return;
      const related = e.relatedTarget;
      if (related && activeElementRef.current.contains(related)) return;
      hideTooltip();
    };

    const handleFocusIn = (e) => {
      const targetBtn = e.target.closest(
        'button, [data-tooltip], [role="button"]'
      );
      if (targetBtn) {
        showForElement(targetBtn);
      }
    };

    const handleFocusOut = () => {
      hideTooltip();
    };

    const handleClickOrScroll = () => {
      hideTooltip();
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        hideTooltip();
      }
    };

    document.addEventListener("pointerover", handlePointerOver, true);
    document.addEventListener("pointerout", handlePointerOut, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("focusout", handleFocusOut, true);
    document.addEventListener("click", handleClickOrScroll, true);
    window.addEventListener("scroll", handleClickOrScroll, true);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("pointerover", handlePointerOver, true);
      document.removeEventListener("pointerout", handlePointerOut, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("focusout", handleFocusOut, true);
      document.removeEventListener("click", handleClickOrScroll, true);
      window.removeEventListener("scroll", handleClickOrScroll, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  if (!tooltip.text) return null;

  return (
    <div
      className={`global-tooltip-container position-${tooltip.position} ${
        tooltip.visible ? "is-visible" : "is-hidden"
      }`}
      style={{
        top: `${tooltip.top}px`,
        left: `${tooltip.left}px`,
      }}
      role="tooltip"
      aria-hidden={!tooltip.visible}
    >
      <div className="global-tooltip-bubble">
        <span>{tooltip.text}</span>
      </div>
      <div className="global-tooltip-arrow" />
    </div>
  );
};

export default GlobalTooltip;
