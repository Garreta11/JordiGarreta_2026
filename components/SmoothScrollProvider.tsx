"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import gsap from "gsap";
import { usePathname } from "next/navigation";

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes("/studio")) return;

    const isHomepage = pathname === "/";

    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 1,
      smoothWheel: true,
      infinite: isHomepage,
    });

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    (window as any).lenis = lenis;

    const handleKey = (e: KeyboardEvent) => {
      const step = 100;
      if (e.key === "ArrowUp") lenis.scrollTo(lenis.scroll - step, { duration: 0.2 });
      if (e.key === "ArrowDown") lenis.scrollTo(lenis.scroll + step, { duration: 0.2 });
    };
    window.addEventListener("keydown", handleKey);

    // Mouse drag — homepage only
    let isDragging = false;
    let startY = 0;
    let startScroll = 0;
    let lastY = 0;
    let lastTime = 0;

    const HISTORY_SIZE = 5;
    const velocityHistory: number[] = [];

    const recordVelocity = (v: number) => {
      velocityHistory.push(v);
      if (velocityHistory.length > HISTORY_SIZE) velocityHistory.shift();
    };

    const getAverageVelocity = () => {
      if (velocityHistory.length === 0) return 0;
      return velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length;
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startY = e.clientY;
      startScroll = window.scrollY;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityHistory.length = 0;
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const now = performance.now();
      const dt = Math.max(now - lastTime, 1);
      const frameVelocity = ((lastY - e.clientY) / dt) * 16;
      recordVelocity(frameVelocity);

      lastY = e.clientY;
      lastTime = now;

      const delta = (startY - e.clientY) * 5;
      window.scrollTo(0, startScroll + delta);
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // Let Lenis coast using averaged velocity
      const momentum = getAverageVelocity() * 40;
      lenis.scrollTo(window.scrollY + momentum, { lerp: 0.05 });
    };

    if (isHomepage) {
      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      gsap.ticker.remove(lenis.raf);
      lenis.destroy();
      delete (window as any).lenis;
      window.removeEventListener("keydown", handleKey);
      if (isHomepage) {
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      }
    };
  }, [pathname]);

  return <>{children}</>;
}