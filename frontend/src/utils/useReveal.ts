import { useEffect } from "react";
import type { CSSProperties, RefObject } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Los elementos con data-reveal dentro de `rootRef` aparecen al llegar a ellos (styles/motion.css).
 * Sin JavaScript o con "reducir movimiento" no se pone la clase ge-motion y todo se ve desde el inicio.
 * `key` vuelve a buscar elementos nuevos, por ejemplo cuando llegan datos del servidor.
 */
export const useReveal = (rootRef: RefObject<HTMLElement | null>, key: unknown = 0) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || !("IntersectionObserver" in window)) return;
    root.classList.add("ge-motion");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    root.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef, key]);
};

/** Retraso escalonado para los hijos que aparecen uno tras otro */
export const revealDelay = (i: number) => ({ "--i": i }) as CSSProperties;
