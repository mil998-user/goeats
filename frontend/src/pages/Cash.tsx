import { appConfirm } from "../components/AppDialogs";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { useSocket } from "../context/SocketContext";
import { ArrowUpRight, ArrowDownRight, Wallet, Calendar, DollarSign, PlusCircle, Loader2 } from "lucide-react";

interface CashRegister {
  id: number;
  name: string;
  isActive: boolean;
  sessions: Array<{
    id: number;
    user: { name: string };
  }>;
}

interface CashSession {
  id: number;
  openAmount: number;
  openTime: string;
  status: "OPEN" | "CLOSED";
  cashRegister: { name: string };
  user: { name: string };
}

interface Transaction {
  id: number;
  type: "SALE" | "EXPENSE" | "INCOME";
  amount: number;
  cashAmount?: number;
  cashTip?: number;
  description: string;
  createdAt: string;
}

export const Cash: React.FC = () => {
  const { socket } = useSocket();
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Opening form states
  const [selectedRegisterId, setSelectedRegisterId] = useState("");
  const [openAmount, setOpenAmount] = useState("");

  // Closing form states
  const [closeAmount, setCloseAmount] = useState("");

  // Expense/Income form states
  const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txCategory, setTxCategory] = useState("Otro"); // Compras, Servicios, Remuneración, Crédito, Otro

  const fetchSessionData = async () => {
    try {
      const sessionRes = await apiRequest("/cash/sessions/active");
      if (sessionRes.session) {
        setActiveSession(sessionRes.session);
        // Load transactions for this session
        const txRes = await apiRequest(`/cash/sessions/${sessionRes.session.id}/transactions`);
        
        const unifiedTx: Transaction[] = [];
        if (txRes.transactions) {
          const { sales = [], expenses = [], incomes = [] } = txRes.transactions;
          
          sales.forEach((s: any) => {
            unifiedTx.push({
              id: s.id,
              type: "SALE",
              amount: s.total,
              cashAmount: s.paymentCash,
              // Tip paid in cash: it is in the drawer but belongs to the waiter, not to the sale
              cashTip: s.paymentMethod === "01" ? Number(s.order?.tipAmount || 0) : 0,
              description: `Venta #${s.id} (${s.paymentCard > 0 ? "Tarjeta" : "Efectivo"})${Number(s.order?.tipAmount || 0) > 0 ? ` + propina $${Number(s.order.tipAmount).toFixed(2)}` : ""}`,
              createdAt: s.createdAt
            });
          });
          
          expenses.forEach((e: any) => {
            unifiedTx.push({
              id: e.id,
              type: "EXPENSE",
              amount: e.amount,
              description: e.description,
              createdAt: e.createdAt
            });
          });
          
          incomes.forEach((inc: any) => {
            unifiedTx.push({
              id: inc.id,
              type: "INCOME",
              amount: inc.amount,
              description: inc.description,
              createdAt: inc.createdAt
            });
          });
          
          unifiedTx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        
        setTransactions(unifiedTx);
      } else {
        setActiveSession(null);
        // Load cash registers to open one
        const regRes = await apiRequest("/cash/registers");
        setRegisters(regRes.registers || []);
      }
    } catch (error) {
      console.error("Error loading cash session data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleCashSessionChange = () => {
      fetchSessionData();
    };
    socket.on("cash-session-changed", handleCashSessionChange);
    return () => {
      socket.off("cash-session-changed", handleCashSessionChange);
    };
  }, [socket]);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegisterId || !openAmount) return;
    setLoading(true);
    try {
      const res = await apiRequest("/cash/sessions/open", {
        method: "POST",
        body: JSON.stringify({
          cashRegisterId: selectedRegisterId,
          openAmount: parseFloat(openAmount)
        })
      });
      if (res.message) {
        alert(res.message);
      }
      setOpenAmount("");
      setSelectedRegisterId("");
      await fetchSessionData();
    } catch (error: any) {
      alert(error.message || "Error al abrir la caja");
      setLoading(false);
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeAmount) return;
    if (!(await appConfirm("¿Está seguro de que desea cerrar la sesión de caja actual?"))) return;
    setLoading(true);
    try {
      const res = await apiRequest("/cash/sessions/close", {
        method: "POST",
        body: JSON.stringify({
          closeAmount: parseFloat(closeAmount)
        })
      });
      setCloseAmount("");
      alert(`Caja cerrada. Monto esperado por sistema: $${res.session.systemAmount.toFixed(2)}. Reportado: $${res.session.closeAmount.toFixed(2)}.`);
      await fetchSessionData();
    } catch (error: any) {
      alert(error.message || "Error al cerrar la caja");
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txDescription) return;
    setLoading(true);
    try {
      const endpoint = transactionType === "expense" ? "/cash/expenses" : "/cash/incomes";
      const body: any = {
        amount: parseFloat(txAmount),
        description: txDescription
      };
      if (transactionType === "expense") {
        body.category = txCategory;
      }
      await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
      });
      setTxAmount("");
      setTxDescription("");
      await fetchSessionData();
    } catch (error: any) {
      alert(error.message || "Error al registrar movimiento");
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!activeSession) return { cashSales: 0, cashTips: 0, expenses: 0, incomes: 0, expected: 0 };
    const cashSales = transactions
      .filter(t => t.type === "SALE")
      .reduce((sum, t) => sum + (t.cashAmount ?? 0), 0);
    const cashTips = transactions
      .filter(t => t.type === "SALE")
      .reduce((sum, t) => sum + (t.cashTip ?? 0), 0);
    const expenses = transactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    const incomes = transactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const expected = activeSession.openAmount + cashSales + cashTips - expenses + incomes;

    return { cashSales, cashTips, expenses, incomes, expected };
  };

  const totals = calculateTotals();

  if (loading && !activeSession && registers.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px", backgroundColor: "var(--bg-primary)", minHeight: "100vh" }}>
        <Loader2 className="spinner" size={48} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "clamp(12px, 3vw, 25px)", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "clamp(20px, 4vw, 28px)", margin: 0 }}>Control de Caja Registradora</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
          Administre la apertura, cierre y flujos de efectivo de su punto de venta.
        </p>
      </div>

      {!activeSession ? (
        /* OPEN SESSION VIEW */
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div className="glass-card" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "var(--warning-glow)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "15px",
                color: "var(--warning)"
              }}>
                <Wallet size={28} />
              </div>
              <h2>Apertura de Turno / Caja</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "5px" }}>
                Registre el saldo inicial en efectivo para comenzar a operar.
              </p>
            </div>

            <form onSubmit={handleOpenSession}>
              <div className="input-group">
                <label>Seleccionar Caja Registradora</label>
                <select
                  value={selectedRegisterId}
                  onChange={(e) => setSelectedRegisterId(e.target.value)}
                  className="input-field"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    cursor: "pointer"
                  }}
                  required
                >
                  <option value="" style={{ backgroundColor: "var(--bg-secondary)" }}>-- Seleccione una Caja --</option>
                  {registers.map(reg => {
                    const isBusy = reg.sessions && reg.sessions.length > 0;
                    return (
                      <option
                        key={reg.id}
                        value={reg.id}
                        disabled={!reg.isActive}
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                      >
                        {reg.name} {isBusy ? `(Abierta por ${reg.sessions[0].user.name} - Se vinculará automáticamente)` : ""} {!reg.isActive ? "(Inactiva)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: "30px" }}>
                <label>Monto de Apertura (Efectivo en USD)</label>
                <div style={{ position: "relative" }}>
                  <DollarSign size={18} style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }} />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="input-field"
                    style={{ paddingLeft: "45px" }}
                    value={openAmount}
                    onChange={(e) => setOpenAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="glow-btn"
                style={{ width: "100%", padding: "14px" }}
              >
                Abrir Caja y Empezar Turno
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ACTIVE SESSION VIEW */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: "20px",
          alignItems: "start"
        }}>
          {/* Box Metrics & Closing form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "clamp(16px, 2.5vw, 30px)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <span style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--success)",
                    backgroundColor: "var(--success-glow)",
                    padding: "4px 10px",
                    borderRadius: "20px"
                  }}>
                    Sesión Activa
                  </span>
                  <h2 style={{ fontSize: "20px", marginTop: "12px" }}>{activeSession.cashRegister.name}</h2>
                </div>
                <div style={{ color: "var(--text-muted)", textAlign: "right", fontSize: "13px" }}>
                  <div>Abierta por: {activeSession.user.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                    <Calendar size={12} />
                    {new Date(activeSession.openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginBottom: "25px"
              }}>
                <div style={{ padding: "15px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Monto Apertura</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                    ${activeSession.openAmount.toFixed(2)}
                  </div>
                </div>
                <div style={{ padding: "15px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Ventas Efectivo</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--success)", marginTop: "4px" }}>
                    +${totals.cashSales.toFixed(2)}
                  </div>
                </div>
                <div style={{ padding: "15px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Egresos / Gastos</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--danger)", marginTop: "4px" }}>
                    -${totals.expenses.toFixed(2)}
                  </div>
                </div>
                <div style={{ padding: "15px", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Ingresos Varios</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--warning)", marginTop: "4px" }}>
                    +${totals.incomes.toFixed(2)}
                  </div>
                </div>
              </div>

              {totals.cashTips > 0 && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 15px" }}>
                  Incluye <strong>${totals.cashTips.toFixed(2)}</strong> de propinas en efectivo para los meseros.
                  No son ventas ni van en la factura; al entregarlas, regístralas como egreso.
                </p>
              )}

              <div style={{
                padding: "20px",
                background: "var(--accent-gradient)",
                borderRadius: "var(--radius-md)",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "14px", color: "#ffffff", opacity: 0.9 }}>Saldo Estimado en Caja</div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", marginTop: "5px" }}>
                  ${totals.expected.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Closing session form */}
            <div className="glass-card" style={{ padding: "30px", borderRadius: "var(--radius-md)" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>Cierre de Caja</h3>
              <form onSubmit={handleCloseSession}>
                <div className="input-group" style={{ marginBottom: "20px" }}>
                  <label>Efectivo Real en Caja (USD)</label>
                  <div style={{ position: "relative" }}>
                    <DollarSign size={18} style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)"
                    }} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field"
                      style={{ paddingLeft: "45px" }}
                      placeholder="Cuente el efectivo físico"
                      value={closeAmount}
                      onChange={(e) => setCloseAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="glow-btn"
                  style={{ width: "100%", padding: "12px" }}
                >
                  Confirmar y Cerrar Caja
                </button>
              </form>
            </div>
          </div>

          {/* Expenses/Incomes panel and Session Logs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {/* Add Expense/Income form */}
            <div className="glass-card" style={{ padding: "30px", borderRadius: "var(--radius-md)" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>Registrar Movimiento de Caja</h3>
              
              <div style={{
                display: "flex",
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-sm)",
                padding: "3px",
                marginBottom: "20px"
              }}>
                <button
                  onClick={() => setTransactionType("expense")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: transactionType === "expense" ? "var(--accent-primary)" : "transparent",
                    color: transactionType === "expense" ? "#ffffff" : "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <ArrowDownRight size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                  Egreso / Gasto
                </button>
                <button
                  onClick={() => setTransactionType("income")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: transactionType === "income" ? "var(--success)" : "transparent",
                    color: transactionType === "income" ? "#ffffff" : "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <ArrowUpRight size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                  Ingreso Extra
                </button>
              </div>

              <form onSubmit={handleAddTransaction}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div className="input-group">
                    <label>Monto (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="input-field"
                      placeholder="0.00"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      required
                    />
                  </div>

                  {transactionType === "expense" ? (
                    <div className="input-group">
                      <label>Categoría</label>
                      <select
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                        className="input-field"
                        style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                      >
                        <option value="Compras">Compras</option>
                        <option value="Servicios">Servicios</option>
                        <option value="Remuneración">Remuneración</option>
                        <option value="Crédito">Crédito</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  ) : (
                    <div className="input-group">
                      <label>Categoría</label>
                      <input
                        type="text"
                        className="input-field"
                        value="Otros Ingresos"
                        disabled
                      />
                    </div>
                  )}
                </div>

                <div className="input-group" style={{ marginBottom: "20px" }}>
                  <label>Descripción / Motivo</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. Pago de luz, compras de verduras..."
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="secondary-btn"
                  style={{
                    width: "100%",
                    padding: "12px",
                    color: transactionType === "expense" ? "var(--accent-primary)" : "var(--success)",
                    backgroundColor: transactionType === "expense" ? "var(--accent-glow)" : "var(--success-glow)",
                    borderColor: transactionType === "expense" ? "var(--accent-primary)" : "var(--success)"
                  }}
                >
                  <PlusCircle size={16} style={{ marginRight: "6px" }} />
                  Registrar Movimiento
                </button>
              </form>
            </div>

            {/* Session Logs / Transactions list */}
            <div className="glass-card" style={{ padding: "30px", borderRadius: "var(--radius-md)" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>Historial de Movimientos de la Sesión</h3>
              
              <div style={{
                maxHeight: "300px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                {transactions.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
                    No hay movimientos registrados en esta sesión.
                  </p>
                ) : (
                  transactions.map(tx => (
                    <div
                      key={tx.id}
                      style={{
                        padding: "12px",
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>{tx.description}</div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                          {tx.type === "SALE" ? "Venta (POS)" : tx.type === "EXPENSE" ? "Gasto" : "Ingreso Extra"} • {" "}
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: tx.type === "EXPENSE" ? "var(--danger)" : "var(--success)"
                      }}>
                        {tx.type === "EXPENSE" ? "-" : "+"}${tx.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
