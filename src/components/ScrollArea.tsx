import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

type ScrollAreaProps = {
  children: React.ReactNode;
  className?: string; // size/layout for the outer wrapper
  contentClassName?: string; // optional classes for the scrollable area
  autoHide?: boolean; // hide track until hover/scroll (default: false)
  minThumbSize?: number; // px
  stickToBottom?: boolean; // start at bottom and keep snapping when new content arrives
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

function isNearBottom(el: HTMLElement, threshold = 40) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}

export default function ScrollArea({
  children,
  className = "",
  contentClassName = "",
  autoHide = false,
  minThumbSize = 20,
  stickToBottom = true,
}: ScrollAreaProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [showTrack, setShowTrack] = useState(!autoHide);

  const recalc = () => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;

    const { scrollHeight, clientHeight, scrollTop } = el;
    const trackH = track.clientHeight;

    if (scrollHeight <= clientHeight) {
      setThumbHeight(0);
      setThumbTop(0);
      return;
    }

    const ratio = clientHeight / scrollHeight;
    const tHeight = Math.max(Math.round(trackH * ratio), minThumbSize);
    const maxThumbTop = trackH - tHeight;
    const maxScrollTop = scrollHeight - clientHeight;
    const tTop = Math.round((scrollTop / maxScrollTop) * maxThumbTop);

    setThumbHeight(tHeight);
    setThumbTop(clamp(tTop, 0, maxThumbTop));
  };

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  // keep thumb in sync with scroll
  const onScroll = () => {
    recalc();
    if (autoHide) {
      setShowTrack(true);
      window.clearTimeout((onScroll as any)._t);
      (onScroll as any)._t = window.setTimeout(() => setShowTrack(false), 800);
    }
  };

  // drag to scroll
  useEffect(() => {
    let dragging = false;
    let startY = 0;
    let startScrollTop = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-thumb]")) return;
      e.preventDefault();
      dragging = true;
      startY = e.clientY;
      startScrollTop = scrollRef.current!.scrollTop;
      document.body.style.userSelect = "none";
      if (autoHide) setShowTrack(true);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const el = scrollRef.current!;
      const track = trackRef.current!;
      const trackH = track.clientHeight;
      const maxThumbTop = Math.max(trackH - thumbHeight, 1);
      const maxScrollTop = Math.max(el.scrollHeight - el.clientHeight, 1);

      const deltaY = e.clientY - startY;
      const thumbDelta = deltaY;
      const scrollDelta = (thumbDelta / maxThumbTop) * maxScrollTop;

      el.scrollTop = clamp(startScrollTop + scrollDelta, 0, maxScrollTop);
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = "";
      if (autoHide) setShowTrack(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", endDrag);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", endDrag);
    };
  }, [thumbHeight, autoHide]);

  // recalc on mount & resize
  useLayoutEffect(() => {
    // First layout: ensure we start at bottom if requested
    requestAnimationFrame(() => {
      if (stickToBottom) scrollToBottom("auto");
      recalc();
    });

    const ro = new ResizeObserver(() => {
      const el = scrollRef.current;
      if (!el) return;
      const shouldStick = stickToBottom || isNearBottom(el);
      recalc();
      if (shouldStick) requestAnimationFrame(() => scrollToBottom("auto"));
    });

    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, [stickToBottom]);

  // also recalc when content changes via mutations
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const mo = new MutationObserver(() => {
      const shouldStick = stickToBottom || isNearBottom(el);
      recalc();
      if (shouldStick) requestAnimationFrame(() => scrollToBottom("smooth"));
    });

    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, [stickToBottom]);

  return (
    <div
      ref={wrapRef}
      className={`relative ${className}`}
      onMouseEnter={() => autoHide && setShowTrack(true)}
      onMouseLeave={() => autoHide && setShowTrack(false)}
    >
      {/* Scrollable content — hide native scrollbar */}
      <div
        ref={scrollRef}
        data-scrollarea // ← move attribute here
        onScroll={onScroll}
        className={`h-full overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] ${contentClassName}`} // ← add h-full
      >
        <style>{`[data-scrollarea]::-webkit-scrollbar { width: 0; height: 0; }`}</style>
        {children}
      </div>

      {/* Custom track + thumb (2px wide) */}
      <div
        ref={trackRef}
        className={`pointer-events-none absolute right-0 top-0 h-full w-[2px] rounded ${
          thumbHeight === 0
            ? "opacity-0"
            : autoHide
            ? showTrack
              ? "opacity-100"
              : "opacity-0"
            : "opacity-100"
        } transition-opacity duration-150`}
        style={{ background: "var(--track, #404040)" }} // neutral-700 default
      >
        <div
          data-thumb
          className="pointer-events-auto absolute left-0 w-[2px] rounded"
          style={{
            top: thumbTop,
            height: thumbHeight,
            background: "var(--thumb, #38bdf8)", // sky-400 default
          }}
          role="scrollbar"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        />
      </div>
    </div>
  );
}
