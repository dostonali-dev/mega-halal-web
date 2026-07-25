"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const EDGE_ZONE_PX = 28;
const TRIGGER_DISTANCE_PX = 70;
const MAX_VERTICAL_DRIFT_PX = 60;

export default function EdgeSwipeBack() {
  const router = useRouter();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (touch.clientX <= EDGE_ZONE_PX) {
        startX.current = touch.clientX;
        startY.current = touch.clientY;
        triggered.current = false;
      } else {
        startX.current = null;
        startY.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startX.current === null || startY.current === null || triggered.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - startX.current;
      const dy = Math.abs(touch.clientY - startY.current);
      if (dx > TRIGGER_DISTANCE_PX && dy < MAX_VERTICAL_DRIFT_PX) {
        triggered.current = true;
        router.back();
      }
    };

    const onTouchEnd = () => {
      startX.current = null;
      startY.current = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [router]);

  return null;
}
