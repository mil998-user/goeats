import { useEffect } from "react";
import type { RefObject } from "react";
import { prefersReducedMotion } from "./useReveal";

/**
 * Los elementos con data-parallax="0.1" se mueven un poco distinto que la pagina al bajar.
 * Usa la propiedad CSS `translate`, que se suma al transform propio de cada elemento.
 * En celular y con "reducir movimiento" no hace nada.
 */
export const useParallax = (rootRef: RefObject<HTMLElement | null>, key: unknown = 0) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const wide = window.matchMedia("(min-width: 861px)");
    const items = [...root.querySelectorAll<HTMLElement>("[data-parallax]")];
    if (!items.length) return;
    let frame = 0;
    const paint = () => {
      frame = 0;
      for (const el of items) {
        if (!wide.matches) {
          el.style.translate = "";
          continue;
        }
        // Se mide el padre, que no se mueve: medir el propio elemento sumaria su desplazamiento anterior
        const box = (el.parentElement as HTMLElement).getBoundingClientRect();
        if (box.bottom < -200 || box.top > window.innerHeight + 200) continue;
        const fromCenter = box.top + box.height / 2 - window.innerHeight / 2;
        el.style.translate = `0 ${(fromCenter * Number(el.dataset.parallax)).toFixed(1)}px`;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [rootRef, key]);
};
