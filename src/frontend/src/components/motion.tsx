import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Motion primitives
 *   <Reveal>  scroll-triggered fade-up (IntersectionObserver, SSR-safe)
 *   <CountUp> eased number ticker that starts when scrolled into view
 * --------------------------------------------------------------------------- */

export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
  id,
  "aria-labelledby": ariaLabelledBy,
}: {
  children: ReactNode;
  /** stagger offset in ms */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "header";
  id?: string;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // biome-ignore lint/suspicious/noExplicitAny: polymorphic ref
      ref={ref as any}
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn("reveal-init", visible && "revealed", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1400,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: snap straight to the final value, no rAF loop.
    if (reduced) {
      setDisplay(value);
      return;
    }

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        setDisplay(value * easeOutExpo(p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration, reduced]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {display.toLocaleString("en-GB", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/** Infinite horizontal scroll — duplicate children for seamless loop */
export function Marquee({
  children,
  className,
  speed = "normal",
}: {
  children: ReactNode;
  className?: string;
  speed?: "slow" | "normal" | "fast";
}) {
  const duration = speed === "slow" ? "40s" : speed === "fast" ? "18s" : "28s";
  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="flex w-max animate-marquee gap-8" style={{ animationDuration: duration }}>
        {children}
        {children}
      </div>
    </div>
  );
}

/** Cycle through indices on an interval — pauses when reduced motion */
export function useRotatingIndex(length: number, ms: number, enabled = true) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!enabled || length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % length);
    }, ms);
    return () => window.clearInterval(id);
  }, [length, ms, enabled]);
  return index;
}

/** Respect prefers-reduced-motion in JS-driven animations */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Pulsing live indicator with expanding ring */
export function LiveDot({
  tone = "success",
  className,
}: {
  tone?: "success" | "primary" | "warning" | "violet";
  className?: string;
}) {
  const colors =
    tone === "primary"
      ? "bg-primary"
      : tone === "warning"
        ? "bg-amber-400"
        : tone === "violet"
          ? "bg-violet-500"
          : "bg-emerald-500";
  return (
    <span className={cn("relative inline-flex size-2", className)}>
      <span
        className={cn("absolute inset-0 rounded-full opacity-40 animate-pulse-ring", colors)}
        aria-hidden
      />
      <span className={cn("relative size-2 rounded-full", colors)} aria-hidden />
    </span>
  );
}
