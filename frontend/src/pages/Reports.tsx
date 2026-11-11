import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { RestaurantRatings } from "../components/RestaurantRatings";
import {
  TrendingUp,
  Award,
  DollarSign,
  Coffee,
  ShoppingBag,
  Clock,
  Loader2,
  Calendar,
  Sparkles,
  ChevronRight
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface DashboardData {
  salesHistory: Array<{
    dayName: string;
    dayOfWeek: number;
    dateString: string;
    total: number;
    targetAmount: number;
  }>;
  indicators: {
    todaySales: number;
    activeTables: number;
    pendingOrders: number;
  };
  topSellingToday: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
}

interface CookStat {
  id: number;
  name: string;
  dishCount: number;
}

interface WaiterStat {
  id: number;
  name: string;
  orderCount: number;
  salesTotal: number;
  tipsTotal?: number;
}

interface ProductStat {
  id: number;
  name: string;
  quantity: number;
  salesTotal: number;
}

export const Reports: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [waiters, setWaiters] = useState<WaiterStat[]>([]);
  const [cooks, setCooks] = useState<CookStat[]>([]);
  const [products, setProducts] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchReports = async () => {
    try {
      setLoading(true);
      const dash = await apiRequest("/reports/dashboard");
      setData(dash.dashboard);

      const params = { startDate, endDate };
      const wait = await apiRequest("/reports/waiters", { params });
      setWaiters(wait.waiters || []);
      setCooks(wait.cooks || []);

      const prod = await apiRequest("/reports/products", { params });
      setProducts(prod.products || []);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  if (loading && !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px", backgroundColor: "var(--bg-primary)", minHeight: "100vh" }}>
        <Loader2 className="spinner" size={48} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const indicators = data?.indicators || { todaySales: 0, activeTables: 0, pendingOrders: 0 };
  const history = data?.salesHistory || [];
  const topSellingToday = data?.topSellingToday || [];

  return (
    <div style={{ padding: "30px", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Header and Filter */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div>
          <h1 style={{ fontSize: "28px" }}>Tablero de Control e Informes</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Estadísticas de venta, metas y rendimiento de personal en tiempo real.
          </p>
        </div>

        {/* Date Filter Form */}
        <div className="glass-card" style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          padding: "10px 15px",
          borderRadius: "var(--radius-sm)",
          maxWidth: "100%",
          boxSizing: "border-box"
        }}>
          <Calendar size={16} style={{ color: "var(--text-muted)" }} />
          <input
            type="date"
            className="input-field"
            aria-label="Desde"
            style={{ flex: "1 1 130px", minWidth: 0, width: "auto", padding: "4px 8px", fontSize: "13px", border: "none", background: "none" }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
          <input
            type="date"
            className="input-field"
            aria-label="Hasta"
            style={{ flex: "1 1 130px", minWidth: 0, width: "auto", padding: "4px 8px", fontSize: "13px", border: "none", background: "none" }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        {/* KPI 1 */}
        <div className="glass-card" style={{ padding: "20px", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Ventas del Día</span>
            <div style={{ backgroundColor: "var(--success-glow)", color: "var(--success)", padding: "8px", borderRadius: "8px" }}>
              <DollarSign size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "28px", marginTop: "15px" }}>${indicators.todaySales.toFixed(2)}</h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "5px" }}>Efectivo + Tarjeta hoy</p>
        </div>

        {/* KPI 2 */}
        <div className="glass-card" style={{ padding: "20px", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Mesas Ocupadas</span>
            <div style={{ backgroundColor: "var(--warning-glow)", color: "var(--warning)", padding: "8px", borderRadius: "8px" }}>
              <Coffee size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "28px", marginTop: "15px" }}>{indicators.activeTables}</h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "5px" }}>Clientes en mesa activos</p>
        </div>

        {/* KPI 3 */}
        <div className="glass-card" style={{ padding: "20px", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Pedidos Pendientes</span>
            <div style={{ backgroundColor: "rgba(255, 71, 87, 0.15)", color: "var(--accent-primary)", padding: "8px", borderRadius: "8px" }}>
              <Clock size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: "28px", marginTop: "15px" }}>{indicators.pendingOrders}</h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "5px" }}>En espera en el KDS</p>
        </div>
      </div>

      {/* Main Section: Sales History Chart */}
      <div className="reports-grid" style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "30px",
        marginBottom: "30px",
        alignItems: "start"
      }}>
        {/* Sales vs Target chart */}
        <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-md)" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={18} style={{ color: "var(--accent-primary)" }} />
            Ventas de la Última Semana vs Metas Diarias
          </h3>
          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="dayName" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-light)",
                    color: "var(--text-primary)",
                    borderRadius: "var(--radius-sm)"
                  }}
                  itemStyle={{ color: "var(--text-primary)" }}
                  labelStyle={{ color: "var(--text-secondary)" }}
                />
                <Legend />
                <Area name="Ventas ($)" type="monotone" dataKey="total" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area name="Meta diaria ($)" type="monotone" dataKey="targetAmount" stroke="var(--success)" fillOpacity={1} fill="url(#colorTarget)" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Today */}
        <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-md)" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} style={{ color: "var(--warning)" }} />
            Lo Más Vendido Hoy
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {topSellingToday.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                Aún no hay ventas registradas el día de hoy.
              </p>
            ) : (
              topSellingToday.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-sm)"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Cant: {item.quantity} unidades
                    </div>
                  </div>
                  <strong style={{ color: "var(--success)", fontSize: "14px" }}>
                    ${item.total.toFixed(2)}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Waiters performance & Top products by range */}
      <div className="reports-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "30px",
        alignItems: "start",
        flexWrap: "wrap"
      }}>
        {/* Waiter report */}
        <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-md)" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Award size={18} style={{ color: "var(--accent-secondary)" }} />
            Rendimiento de Meseros (Mozo)
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "10px" }}>Mesero</th>
                  <th style={{ padding: "10px", textAlign: "center" }}>Pedidos Servidos</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Total Ventas (USD)</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Propinas (USD)</th>
                </tr>
              </thead>
              <tbody>
                {waiters.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      Sin datos en el rango seleccionado
                    </td>
                  </tr>
                ) : (
                  waiters.map(waiter => (
                    <tr key={waiter.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "10px", fontWeight: 600 }}>{waiter.name}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>{waiter.orderCount}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: "var(--success)", fontWeight: 700 }}>
                        ${waiter.salesTotal.toFixed(2)}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>
                        ${(waiter.tipsTotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: "16px", margin: "25px 0 12px" }}>Platos preparados en cocina</h3>
          <div style={{ overflowX: "auto" }}>
            <table data-testid="cooks-report" className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "10px" }}>Cocinero</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Platos preparados</th>
                </tr>
              </thead>
              <tbody>
                {cooks.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      Sin datos en el rango seleccionado
                    </td>
                  </tr>
                ) : (
                  cooks.map((cook) => (
                    <tr key={cook.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "10px", fontWeight: 600 }}>{cook.name}</td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{cook.dishCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product sales in range */}
        <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-md)" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingBag size={18} style={{ color: "var(--success)" }} />
            Productos Vendidos en el Rango
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "10px" }}>Producto</th>
                  <th style={{ padding: "10px", textAlign: "center" }}>Cantidad Vendida</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Total Recaudado (USD)</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      Sin datos en el rango seleccionado
                    </td>
                  </tr>
                ) : (
                  products.map(prod => (
                    <tr key={prod.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "10px", fontWeight: 600 }}>{prod.name}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>{prod.quantity}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: "var(--success)", fontWeight: 700 }}>
                        ${prod.salesTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RestaurantRatings />
    </div>
  );
};
