import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

/** Плавно «доезжает» до значения при изменении. */
export default function CountUp({
  value,
  duration = 900,
  format = (n) => Math.round(n).toLocaleString('ru-RU'),
  className,
}: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
