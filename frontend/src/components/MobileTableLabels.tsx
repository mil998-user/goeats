import { useEffect } from "react";

// On phones, tables with class "mobile-cards" are shown as cards.
// Each cell shows its column name, taken from the table header.
function labelTables() {
  document.querySelectorAll("table.mobile-cards").forEach((table) => {
    const heads = Array.from(table.querySelectorAll("thead th")).map((th) => (th.textContent || "").trim());
    table.querySelectorAll("tbody tr").forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        // A cell spanning several columns (an empty-list message) gets no label
        if ((cell as HTMLTableCellElement).colSpan > 1) return;
        if (heads[index] && cell.getAttribute("data-label") !== heads[index]) {
          cell.setAttribute("data-label", heads[index]);
        }
      });
    });
  });
}

export function MobileTableLabels() {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        labelTables();
      });
    };
    labelTables();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
