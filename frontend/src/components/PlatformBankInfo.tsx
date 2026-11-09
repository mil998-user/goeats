import React from "react";

// GoEats' own bank account (wallet top-ups and Plus). It comes from the build settings,
// never from invented numbers; without it the screen says so plainly.
const env = (import.meta as any).env || {};
export const PLATFORM_BANK = {
  bank: env.VITE_PLATFORM_BANK_NAME || "",
  accountType: env.VITE_PLATFORM_BANK_TYPE || "",
  number: env.VITE_PLATFORM_BANK_ACCOUNT || "",
  owner: env.VITE_PLATFORM_BANK_OWNER || "",
  ruc: env.VITE_PLATFORM_BANK_RUC || "",
};
export const platformBankReady = Boolean(PLATFORM_BANK.bank && PLATFORM_BANK.number && PLATFORM_BANK.owner);

export const PlatformBankInfo: React.FC = () => {
  const box: React.CSSProperties = {
    fontSize: "15px",
    lineHeight: 1.5,
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid var(--border-light)",
    overflowWrap: "anywhere",
  };
  if (!platformBankReady) {
    return (
      <div data-testid="platform-bank" style={box}>
        La cuenta bancaria de GoEats todavía no está configurada. Por ahora no transfieras; usa otro método o escribe a soporte.
      </div>
    );
  }
  return (
    <div data-testid="platform-bank" style={box}>
      <strong>Cuenta de GoEats</strong>
      <div>{PLATFORM_BANK.bank}{PLATFORM_BANK.accountType ? ` · ${PLATFORM_BANK.accountType}` : ""}</div>
      <div>Número: {PLATFORM_BANK.number}</div>
      <div>Titular: {PLATFORM_BANK.owner}</div>
      {PLATFORM_BANK.ruc && <div>RUC: {PLATFORM_BANK.ruc}</div>}
    </div>
  );
};
