import { useEffect } from "react";
import type { RefObject } from "react";

// Dibujos con muchas partes moviendose: los redibuja el procesador en cada cuadro
const HEAVY = ".gl-ill-svg, .gs-sofa, .gs-loja-rider";

/**
 * Para que el scroll sea fluido, los dibujos pesados se congelan mientras se baja
 * y las animaciones de cada seccion se detienen cuando no se ve.
 * Pausa las animaciones directamente: con clases CSS habria que recalcular los estilos de toda la seccion.
 */
export const useCalmScroll = (rootRef: RefObject<HTMLElement | null>, key: unknown = 0) => {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window) || !root.getAnimations) return;

    const visible = new Set<Element>();
    let moving = false;
    let timer = 0;

    const run = (section: Element, play: boolean) => {
      for (const animation of section.getAnimations({ subtree: true })) {
        // Solo las que se repiten: las de entrada y las que siguen al scroll no se tocan
        if (animation.effect?.getTiming().iterations !== Infinity) continue;
        const target = (animation.effect as KeyframeEffect).target;
        const go = play && !(moving && target?.closest(HEAVY));
        if (go && animation.playState === "paused") animation.play();
        else if (!go && animation.playState === "running") animation.pause();
      }
    };

    const onScroll = () => {
      if (!moving) {
        moving = true;
        visible.forEach((section) => run(section, true));
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        moving = false;
        visible.forEach((section) => run(section, true));
      }, 180);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
          run(entry.target, entry.isIntersecting);
        }
      },
      { rootMargin: "80px 0px" }
    );
    root.querySelectorAll("main > section").forEach((section) => observer.observe(section));
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [rootRef, key]);
};
