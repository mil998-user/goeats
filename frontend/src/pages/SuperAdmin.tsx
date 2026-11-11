import { appConfirm } from "../components/AppDialogs";
import React, { useEffect, useState } from "react";
import { DeliveryIncidentsPanel } from "../components/DeliveryIncidentsPanel";
import { UnassignedDeliveries } from "../components/UnassignedDeliveries";
import { StarAverage } from "../components/Stars";
import { apiRequest } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Store,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Globe,
  LogOut,
  Truck,
  DollarSign,
  Tag,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  Check,
  X,
  Phone,
} from "lucide-react";
import { EmailNotificationsTab } from "../components/admin/EmailNotificationsTab";
import { systemIconForEmoji, systemTextWithIcons } from "../utils/systemIcons";


interface Restaurant {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  status?: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  createdAt: string;
  users: Array<{
    id: number;
    username: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    isActive?: boolean;
  }>;
}

export const SuperAdmin: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Modal State for New Restaurant
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // New tab state
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "restaurants") as "restaurants" | "approvals" | "delivery" | "wallet" | "saas_customers" | "saas_plans" | "saas_orders" | "saas_categories" | "emails";

  // Restaurant Approval states
  const [restaurantStatusFilter, setRestaurantStatusFilter] = useState<"ALL" | "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED">("ALL");
  const [selectedApproveRestaurant, setSelectedApproveRestaurant] = useState<Restaurant | null>(null);
  const [approvingRestaurant, setApprovingRestaurant] = useState(false);
  const [selectedRejectRestaurant, setSelectedRejectRestaurant] = useState<Restaurant | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingRestaurant, setRejectingRestaurant] = useState(false);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);

  // Recharge modal states
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeDescription, setRechargeDescription] = useState("");
  const [recharging, setRecharging] = useState(false);

  // Rate config form states
  const [selectedRate, setSelectedRate] = useState<any | null>(null);
  const [rateName, setRateName] = useState("");
  const [rateBasePrice, setRateBasePrice] = useState("1.00");
  const [ratePricePerKm, setRatePricePerKm] = useState("0.50");
  const [rateCostPerOrder, setRateCostPerOrder] = useState("0.50");
  const [rateIsActive, setRateIsActive] = useState(true);
  const [rateBalanceRule, setRateBalanceRule] = useState<"PREPAID" | "DEBT_LIMIT">("PREPAID");
  const [savingRate, setSavingRate] = useState(false);
  const [ratePlusDriverBonus, setRatePlusDriverBonus] = useState("0.50");
  const [rateRadiusKm, setRateRadiusKm] = useState("5");
  const [rateWaitMin, setRateWaitMin] = useState("3");

  // SaaS States
  const [saasCustomers, setSaasCustomers] = useState<any[]>([]);
  const [saasOrders, setSaasOrders] = useState<any[]>([]);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);

  // SaaS Categories States
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryDesc, setEditingCategoryDesc] = useState("");

  const [newSubcategoryNames, setNewSubcategoryNames] = useState<{ [catId: number]: string }>({});
  const [editingSubcategory, setEditingSubcategory] = useState<any | null>(null);
  const [editingSubcategoryName, setEditingSubcategoryName] = useState("");

  // SaaS Plans States
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState("PLUS_SUBSCRIPTION");
  const [planAmount, setPlanAmount] = useState("");
  const [planPeriod, setPlanPeriod] = useState("");
  const [planDiscount, setPlanDiscount] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await apiRequest("/saas-categories");
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (err) {
      console.error("Error loading categories", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await apiRequest("/saas-categories", {
        method: "POST",
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc })
      });
      if (res.success) {
        setNewCategoryName("");
        setNewCategoryDesc("");
        loadCategories();
      }
    } catch (err: any) {
      alert(err.message || "Error al crear categoría");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategoryName.trim()) return;
    try {
      const res = await apiRequest(`/saas-categories/${editingCategory.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editingCategoryName, description: editingCategoryDesc })
      });
      if (res.success) {
        setEditingCategory(null);
        setEditingCategoryName("");
        setEditingCategoryDesc("");
        loadCategories();
      }
    } catch (err: any) {
      alert(err.message || "Error al actualizar categoría");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!(await appConfirm("¿Seguro que desea eliminar esta categoría? Se eliminarán todas las subcategorías asociadas."))) return;
    try {
      const res = await apiRequest(`/saas-categories/${id}`, { method: "DELETE" });
      if (res.success) {
        loadCategories();
      }
    } catch (err: any) {
      alert(err.message || "Error al eliminar categoría");
    }
  };

  const handleCreateSubcategory = async (catId: number) => {
    const subName = newSubcategoryNames[catId];
    if (!subName || !subName.trim()) return;
    try {
      const res = await apiRequest(`/saas-categories/${catId}/subcategories`, {
        method: "POST",
        body: JSON.stringify({ name: subName })
      });
      if (res.success) {
        setNewSubcategoryNames(prev => ({ ...prev, [catId]: "" }));
        loadCategories();
      }
    } catch (err: any) {
      alert(err.message || "Error al crear subcategoría");
    }
  };

  const handleUpdateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory || !editingSubcategoryName.trim()) return;
    try {
      const res = await apiRequest(`/saas-categories/subcategories/${editingSubcategory.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editingSubcategoryName })
      });
      if (res.success) {
        setEditingSubcategory(null);
        setEditingSubcategoryName("");
        loadCategories();
      }
    } catch (err: any) {
      alert(err.message || "Error al actualizar subcategoría");
    }
  };

  const handleDeleteSubcategory = async (subId: number) => {
    if (!(await appConfirm("¿Seguro que desea eliminar esta subcategoría?"))) return;
    try {
      const res = await apiRequest(`/saas-categories/subcategories/${subId}`, { method: "DELETE" });
      if (res.success) {
        loadCategories();
      }
    } catch (err: any) {
      alert(err.message || "Error al eliminar subcategoría");
    }
  };

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await apiRequest("/saas/plans");
      if (res.success) {
        setPlans(res.plans || []);
      }
    } catch (err) {
      console.error("Error loading SaaS plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !planType || !planAmount || !planDescription) {
      alert("Por favor completa los campos requeridos");
      return;
    }
    setSavingPlan(true);
    try {
      const url = selectedPlan ? `/saas/plans/${selectedPlan.id}` : "/saas/plans";
      const method = selectedPlan ? "PUT" : "POST";
      const res = await apiRequest(url, {
        method,
        body: JSON.stringify({
          name: planName,
          type: planType,
          amount: parseFloat(planAmount),
          period: planType === "PLUS_SUBSCRIPTION" ? planPeriod : null,
          discount: planType === "PLUS_SUBSCRIPTION" ? planDiscount : null,
          description: planDescription
        })
      });
      if (res.success) {
        alert("Plan guardado con éxito.");
        setSelectedPlan(null);
        setPlanName("");
        setPlanType("PLUS_SUBSCRIPTION");
        setPlanAmount("");
        setPlanPeriod("");
        setPlanDiscount("");
        setPlanDescription("");
        loadPlans();
      }
    } catch (err: any) {
      alert(err.message || "Error al guardar plan");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setPlanType(plan.type);
    setPlanAmount(plan.amount.toString());
    setPlanPeriod(plan.period || "");
    setPlanDiscount(plan.discount || "");
    setPlanDescription(plan.description);
  };

  const handleDeletePlan = async (id: number) => {
    if (!(await appConfirm("¿Seguro que deseas eliminar este plan?"))) return;
    try {
      const res = await apiRequest(`/saas/plans/${id}`, { method: "DELETE" });
      if (res.success) {
        alert("Plan eliminado con éxito.");
        loadPlans();
      }
    } catch (err: any) {
      alert(err.message || "Error al eliminar plan");
    }
  };

  const loadSaasCustomers = async () => {
    try {
      const res = await apiRequest("/saas/customers");
      if (res.success) {
        setSaasCustomers(res.customers || []);
      }
    } catch (err) {
      console.error("Error loading customer users:", err);
    }
  };

  const loadSaasOrders = async () => {
    try {
      const res = await apiRequest("/saas/orders");
      if (res.success) {
        setSaasOrders(res.orders || []);
      }
    } catch (err) {
      console.error("Error loading SaaS orders:", err);
    }
  };

  const handleToggleCustomerPlus = async (customerId: number) => {
    try {
      const res = await apiRequest(`/saas/customers/${customerId}/toggle-plus`, {
        method: "POST"
      });
      if (res.success) {
        alert("Estado GoEats Plus actualizado.");
        loadSaasCustomers();
      }
    } catch (err: any) {
      alert(err.message || "Error al actualizar membresía Plus");
    }
  };

  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null);

  const handleDeleteCustomer = async (customerId: number, customerName: string, customerUsername: string) => {
    const confirmMessage = `¿Estás seguro de que deseas eliminar permanentemente al cliente "${customerName}" (@${customerUsername})?\n\nEsta acción borrará la cuenta del cliente de forma irreversible.`;
    if (!(await appConfirm(confirmMessage))) {
      return;
    }

    try {
      setDeletingCustomerId(customerId);
      const res = await apiRequest(`/saas/customers/${customerId}`, {
        method: "DELETE",
      });
      if (res.success) {
        alert(res.message || "Cliente eliminado exitosamente.");
        loadSaasCustomers();
      }
    } catch (err: any) {
      alert("Error al eliminar cliente: " + (err.message || "Ocurrió un error inesperado"));
    } finally {
      setDeletingCustomerId(null);
    }
  };

  const handleApproveSaaSOrder = async (orderId: number) => {
    try {
      const res = await apiRequest(`/saas/orders/${orderId}/approve`, {
        method: "POST"
      });
      if (res.success) {
        alert("Solicitud aprobada con éxito.");
        setSelectedReceiptOrder(null);
        loadSaasOrders();
        loadDrivers(); // Reload drivers in case it was a wallet recharge
      }
    } catch (err: any) {
      alert(err.message || "Error al aprobar pedido");
    }
  };

  const handleRejectSaaSOrder = async (orderId: number) => {
    try {
      const res = await apiRequest(`/saas/orders/${orderId}/reject`, {
        method: "POST"
      });
      if (res.success) {
        alert("Solicitud rechazada con éxito.");
        setSelectedReceiptOrder(null);
        loadSaasOrders();
      }
    } catch (err: any) {
      alert(err.message || "Error al rechazar pedido");
    }
  };

  const loadDrivers = async () => {
    try {
      const res = await apiRequest("/delivery/drivers");
      if (res.success) {
        setDrivers(res.drivers || []);
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  };

  const loadRates = async () => {
    try {
      const res = await apiRequest("/delivery/rates");
      if (res.success) {
        setRates(res.rates || []);
      }
    } catch (err) {
      console.error("Error loading delivery rates:", err);
    }
  };

  const handleRechargeWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }
    setRecharging(true);
    try {
      const res = await apiRequest("/delivery/recharge", {
        method: "POST",
        body: JSON.stringify({
          driverId: selectedDriver.id,
          amount: parseFloat(rechargeAmount),
          description: rechargeDescription || undefined
        })
      });
      if (res.success) {
        alert(`Recarga de $${parseFloat(rechargeAmount).toFixed(2)} procesada con éxito.`);
        setShowRechargeModal(false);
        setRechargeAmount("");
        setRechargeDescription("");
        loadDrivers();
      }
    } catch (err: any) {
      alert(err.message || "Error al recargar wallet");
    } finally {
      setRecharging(false);
    }
  };

  const handleSettleBalance = async (driver: any) => {
    if (!driver || driver.walletBalance <= 0) {
      alert("El repartidor no tiene saldo a favor pendiente de liquidar.");
      return;
    }

    const confirmPay = await appConfirm(
      `¿Confirmas que ya realizaste la transferencia bancaria de $${driver.walletBalance.toFixed(2)} a ${driver.name}?\n\nAl confirmar, su saldo a favor se liquidará y quedará en $0.00.`
    );
    if (!confirmPay) return;

    try {
      const res = await apiRequest("/delivery/settle", {
        method: "POST",
        body: JSON.stringify({
          driverId: driver.id,
          note: `Liquidación de corte (Transferido: $${driver.walletBalance.toFixed(2)})`,
        }),
      });

      if (res.success) {
        alert(res.message || "Liquidación procesada correctamente.");
        loadDrivers();
      }
    } catch (err: any) {
      alert(err.message || "Error al procesar la liquidación");
    }
  };

  const handleToggleDriverStatus = async (driver: any) => {
    const isApproving = !driver.isActive;
    const confirmAction = await appConfirm(
      isApproving
        ? `¿Confirmas que deseas APROBAR y activar al motorizado ${driver.name}?\n\nAl aprobarlo, podrá iniciar sesión y aceptar pedidos de entrega. Se le enviará un correo de confirmación.`
        : `¿Deseas suspender o desactivar al motorizado ${driver.name}?`
    );
    if (!confirmAction) return;

    try {
      const res = await apiRequest(`/delivery/drivers/${driver.id}/toggle-active`, {
        method: "POST",
        body: JSON.stringify({ isActive: isApproving })
      });
      if (res.success) {
        alert(res.message || (isApproving ? "Motorizado aprobado con éxito." : "Estado actualizado."));
        loadDrivers();
      }
    } catch (err: any) {
      alert(err.message || "Error al actualizar estado del motorizado");
    }
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateName) {
      alert("Por favor ingresa un nombre para la tarifa");
      return;
    }
    setSavingRate(true);
    try {
      const res = await apiRequest("/delivery/rates", {
        method: "POST",
        body: JSON.stringify({
          id: selectedRate?.id || undefined,
          name: rateName,
          basePrice: parseFloat(rateBasePrice),
          pricePerKm: parseFloat(ratePricePerKm),
          costPerOrder: parseFloat(rateCostPerOrder),
          plusDriverBonus: parseFloat(ratePlusDriverBonus),
          dispatchRadiusKm: parseFloat(rateRadiusKm),
          dispatchWaitMin: parseInt(rateWaitMin, 10),
          isActive: rateIsActive,
          balanceRule: rateBalanceRule
        })
      });
      if (res.success) {
        alert("Tarifa guardada con éxito.");
        setSelectedRate(null);
        setRateName("");
        setRateBasePrice("1.00");
        setRatePricePerKm("0.50");
        setRateCostPerOrder("0.50");
        setRatePlusDriverBonus("0.50");
        setRateIsActive(true);
        setRateBalanceRule("PREPAID"); setRateRadiusKm("5"); setRateWaitMin("3");
        loadRates();
      }
    } catch (err: any) {
      alert(err.message || "Error al guardar tarifa");
    } finally {
      setSavingRate(false);
    }
  };

  const handleEditRate = (rate: any) => {
    setSelectedRate(rate);
    setRateName(rate.name);
    setRateBasePrice(rate.basePrice.toString());
    setRatePricePerKm(rate.pricePerKm.toString());
    setRateCostPerOrder(rate.costPerOrder.toString());
    setRatePlusDriverBonus((rate.plusDriverBonus ?? 0.50).toString());
    setRateRadiusKm(String(rate.dispatchRadiusKm ?? 5));
    setRateWaitMin(String(rate.dispatchWaitMin ?? 3));
    setRateIsActive(rate.isActive);
    setRateBalanceRule(rate.balanceRule === "DEBT_LIMIT" ? "DEBT_LIMIT" : "PREPAID");
  };

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/restaurants");
      setRestaurants(res.restaurants || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar restaurantes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") {
      navigate("/login");
      return;
    }
    loadRestaurants();
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === "restaurants" || activeTab === "approvals") {
      loadRestaurants();
      if (activeTab === "approvals") {
        setRestaurantStatusFilter("PENDING");
      }
    } else if (activeTab === "delivery") {
      loadRates();
    } else if (activeTab === "wallet") {
      loadDrivers();
    } else if (activeTab === "saas_customers") {
      loadSaasCustomers();
    } else if (activeTab === "saas_orders") {
      loadSaasOrders();
    } else if (activeTab === "saas_categories") {
      loadCategories();
    } else if (activeTab === "saas_plans") {
      loadPlans();
    }
  }, [activeTab]);

  const handleSlugChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
  };

  const handleToggleActive = async (restaurant: Restaurant) => {
    try {
      const updatedStatus = !restaurant.isActive;
      await apiRequest(`/restaurants/${restaurant.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: restaurant.name,
          isActive: updatedStatus
        })
      });

      // Update locally
      setRestaurants(prev =>
        prev.map(r => r.id === restaurant.id ? { ...r, isActive: updatedStatus } : r)
      );
    } catch (err: any) {
      alert(err.message || "Error al actualizar estado del restaurante");
    }
  };

  const handleApproveRestaurant = async (restaurant: Restaurant) => {
    setApprovingRestaurant(true);
    try {
      const res = await apiRequest(`/restaurants/${restaurant.id}/approve`, {
        method: "POST"
      });
      if (res.success) {
        setRestaurants(prev =>
          prev.map(r => r.id === restaurant.id ? {
            ...r,
            status: "APPROVED",
            isActive: true,
            users: r.users.map(u => ({ ...u, isActive: true }))
          } : r)
        );
        setSelectedApproveRestaurant(null);
        alert(res.message || `¡Restaurante "${restaurant.name}" aprobado exitosamente!`);
      }
    } catch (err: any) {
      alert(err.message || "Error al aprobar el restaurante");
    } finally {
      setApprovingRestaurant(false);
    }
  };

  const handleRejectRestaurant = async (restaurant: Restaurant) => {
    setRejectingRestaurant(true);
    try {
      const res = await apiRequest(`/restaurants/${restaurant.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.success) {
        setRestaurants(prev =>
          prev.map(r => r.id === restaurant.id ? {
            ...r,
            status: "REJECTED",
            isActive: false,
            users: r.users.map(u => ({ ...u, isActive: false }))
          } : r)
        );
        setSelectedRejectRestaurant(null);
        setRejectReason("");
        alert(res.message || `Restaurante "${restaurant.name}" rechazado.`);
      }
    } catch (err: any) {
      alert(err.message || "Error al rechazar el restaurante");
    } finally {
      setRejectingRestaurant(false);
    }
  };

  const handleReviewRestaurant = async (restaurant: Restaurant) => {
    try {
      const res = await apiRequest(`/restaurants/${restaurant.id}/review`, {
        method: "POST"
      });
      if (res.success) {
        setRestaurants(prev =>
          prev.map(r => r.id === restaurant.id ? { ...r, status: "UNDER_REVIEW" } : r)
        );
        alert(res.message || `Restaurante "${restaurant.name}" puesto en revisión.`);
      }
    } catch (err: any) {
      alert(err.message || "Error al poner en revisión el restaurante");
    }
  };

  const handleRegisterRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      await apiRequest("/auth/register-owner", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          name,
          email,
          restaurantName,
          slug
        })
      });

      // Reset form
      setName("");
      setEmail("");
      setRestaurantName("");
      setSlug("");
      setUsername("");
      setPassword("");
      setShowModal(false);

      // Reload list
      loadRestaurants();
      alert("¡Restaurante y dueño registrados exitosamente!");
    } catch (err: any) {
      setModalError(err.message || "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingRestaurantsCount = restaurants.filter(r => r.status === "PENDING").length;
  const reviewRestaurantsCount = restaurants.filter(r => r.status === "UNDER_REVIEW").length;
  const approvedRestaurantsCount = restaurants.filter(r => r.status === "APPROVED" || r.status === "ACTIVE" || (!r.status && r.isActive)).length;
  const rejectedRestaurantsCount = restaurants.filter(r => r.status === "REJECTED" || r.status === "SUSPENDED").length;

  const filteredRestaurants = restaurants.filter(r => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = r.name.toLowerCase().includes(s) ||
      r.slug.toLowerCase().includes(s) ||
      (r.address && r.address.toLowerCase().includes(s)) ||
      r.users.some(u => u.name.toLowerCase().includes(s) || (u.email && u.email.toLowerCase().includes(s)) || u.username.toLowerCase().includes(s));

    if (!matchesSearch) return false;

    if (restaurantStatusFilter === "PENDING") {
      return r.status === "PENDING";
    }
    if (restaurantStatusFilter === "UNDER_REVIEW") {
      return r.status === "UNDER_REVIEW";
    }
    if (restaurantStatusFilter === "APPROVED") {
      return r.status === "APPROVED" || r.status === "ACTIVE" || (!r.status && r.isActive);
    }
    if (restaurantStatusFilter === "REJECTED") {
      return r.status === "REJECTED" || r.status === "SUSPENDED";
    }
    return true;
  });

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-primary)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-body)",
      padding: "30px"
    }} className="superadmin-page">
      {/* Header section */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "40px",
        paddingBottom: "20px",
        borderBottom: "1px solid var(--border-light)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            padding: "10px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 71, 87, 0.1)"
          }}>
            <Shield size={28} color="var(--accent-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: "24px", margin: 0, background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Panel de SuperAdministrador
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              SaaS GoEats — Gestión Centralizada de Clientes y Restaurantes
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {import.meta.env.DEV && <button
            onClick={async () => {
              const confirmation = window.prompt("ATENCIÓN: Esto vaciará por completo todas las órdenes, ventas, facturas, transacciones y turnos de caja del sistema. Las configuraciones de restaurantes, mesas y usuarios base se mantendrán. Para continuar escribe VACIAR.");
              if (confirmation === "VACIAR") {
                try {
                  const res = await apiRequest("/auth/reset-database", {
                    method: "POST",
                    body: JSON.stringify({ confirm: confirmation }),
                  });
                  alert(res.message || "Sistema vaciado exitosamente.");
                  window.location.reload();
                } catch (err: any) {
                  alert("Error al vaciar base de datos: " + err.message);
                }
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "rgba(255, 71, 87, 0.1)",
              border: "1px solid rgba(255, 71, 87, 0.2)",
              color: "#b91c1c",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px"
            }}
          >
            {systemIconForEmoji("🔥")} Vaciar Sistema (Reset)
          </button>}

          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px"
            }}
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>
      </header>


      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto" }} className="animate-fade-in">


        {/* ======================================= */}
        {/* TAB 1: RESTAURANTS (TENANTS)            */}
        {/* ======================================= */}
        {(activeTab === "restaurants" || activeTab === "approvals") && (
          <div>
            {/* Banner de alerta de solicitudes pendientes */}
            {pendingRestaurantsCount > 0 && (
              <div style={{
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                marginBottom: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "15px",
                flexWrap: "wrap",
                boxShadow: "0 4px 15px rgba(245, 158, 11, 0.08)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    backgroundColor: "#f59e0b",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#b45309" }}>
                      ¡Tienes {pendingRestaurantsCount} {pendingRestaurantsCount === 1 ? "solicitud de restaurante pendiente" : "solicitudes de restaurante pendientes"} de aprobación!
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Revisa la información y aprueba los locales para activar la cuenta de sus dueños y enviar sus credenciales por correo.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setRestaurantStatusFilter("PENDING")}
                  className="glow-btn"
                  style={{
                    padding: "9px 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    backgroundColor: "#f59e0b",
                    borderColor: "#d97706",
                    color: "#fff"
                  }}
                >
                  <Clock size={14} />
                  Ver Pendientes ({pendingRestaurantsCount})
                </button>
              </div>
            )}

            {/* Sub-tabs de Filtro de Estado */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "22px" }}>
              <button
                onClick={() => setRestaurantStatusFilter("ALL")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: restaurantStatusFilter === "ALL" ? "var(--accent-primary)" : "var(--bg-tertiary)",
                  color: restaurantStatusFilter === "ALL" ? "#fff" : "var(--text-secondary)",
                  transition: "all var(--transition-fast)"
                }}
              >
                Todos los Locales ({restaurants.length})
              </button>
              <button
                onClick={() => setRestaurantStatusFilter("PENDING")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: restaurantStatusFilter === "PENDING" ? "#f59e0b" : "rgba(245, 158, 11, 0.12)",
                  color: restaurantStatusFilter === "PENDING" ? "#fff" : "#d97706",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all var(--transition-fast)"
                }}
              >
                <Clock size={14} />
                Solicitudes Pendientes ({pendingRestaurantsCount})
              </button>
              <button
                onClick={() => setRestaurantStatusFilter("UNDER_REVIEW")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: restaurantStatusFilter === "UNDER_REVIEW" ? "#3b82f6" : "rgba(59, 130, 246, 0.12)",
                  color: restaurantStatusFilter === "UNDER_REVIEW" ? "#fff" : "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all var(--transition-fast)"
                }}
              >
                <Search size={14} />
                En Revisión ({reviewRestaurantsCount})
              </button>
              <button
                onClick={() => setRestaurantStatusFilter("APPROVED")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: restaurantStatusFilter === "APPROVED" ? "#10b981" : "rgba(16, 185, 129, 0.12)",
                  color: restaurantStatusFilter === "APPROVED" ? "#fff" : "#059669",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all var(--transition-fast)"
                }}
              >
                <CheckCircle size={14} />
                Aprobados / Activos ({approvedRestaurantsCount})
              </button>
              <button
                onClick={() => setRestaurantStatusFilter("REJECTED")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: restaurantStatusFilter === "REJECTED" ? "#ef4444" : "rgba(239, 68, 68, 0.12)",
                  color: restaurantStatusFilter === "REJECTED" ? "#fff" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all var(--transition-fast)"
                }}
              >
                <XCircle size={14} />
                Rechazados ({rejectedRestaurantsCount})
              </button>
            </div>

            {/* Actions bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
              marginBottom: "25px"
            }}>
              {/* Search Bar */}
              <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "400px" }}>
                <Search size={18} style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)"
                }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, slug, dueño o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: "45px" }}
                />
              </div>

              {/* Add Restaurant Button */}
              <button
                onClick={() => setShowModal(true)}
                className="glow-btn"
                style={{ padding: "12px 20px" }}
              >
                <Plus size={18} />
                Registrar Restaurante
              </button>
            </div>

            {error && (
              <div className="glass-card" style={{
                padding: "20px",
                color: "var(--accent-primary)",
                border: "1px solid rgba(255, 71, 87, 0.2)",
                marginBottom: "20px"
              }}>
                {error}
              </div>
            )}

            {/* Restaurants Table */}
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <Loader2 className="spinner" size={40} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="glass-card" style={{ padding: "60px", textAlign: "center", color: "var(--text-secondary)" }}>
                <Store size={48} style={{ marginBottom: "15px", color: "var(--text-muted)" }} />
                <p style={{ fontSize: "16px", margin: 0 }}>
                  {restaurantStatusFilter === "PENDING"
                    ? "No hay solicitudes pendientes de aprobación."
                    : restaurantStatusFilter === "UNDER_REVIEW"
                    ? "No hay restaurantes en estado de revisión."
                    : "No se encontraron restaurantes con los filtros aplicados."}
                </p>
              </div>
            ) : (
              <div className="glass-card" style={{ overflowX: "auto" }}>
                <table className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>RESTAURANTE</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>SLUG / ENLACE</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>DUEÑO / CONTACTO</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>FECHA REGISTRO</th>
                      <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>ESTADO</th>
                      <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestaurants.map((restaurant) => {
                      const ownerUser = restaurant.users.find(u => u.role === "RESTAURANT_OWNER");
                      return (
                        <tr
                          key={restaurant.id}
                          style={{
                            borderBottom: "1px solid var(--border-light)",
                            transition: "background var(--transition-fast)"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.02)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                        >
                          {/* Name & Details */}
                          <td style={{ padding: "18px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              {restaurant.logo ? (
                                <img
                                  src={restaurant.logo}
                                  alt={restaurant.name}
                                  style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover" }}
                                />
                              ) : (
                                <div style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "8px",
                                  background: "var(--bg-tertiary)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "bold",
                                  color: "var(--accent-primary)"
                                }}>
                                  {restaurant.name[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 600, fontSize: "15px" }}>{restaurant.name}</div>
                                <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", gap: "12px", marginTop: "2px" }}>
                                  <span>ID: {restaurant.id}</span>
                                  {restaurant.address && <span>{restaurant.address}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Slug */}
                          <td style={{ padding: "18px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Globe size={14} color="var(--text-muted)" />
                              <a
                                href={`/r/${restaurant.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "var(--accent-secondary)",
                                  fontSize: "13px",
                                  textDecoration: "underline"
                                }}
                              >
                                /r/{restaurant.slug}
                              </a>
                            </div>
                          </td>

                          {/* Owner Details */}
                          <td style={{ padding: "18px 20px" }}>
                            {ownerUser ? (
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 600 }}>{ownerUser.name}</div>
                                <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                                  <span>@{ownerUser.username}</span>
                                  {ownerUser.isActive ? (
                                    <span style={{ color: "var(--success)", fontWeight: 600, fontSize: "13px" }}>● Activo</span>
                                  ) : (
                                    <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: "13px" }}>● Inactivo</span>
                                  )}
                                </div>
                                {ownerUser.email && (
                                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                                    <Mail size={12} color="var(--text-muted)" />
                                    <a href={`mailto:${ownerUser.email}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>{ownerUser.email}</a>
                                  </div>
                                )}
                                {(ownerUser.phone || restaurant.phone) && (
                                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                    <Phone size={12} color="var(--text-muted)" />
                                    <span>{ownerUser.phone || restaurant.phone}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: "13px", color: "var(--accent-primary)" }}>Sin dueño asignado</div>
                            )}
                          </td>

                          {/* Created At */}
                          <td style={{ padding: "18px 20px", fontSize: "13px", color: "var(--text-secondary)" }}>
                            {new Date(restaurant.createdAt).toLocaleDateString("es-EC", {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })}
                          </td>

                          {/* Status */}
                          <td style={{ padding: "18px 20px", textAlign: "center" }}>
                            {restaurant.status === "PENDING" ? (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "5px 10px",
                                borderRadius: "12px",
                                backgroundColor: "rgba(245, 158, 11, 0.15)",
                                color: "#d97706",
                                fontSize: "13px",
                                fontWeight: 700
                              }}>
                                <Clock size={12} />
                                {systemIconForEmoji("⏳")} Pendiente
                              </span>
                            ) : restaurant.status === "UNDER_REVIEW" ? (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "5px 10px",
                                borderRadius: "12px",
                                backgroundColor: "rgba(59, 130, 246, 0.15)",
                                color: "#2563eb",
                                fontSize: "13px",
                                fontWeight: 700
                              }}>
                                <Search size={12} />
                                {systemIconForEmoji("🔍")} En Revisión
                              </span>
                            ) : restaurant.status === "REJECTED" ? (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "5px 10px",
                                borderRadius: "12px",
                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                color: "#dc2626",
                                fontSize: "13px",
                                fontWeight: 700
                              }}>
                                <XCircle size={12} />
                                {systemIconForEmoji("❌")} Rechazado
                              </span>
                            ) : (restaurant.status === "APPROVED" || restaurant.status === "ACTIVE" || (!restaurant.status && restaurant.isActive)) ? (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "5px 10px",
                                borderRadius: "12px",
                                backgroundColor: "rgba(46, 213, 115, 0.15)",
                                color: "var(--success)",
                                fontSize: "13px",
                                fontWeight: 700
                              }}>
                                <CheckCircle size={12} />
                                {systemIconForEmoji("✅")} Aprobado
                              </span>
                            ) : (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "5px 10px",
                                borderRadius: "12px",
                                backgroundColor: "rgba(255, 71, 87, 0.15)",
                                color: "var(--accent-primary)",
                                fontSize: "13px",
                                fontWeight: 700
                              }}>
                                <XCircle size={12} />
                                Inactivo
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: "18px 20px", textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                              {(restaurant.status === "PENDING" || restaurant.status === "UNDER_REVIEW") ? (
                                <>
                                  <button
                                    onClick={() => setSelectedApproveRestaurant(restaurant)}
                                    style={{
                                      padding: "7px 14px",
                                      borderRadius: "var(--radius-sm)",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                                      border: "1px solid rgba(16, 185, 129, 0.4)",
                                      color: "#059669",
                                      transition: "all var(--transition-fast)"
                                    }}
                                    title="Aprobar local y activar cuenta del dueño"
                                  >
                                    <Check size={13} />
                                    Aprobar Local
                                  </button>

                                  {restaurant.status === "PENDING" && (
                                    <button
                                      onClick={() => handleReviewRestaurant(restaurant)}
                                      style={{
                                        padding: "7px 12px",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                                        border: "1px solid rgba(59, 130, 246, 0.3)",
                                        color: "#2563eb",
                                        transition: "all var(--transition-fast)"
                                      }}
                                      title="Poner en estado de revisión"
                                    >
                                      <Clock size={13} />
                                      En Revisión
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setSelectedRejectRestaurant(restaurant);
                                      setRejectReason("");
                                    }}
                                    style={{
                                      padding: "7px 12px",
                                      borderRadius: "var(--radius-sm)",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                                      border: "1px solid rgba(239, 68, 68, 0.3)",
                                      color: "#dc2626",
                                      transition: "all var(--transition-fast)"
                                    }}
                                    title="Rechazar solicitud de afiliación"
                                  >
                                    <X size={13} />
                                    Rechazar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleToggleActive(restaurant)}
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "var(--radius-sm)",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      transition: "all var(--transition-fast)",
                                      backgroundColor: restaurant.isActive ? "rgba(255, 71, 87, 0.1)" : "rgba(46, 213, 115, 0.1)",
                                      border: restaurant.isActive ? "1px solid rgba(255, 71, 87, 0.2)" : "1px solid rgba(46, 213, 115, 0.2)",
                                      color: restaurant.isActive ? "var(--accent-primary)" : "var(--success)",
                                    }}
                                  >
                                    {restaurant.isActive ? "Desactivar" : "Activar"}
                                  </button>

                                  {restaurant.status !== "REJECTED" && (
                                    <button
                                      onClick={() => {
                                        setSelectedRejectRestaurant(restaurant);
                                        setRejectReason("");
                                      }}
                                      style={{
                                        padding: "6px 10px",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        backgroundColor: "rgba(239, 68, 68, 0.08)",
                                        border: "1px solid rgba(239, 68, 68, 0.2)",
                                        color: "#dc2626",
                                        transition: "all var(--transition-fast)"
                                      }}
                                      title="Suspender este restaurante"
                                    >
                                      Suspender
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "saas_categories" && (
          <div className="mobile-column-stack" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px", alignItems: "start" }}>
            
            {/* Form to Create/Edit Category */}
            <div className="glass-card" style={{ padding: "25px" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>
                {editingCategory ? `Editar Categoría: ${editingCategory.name}` : "Crear Nueva Categoría Principal"}
              </h2>
              
              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                <div className="input-group">
                  <label>Nombre de la Categoría</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Comida Rápida, Asaderos, Sushi"
                    value={editingCategory ? editingCategoryName : newCategoryName}
                    onChange={(e) => editingCategory ? setEditingCategoryName(e.target.value) : setNewCategoryName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>Descripción / Detalle</label>
                  <textarea
                    placeholder="Opcional. Breve descripción de la categoría"
                    value={editingCategory ? editingCategoryDesc : newCategoryDesc}
                    onChange={(e) => editingCategory ? setEditingCategoryDesc(e.target.value) : setNewCategoryDesc(e.target.value)}
                    className="input-field"
                    style={{ minHeight: "80px", fontFamily: "inherit", padding: "10px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setEditingCategoryName("");
                        setEditingCategoryDesc("");
                      }}
                      className="secondary-btn"
                      style={{ flex: 1, padding: "10px" }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="glow-btn"
                    style={{ flex: 2, padding: "10px" }}
                  >
                    {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
                  </button>
                </div>
              </form>

              {/* Editing Subcategory Overlay Form (if editing a subcategory) */}
              {editingSubcategory && (
                <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid var(--border-light)" }}>
                  <h3 style={{ fontSize: "15px", marginBottom: "15px", color: "var(--accent-secondary)" }}>
                    Renombrar Subcategoría: {editingSubcategory.name}
                  </h3>
                  <form onSubmit={handleUpdateSubcategory}>
                    <div className="input-group">
                      <input
                        type="text"
                        required
                        value={editingSubcategoryName}
                        onChange={(e) => setEditingSubcategoryName(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubcategory(null);
                          setEditingSubcategoryName("");
                        }}
                        className="secondary-btn"
                        style={{ flex: 1, padding: "8px", fontSize: "13px" }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="glow-btn"
                        style={{ flex: 1, padding: "8px", fontSize: "13px" }}
                      >
                        Actualizar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* List of Categories & Subcategories */}
            <div className="glass-card" style={{ padding: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", margin: 0 }}>Categorías de Restaurante</h2>
                <button
                  type="button"
                  onClick={loadCategories}
                  className="secondary-btn"
                  style={{ padding: "6px 12px", fontSize: "13px" }}
                >
                  Actualizar Lista
                </button>
              </div>

              {loadingCategories ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                  <Loader2 className="spinner" size={32} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : categories.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>
                  No hay categorías registradas en el sistema.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      style={{
                        padding: "20px",
                        backgroundColor: "var(--bg-secondary)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-light)"
                      }}
                    >
                      {/* Category Header Info */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
                            <Tag size={16} color="var(--accent-secondary)" />
                            {cat.name}
                          </div>
                          {cat.description && (
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                              {cat.description}
                            </p>
                          )}
                        </div>

                        {/* Category Admin actions */}
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setEditingCategoryName(cat.name);
                              setEditingCategoryDesc(cat.description || "");
                            }}
                            className="secondary-btn"
                            style={{ padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}
                            title="Editar"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="secondary-btn"
                            style={{ padding: "4px 8px", color: "var(--accent-primary)", borderColor: "rgba(255, 71, 87, 0.2)", display: "flex", alignItems: "center", gap: "4px" }}
                            title="Eliminar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories Subsection */}
                      <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px", marginTop: "10px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Subcategorías
                        </div>

                        {/* Subcategories List */}
                        {(!cat.subcategories || cat.subcategories.length === 0) ? (
                          <div style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "12px" }}>
                            Sin subcategorías creadas.
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                            {cat.subcategories.map((sub: any) => (
                              <div
                                key={sub.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  backgroundColor: "#ffffff",
                                  border: "1px solid var(--border-light)",
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  fontSize: "13px"
                                }}
                              >
                                <span>{sub.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSubcategory(sub);
                                    setEditingSubcategoryName(sub.name);
                                  }}
                                  style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
                                  title="Renombrar"
                                >
                                  <Edit2 size={10} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubcategory(sub.id)}
                                  style={{ border: "none", background: "none", cursor: "pointer", color: "var(--accent-primary)", padding: 0 }}
                                  title="Eliminar"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Form to Add Subcategory */}
                        <div style={{ display: "flex", gap: "8px", maxWidth: "300px" }}>
                          <input
                            type="text"
                            placeholder="Nueva subcategoría..."
                            value={newSubcategoryNames[cat.id] || ""}
                            onChange={(e) => setNewSubcategoryNames(prev => ({ ...prev, [cat.id]: e.target.value }))}
                            className="input-field"
                            style={{ padding: "6px 10px", fontSize: "13px" }}
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateSubcategory(cat.id)}
                            className="glow-btn"
                            style={{ padding: "6px 12px", fontSize: "13px", flexShrink: 0 }}
                          >
                            + Agregar
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================= */}
        {/* TAB 2: DELIVERY RATES CONFIGURATION    */}
        {/* ======================================= */}
        {activeTab === "delivery" && <UnassignedDeliveries />}
        {activeTab === "delivery" && (
          <div className="mobile-column-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", alignItems: "start" }}>
            {/* Rates list */}
            <div className="glass-card" style={{ padding: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", margin: 0 }}>Listado de Tarifas</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRate(null);
                    setRateName("");
                    setRateBasePrice("1.00");
                    setRatePricePerKm("0.50");
                    setRateCostPerOrder("0.50");
                    setRateIsActive(true);
                  setRateBalanceRule("PREPAID"); setRateRadiusKm("5"); setRateWaitMin("3");
                  }}
                  className="secondary-btn"
                  style={{ padding: "6px 12px", fontSize: "13px" }}
                >
                  Crear Nueva
                </button>
              </div>

              {rates.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No hay tarifas registradas.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {rates.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: "16px",
                        backgroundColor: "var(--bg-secondary)",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${r.isActive ? "var(--accent-secondary)" : "var(--border-light)"}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          {r.name}
                          {r.isActive && (
                            <span style={{
                              fontSize: "13px",
                              backgroundColor: "rgba(46, 213, 115, 0.1)",
                              color: "var(--success)",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontWeight: "bold"
                            }}>
                              ACTIVA
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          Base: ${r.basePrice.toFixed(2)} • Km: ${r.pricePerKm.toFixed(2)} • Comisión: ${r.costPerOrder.toFixed(2)} • Bono Plus: ${r.plusDriverBonus?.toFixed(2) || "0.00"} • {r.balanceRule === "DEBT_LIMIT" ? "Saldo: con límite de deuda" : "Saldo: con recarga"} • Radio: {r.dispatchRadiusKm ?? 5} km • Espera: {r.dispatchWaitMin ?? 3} min
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEditRate(r)}
                        className="secondary-btn"
                        style={{ padding: "6px 12px", fontSize: "13px" }}
                      >
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rates Form */}
            <div className="glass-card" style={{ padding: "25px" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>
                {selectedRate ? `Editar Tarifa: ${selectedRate.name}` : "Crear Nueva Configuración de Tarifas"}
              </h2>

              <form onSubmit={handleSaveRate}>
                <div className="input-group">
                  <label>Nombre de la Tarifa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Tarifa Plana Estándar, Fines de Semana"
                    value={rateName}
                    onChange={(e) => setRateName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>Precio Base de Envío ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={rateBasePrice}
                    onChange={(e) => setRateBasePrice(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>Precio Adicional por Kilómetro ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={ratePricePerKm}
                    onChange={(e) => setRatePricePerKm(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>Comisión de Descuento por Pedido ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={rateCostPerOrder}
                    onChange={(e) => setRateCostPerOrder(e.target.value)}
                    className="input-field"
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "2px", display: "block" }}>
                    Esta cantidad se descontará de la billetera del motorizado por cada pedido que acepte.
                  </small>
                </div>

                <div className="input-group">
                  <label>Bono de Conductor GoEats Plus ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={ratePlusDriverBonus}
                    onChange={(e) => setRatePlusDriverBonus(e.target.value)}
                    className="input-field"
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "2px", display: "block" }}>
                    Esta cantidad se le pagará al conductor por cada pedido entregado a un usuario GoEats Plus.
                  </small>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                  <div className="input-group">
                    <label htmlFor="rateRadiusKm">Radio de motorizados cercanos (km)</label>
                    <input
                      id="rateRadiusKm"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="50"
                      required
                      value={rateRadiusKm}
                      onChange={(e) => setRateRadiusKm(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="rateWaitMin">Espera antes de ofrecer a todos (min)</label>
                    <input
                      id="rateWaitMin"
                      type="number"
                      step="1"
                      min="0"
                      max="30"
                      required
                      value={rateWaitMin}
                      onChange={(e) => setRateWaitMin(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
                <small style={{ color: "var(--text-muted)", fontSize: "13px", margin: "-6px 0 14px", display: "block" }}>
                  Un pedido listo se ofrece primero a los motorizados dentro del radio. Pasada la espera lo ven todos y, si sigue sin motorizado, llega una alerta a este panel.
                </small>

                <div className="input-group">
                  <label htmlFor="rateBalanceRule">Regla de saldo del motorizado</label>
                  <select
                    id="rateBalanceRule"
                    value={rateBalanceRule}
                    onChange={(e) => setRateBalanceRule(e.target.value === "DEBT_LIMIT" ? "DEBT_LIMIT" : "PREPAID")}
                    className="input-field"
                  >
                    <option value="PREPAID">Con recarga: necesita saldo para tomar pedidos</option>
                    <option value="DEBT_LIMIT">Con límite de deuda: puede quedar en negativo hasta su límite</option>
                  </select>
                  <small style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "2px", display: "block" }}>
                    {rateBalanceRule === "DEBT_LIMIT"
                      ? "El límite de cada motorizado es $50 si no se cambia. Al llegar al límite no puede tomar más pedidos hasta abonar."
                      : "Si su saldo es menor que la comisión, no puede tomar pedidos hasta recargar."}
                  </small>
                </div>

                <div className="input-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "15px" }}>
                  <input
                    type="checkbox"
                    id="rateIsActive"
                    checked={rateIsActive}
                    onChange={(e) => setRateIsActive(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor="rateIsActive" style={{ marginBottom: 0, cursor: "pointer", fontWeight: 600 }}>
                    Establecer como Tarifa Activa del Sistema
                  </label>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
                  {selectedRate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRate(null);
                        setRateName("");
                        setRateBasePrice("1.00");
                        setRatePricePerKm("0.50");
                        setRateCostPerOrder("0.50");
                        setRatePlusDriverBonus("0.50");
                        setRateIsActive(true);
                      setRateBalanceRule("PREPAID"); setRateRadiusKm("5"); setRateWaitMin("3");
                      }}
                      className="secondary-btn"
                      style={{ flex: 1, padding: "10px" }}
                    >
                      Cancelar Edición
                    </button>
                  )}
                  <button
                    type="submit"
                    className="glow-btn"
                    style={{ flex: 2, padding: "10px" }}
                    disabled={savingRate}
                  >
                    {savingRate ? "Guardando..." : "Guardar Configuración"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: DRIVERS WALLET MANAGEMENT       */}
        {/* ======================================= */}
        {activeTab === "wallet" && (
          <div>
            <DeliveryIncidentsPanel />
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Gestión de Billeteras de Motorizados</h2>
              <button
                type="button"
                onClick={loadDrivers}
                className="secondary-btn"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Actualizar Lista
              </button>
            </div>

            <div className="glass-card" style={{ overflowX: "auto" }}>
              <table className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>MOTORIZADO</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>CÉDULA / CONTACTO</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>VEHÍCULO</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>ESTADO APROBACIÓN</th>
                    <th style={{ padding: "16px 20px", textAlign: "right", fontSize: "13px", color: "var(--text-muted)" }}>SALDO BILLETERA</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                        No hay motorizados registrados en el sistema.
                      </td>
                    </tr>
                  ) : (
                    drivers.map((driver) => (
                      <tr
                        key={driver.id}
                        style={{
                          borderBottom: "1px solid var(--border-light)",
                          transition: "background var(--transition-fast)"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.02)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                      >
                        <td style={{ padding: "18px 20px", fontWeight: "bold" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Truck size={16} color="var(--text-secondary)" />
                            {driver.name} (Ref: @{driver.username})
                          </div>
                          <div style={{ marginTop: "4px", fontWeight: 400 }}>
                            <StarAverage average={driver.ratingAverage ?? null} count={driver.ratingCount ?? 0} />
                          </div>
                        </td>
                        <td style={{ padding: "18px 20px", fontSize: "13px" }}>
                          <div><strong>CI:</strong> {driver.cedula}</div>
                          <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{driver.phone || "Sin teléfono"}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{driver.email || "Sin correo"}</div>
                        </td>
                        <td style={{ padding: "18px 20px", fontSize: "13px" }}>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            backgroundColor: "#f1f5f9",
                            fontWeight: 600,
                            fontSize: "13px"
                          }}>
                            {driver.vehicleType === "BICI" ? systemTextWithIcons("🚲 Bicicleta") : driver.vehicleType === "AUTO" ? systemTextWithIcons("🚗 Automóvil") : systemTextWithIcons("🛵 Moto")}
                          </span>
                          {driver.vehiclePlate && (
                            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                              Placa: <strong>{driver.vehiclePlate}</strong>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "18px 20px", textAlign: "center" }}>
                          {driver.isActive ? (
                            <span style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              backgroundColor: "rgba(46, 213, 115, 0.12)",
                              color: "#2ed573",
                              fontWeight: 700,
                              fontSize: "13px",
                              border: "1px solid rgba(46, 213, 115, 0.3)"
                            }}>
                              {systemIconForEmoji("✅")} Aprobado / Activo
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              backgroundColor: "rgba(255, 171, 0, 0.12)",
                              color: "#d97706",
                              fontWeight: 700,
                              fontSize: "13px",
                              border: "1px solid rgba(255, 171, 0, 0.3)"
                            }}>
                              {systemIconForEmoji("⏳")} Pendiente Aprobación
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "18px 20px", textAlign: "right", fontWeight: "bold" }}>
                          <div style={{
                            color: driver.walletBalance > 0 ? "var(--success)" : driver.walletBalance <= -50 ? "#ff4757" : "var(--accent-primary)",
                            fontSize: "15px"
                          }}>
                            {driver.walletBalance < 0 ? `-$${Math.abs(driver.walletBalance).toFixed(2)}` : `$${driver.walletBalance.toFixed(2)}`}
                          </div>
                          {driver.walletBalance <= -50 && (
                            <span style={{ fontSize: "13px", color: "#ff4757", fontWeight: "bold" }}>
                              {systemIconForEmoji("⚠️")} DEUDA &gt; $50 (PAUSADO)
                            </span>
                          )}
                          {driver.walletBalance > 0 && (
                            <span style={{ fontSize: "13px", color: "var(--success)", fontWeight: "bold" }}>
                              A FAVOR
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "18px 20px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                            {driver.walletBalance > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSettleBalance(driver)}
                                className="glow-btn"
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "13px",
                                  backgroundColor: "#2980b9",
                                  borderColor: "#2980b9",
                                  color: "white"
                                }}
                                title="Liquidar corte y registrar transferencia al motorizado"
                              >
                                {systemIconForEmoji("⚡")} Liquidar ${driver.walletBalance.toFixed(2)}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleDriverStatus(driver)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "13px",
                                fontWeight: 700,
                                borderRadius: "8px",
                                border: "none",
                                cursor: "pointer",
                                backgroundColor: driver.isActive ? "#fee2e2" : "#dcfce7",
                                color: driver.isActive ? "#dc2626" : "#16a34a",
                              }}
                              title={driver.isActive ? "Suspender acceso" : "Aprobar y habilitar cuenta"}
                            >
                              {driver.isActive ? "Pausar" : systemTextWithIcons("Aprobar ✅")}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDriver(driver);
                                setShowRechargeModal(true);
                              }}
                              className="secondary-btn"
                              style={{
                                padding: "6px 12px",
                                fontSize: "13px",
                              }}
                            >
                              <DollarSign size={13} style={{ marginRight: "4px" }} />
                              {driver.walletBalance < 0 ? "Abonar Deuda" : "Recargar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 4: SAAS CUSTOMERS                   */}
        {/* ======================================= */}
        {activeTab === "saas_customers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Gestión de Clientes y Miembros Plus</h2>
              <button type="button" onClick={loadSaasCustomers} className="secondary-btn" style={{ padding: "8px 16px", fontSize: "13px" }}>
                Actualizar Lista
              </button>
            </div>

            <div className="glass-card" style={{ overflowX: "auto" }}>
              <table className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>CLIENTE</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>CÉDULA</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>CORREO ELECTRÓNICO</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>CLUB GOEATS PLUS</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {saasCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                        No hay clientes registrados en el sistema.
                      </td>
                    </tr>
                  ) : (
                    saasCustomers.map((customer) => (
                      <tr key={customer.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "18px 20px", fontWeight: "bold" }}>{customer.name} (@{customer.username})</td>
                        <td style={{ padding: "18px 20px", fontSize: "13px" }}>{customer.cedula || "No registrada"}</td>
                        <td style={{ padding: "18px 20px", fontSize: "13px", color: "var(--text-secondary)" }}>{customer.email || "Sin correo"}</td>
                        <td style={{ padding: "18px 20px", textAlign: "center" }}>
                          {customer.isPlus ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              backgroundColor: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                              border: "1px solid #fbbf24",
                              color: "#d97706",
                              fontSize: "13px",
                              fontWeight: "bold"
                            }}>
                              Club Plus {systemIconForEmoji("✨")}
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              backgroundColor: "var(--bg-tertiary)",
                              border: "1px solid var(--border-light)",
                              color: "var(--text-muted)",
                              fontSize: "13px"
                            }}>
                              Estándar
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "18px 20px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => handleToggleCustomerPlus(customer.id)}
                              className="secondary-btn"
                              style={{
                                padding: "6px 12px",
                                fontSize: "13px",
                                color: customer.isPlus ? "var(--accent-primary)" : "var(--success)",
                                borderColor: customer.isPlus ? "rgba(255, 71, 87, 0.2)" : "rgba(46, 213, 115, 0.2)"
                              }}
                            >
                              {customer.isPlus ? "Quitar Plus" : "Hacer Plus"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(customer.id, customer.name, customer.username)}
                              disabled={deletingCustomerId === customer.id}
                              title="Eliminar cliente permanentemente"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                color: "#ef4444",
                                cursor: deletingCustomerId === customer.id ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease"
                              }}
                            >
                              {deletingCustomerId === customer.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 5: SAAS PLANS                       */}
        {/* ======================================= */}
        {activeTab === "saas_plans" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", alignItems: "start" }} className="mobile-column-stack">
            {/* List of plans */}
            <div className="glass-card" style={{ padding: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", margin: 0 }}>Listado de Planes</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(null);
                    setPlanName("");
                    setPlanType("PLUS_SUBSCRIPTION");
                    setPlanAmount("");
                    setPlanPeriod("");
                    setPlanDiscount("");
                    setPlanDescription("");
                  }}
                  className="secondary-btn"
                  style={{ padding: "6px 12px", fontSize: "13px" }}
                >
                  Crear Nuevo
                </button>
              </div>

              {loadingPlans ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "30px" }}>
                  <Loader2 className="spinner" size={24} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : plans.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No hay planes registrados.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                  {/* Customer Plans */}
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "var(--accent-secondary)", marginBottom: "12px", borderBottom: "1px solid var(--border-light)", paddingBottom: "6px" }}>
                      Planes de Suscripción (Clientes Plus)
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {plans.filter(p => p.type === "PLUS_SUBSCRIPTION").map((p) => (
                        <div
                          key={p.id}
                          style={{
                            padding: "16px",
                            backgroundColor: "var(--bg-secondary)",
                            borderRadius: "var(--radius-sm)",
                            border: `1px solid ${selectedPlan?.id === p.id ? "var(--accent-secondary)" : "var(--border-light)"}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: "15px" }}>
                            <div style={{ fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                              {p.name}
                              {p.discount && (
                                <span style={{
                                  fontSize: "13px",
                                  backgroundColor: "rgba(255, 71, 87, 0.05)",
                                  color: "var(--accent-primary)",
                                  padding: "2px 6px",
                                  borderRadius: "10px",
                                  fontWeight: "bold"
                                }}>
                                  {p.discount}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 600 }}>
                              ${p.amount.toFixed(2)} / {p.period || "mes"}
                            </div>
                            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0", lineHeight: "1.3" }}>
                              {p.description}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleEditPlan(p)}
                              className="secondary-btn"
                              style={{ padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}
                              title="Editar"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(p.id)}
                              className="secondary-btn"
                              style={{ padding: "6px", color: "var(--accent-primary)", borderColor: "rgba(255,71,87,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}
                              title="Eliminar"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Driver Plans */}
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "var(--success)", marginBottom: "12px", borderBottom: "1px solid var(--border-light)", paddingBottom: "6px" }}>
                      Tarjetas de Recarga (Motorizados)
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {plans.filter(p => p.type === "RECHARGE").map((p) => (
                        <div
                          key={p.id}
                          style={{
                            padding: "16px",
                            backgroundColor: "var(--bg-secondary)",
                            borderRadius: "var(--radius-sm)",
                            border: `1px solid ${selectedPlan?.id === p.id ? "var(--success)" : "var(--border-light)"}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: "15px" }}>
                            <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--success)", marginTop: "4px", fontWeight: 600 }}>
                              Monto: ${p.amount.toFixed(2)}
                            </div>
                            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0", lineHeight: "1.3" }}>
                              {p.description}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleEditPlan(p)}
                              className="secondary-btn"
                              style={{ padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}
                              title="Editar"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(p.id)}
                              className="secondary-btn"
                              style={{ padding: "6px", color: "var(--accent-primary)", borderColor: "rgba(255,71,87,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}
                              title="Eliminar"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Plans Form */}
            <div className="glass-card" style={{ padding: "25px" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>
                {selectedPlan ? `Editar Plan: ${selectedPlan.name}` : "Crear Nuevo Plan SaaS"}
              </h2>

              <form onSubmit={handleSavePlan}>
                <div className="input-group">
                  <label>Nombre del Plan</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Plan Plus Mensual, Tarjeta Recarga $10"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>Tipo de Plan</label>
                  <select
                    value={planType}
                    onChange={(e) => {
                      setPlanType(e.target.value);
                      if (e.target.value === "RECHARGE") {
                        setPlanPeriod("");
                        setPlanDiscount("");
                      }
                    }}
                    className="input-field"
                    style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}
                  >
                    <option value="PLUS_SUBSCRIPTION">Suscripción de Cliente (GoEats Plus)</option>
                    <option value="RECHARGE">Tarjeta de Recarga (Repartidor)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Monto / Precio ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Ej. 4.99 o 10.00"
                    value={planAmount}
                    onChange={(e) => setPlanAmount(e.target.value)}
                    className="input-field"
                  />
                </div>

                {planType === "PLUS_SUBSCRIPTION" && (
                  <>
                    <div className="input-group">
                      <label>Periodo de Facturación</label>
                      <input
                        type="text"
                        placeholder="Ej. mes, 6 meses, año"
                        value={planPeriod}
                        onChange={(e) => setPlanPeriod(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div className="input-group">
                      <label>Texto de Descuento / Insignia</label>
                      <input
                        type="text"
                        placeholder="Ej. Sin descuento, Ahorra 15%, Popular"
                        value={planDiscount}
                        onChange={(e) => setPlanDiscount(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </>
                )}

                <div className="input-group">
                  <label>Descripción</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Escribe los detalles y beneficios de este plan..."
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    className="input-field"
                    style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
                  {selectedPlan && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlan(null);
                        setPlanName("");
                        setPlanType("PLUS_SUBSCRIPTION");
                        setPlanAmount("");
                        setPlanPeriod("");
                        setPlanDiscount("");
                        setPlanDescription("");
                      }}
                      className="secondary-btn"
                      style={{ flex: 1, padding: "10px" }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="glow-btn"
                    style={{ flex: 2, padding: "10px", backgroundColor: planType === "RECHARGE" ? "var(--success)" : "var(--accent-secondary)", borderColor: planType === "RECHARGE" ? "var(--success)" : "var(--accent-secondary)" }}
                    disabled={savingPlan}
                  >
                    {savingPlan ? "Guardando..." : "Guardar Plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 6: SAAS ORDERS                      */}
        {/* ======================================= */}
        {activeTab === "saas_orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Pedidos de Recargas y Planes SaaS</h2>
              <button type="button" onClick={loadSaasOrders} className="secondary-btn" style={{ padding: "8px 16px", fontSize: "13px" }}>
                Actualizar Lista
              </button>
            </div>

            <div className="glass-card" style={{ overflowX: "auto" }}>
              <table className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>USUARIO</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>ROL</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>TIPO COMPRA</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>PLAN / TARJETA</th>
                    <th style={{ padding: "16px 20px", textAlign: "right", fontSize: "13px", color: "var(--text-muted)" }}>MONTO</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>MÉTODO</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>ESTADO</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>FECHA</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {saasOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                        No hay solicitudes de recargas o suscripciones registradas.
                      </td>
                    </tr>
                  ) : (
                    saasOrders.map((order) => {
                      const isPending = order.status === "PENDING";
                      return (
                        <tr key={order.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "16px 20px", fontWeight: "bold" }}>
                            {order.user.name} (@{order.user.username})
                          </td>
                          <td style={{ padding: "16px 20px", fontSize: "13px" }}>
                            {order.user.role === "MOTORIZADO" ? systemTextWithIcons("Motorizado 🛵") : systemTextWithIcons("Cliente 🍔")}
                          </td>
                          <td style={{ padding: "16px 20px", fontSize: "13px" }}>
                            {order.type === "RECHARGE" ? "Recarga Wallet" : "Club GoEats Plus"}
                          </td>
                          <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--text-secondary)" }}>
                            {order.planName}
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: "bold" }}>
                            ${order.amount.toFixed(2)}
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px" }}>
                            {order.paymentMethod === "CARD" ? systemTextWithIcons("💳 Tarjeta (Payphone)") : systemTextWithIcons("🏦 Transferencia")}
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "center" }}>
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "10px",
                              fontSize: "13px",
                              fontWeight: "bold",
                              backgroundColor: order.status === "APPROVED" ? "rgba(46, 213, 115, 0.1)" : order.status === "PENDING" ? "rgba(251, 191, 36, 0.1)" : "rgba(255, 71, 87, 0.1)",
                              color: order.status === "APPROVED" ? "var(--success)" : order.status === "PENDING" ? "#d97706" : "var(--accent-primary)"
                            }}>
                              {order.status === "APPROVED" ? "Aprobado" : order.status === "PENDING" ? "Pendiente" : "Rechazado"}
                            </span>
                          </td>
                          <td style={{ padding: "16px 20px", fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" }}>
                            {new Date(order.createdAt).toLocaleDateString("es-EC")}
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "center" }}>
                            {isPending && order.paymentMethod === "TRANSFER" ? (
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptOrder(order)}
                                className="glow-btn"
                                style={{ padding: "6px 12px", fontSize: "13px" }}
                              >
                                Revisar Pago
                              </button>
                            ) : (
                              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                                {order.paymentMethod === "CARD" ? "Auto-aprobado" : "Procesado"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 8: CORREOS Y GMAIL API OAUTH2       */}
        {/* ======================================= */}
        {activeTab === "emails" && <EmailNotificationsTab />}
      </main>


      {/* ======================================= */}
      {/* MODAL: REGISTER RESTAURANT              */}
      {/* ======================================= */}
      {showModal && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "520px" }}>
            <h2 style={{
              fontSize: "20px",
              marginBottom: "5px",
              background: "var(--accent-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Registrar Nuevo Restaurante
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "25px" }}>
              Crea un nuevo tenant y la cuenta del propietario.
            </p>

            {modalError && (
              <div style={{
                backgroundColor: "rgba(255, 71, 87, 0.1)",
                border: "1px solid var(--accent-primary)",
                color: "var(--accent-primary)",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                marginBottom: "15px",
                fontSize: "13px"
              }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleRegisterRestaurant}>
              {/* Restaurant details */}
              <div className="input-group">
                <label>Nombre del Restaurante</label>
                <div style={{ position: "relative" }}>
                  <Store size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pizzería Gourmet"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: "40px" }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Subdominio / Slug URL</label>
                <div style={{ position: "relative" }}>
                  <Globe size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    required
                    placeholder="ej-pizzeria-gourmet"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: "40px" }}
                  />
                </div>
                <small style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "2px" }}>
                  Enlace público: /r/{slug || "slug"}
                </small>
              </div>

              <div style={{ borderTop: "1px solid var(--border-light)", margin: "20px 0" }}></div>

              {/* Owner Account Details */}
              <h3 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "15px" }}>Datos del Propietario (Owner)</h3>

              <div className="input-group">
                <label>Nombre Completo</label>
                <div style={{ position: "relative" }}>
                  <UserIcon size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Andrade"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: "40px" }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Correo Electrónico</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="email"
                    required
                    placeholder="carlos@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: "40px" }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Nombre de Usuario</label>
                <div style={{ position: "relative" }}>
                  <Shield size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    required
                    placeholder="Username para iniciar sesión"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: "40px" }}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: "25px" }}>
                <label>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Contraseña del dueño"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: "40px", paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: showPassword ? "var(--accent-primary, #ff4757)" : "var(--text-muted, #718096)",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="secondary-btn"
                  style={{ padding: "10px 18px" }}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="glow-btn"
                  style={{ padding: "10px 22px" }}
                  disabled={submitting}
                >
                  {submitting ? "Registrando..." : "Crear Restaurante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL: RECHARGE DRIVER WALLET           */}
      {/* ======================================= */}
      {showRechargeModal && selectedDriver && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "460px" }}>
            <h2 style={{
              fontSize: "20px",
              marginBottom: "5px",
              color: "var(--text-primary)"
            }}>
              Recargar Saldo de Billetera
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "25px" }}>
              Carga saldo virtual en la cuenta del conductor.
            </p>

            <form onSubmit={handleRechargeWallet}>
              <div className="input-group">
                <label>Motorizado Seleccionado</label>
                <input
                  type="text"
                  readOnly
                  value={selectedDriver.cedula ? `${selectedDriver.name} (${selectedDriver.cedula})` : `${selectedDriver.name} (sin cédula)`}
                  className="input-field"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                />
              </div>

              <div className="input-group">
                <label>Saldo Actual</label>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "var(--success)" }}>
                  ${selectedDriver.walletBalance.toFixed(2)}
                </div>
              </div>

              <div className="input-group">
                <label>Monto a Recargar ($)</label>
                <div style={{ position: "relative" }}>
                  <DollarSign size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Monto a recargar, ej. 10.00"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: "40px" }}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: "25px" }}>
                <label>Descripción / Detalle de la recarga</label>
                <input
                  type="text"
                  placeholder="Ej. Recarga semanal, Bono promocional, etc."
                  value={rechargeDescription}
                  onChange={(e) => setRechargeDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRechargeModal(false);
                    setRechargeAmount("");
                    setRechargeDescription("");
                  }}
                  className="secondary-btn"
                  style={{ padding: "10px 18px" }}
                  disabled={recharging}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="glow-btn"
                  style={{ padding: "10px 22px", backgroundColor: "var(--success)", borderColor: "var(--success)" }}
                  disabled={recharging}
                >
                  {recharging ? "Procesando..." : "Realizar Recarga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL: REVIEW SAAS TRANSFER RECEIPT      */}
      {/* ======================================= */}
      {selectedReceiptOrder && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "500px" }}>
            <button
              onClick={() => setSelectedReceiptOrder(null)}
              style={{ position: "absolute", top: "15px", right: "15px", border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              &times;
            </button>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>Revisión de Pago por Transferencia</h3>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div><strong>Usuario:</strong> {selectedReceiptOrder.user.name} (@{selectedReceiptOrder.user.username})</div>
              <div><strong>Rol:</strong> {selectedReceiptOrder.user.role === "MOTORIZADO" ? "Motorizado" : "Cliente"}</div>
              <div><strong>Tipo:</strong> {selectedReceiptOrder.type === "RECHARGE" ? "Recarga de Wallet" : "Membresía GoEats Plus"}</div>
              <div><strong>Plan Adquirido:</strong> {selectedReceiptOrder.planName}</div>
              <div><strong>Valor del Plan:</strong> ${selectedReceiptOrder.amount.toFixed(2)}</div>
              <div><strong>Fecha Solicitud:</strong> {new Date(selectedReceiptOrder.createdAt).toLocaleString()}</div>
            </div>

            <div style={{ textAlign: "center", marginBottom: "20px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", padding: "10px", backgroundColor: "var(--bg-tertiary)" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)", marginBottom: "8px" }}>COMPROBANTE BANCARIO:</div>
              {selectedReceiptOrder.paymentReceipt ? (
                <img
                  src={selectedReceiptOrder.paymentReceipt}
                  alt="Comprobante Bancario"
                  style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "4px" }}
                />
              ) : (
                <div style={{ padding: "30px", color: "var(--accent-primary)" }}>No se cargó ninguna imagen de comprobante.</div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => handleRejectSaaSOrder(selectedReceiptOrder.id)}
                className="secondary-btn"
                style={{ padding: "10px 18px", color: "var(--accent-primary)", borderColor: "rgba(255, 71, 87, 0.2)" }}
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => handleApproveSaaSOrder(selectedReceiptOrder.id)}
                className="glow-btn"
                style={{ padding: "10px 22px", backgroundColor: "var(--success)", borderColor: "var(--success)" }}
              >
                Aprobar y Acreditar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aprobar Restaurante */}
      {selectedApproveRestaurant && (
        <div className="global-modal-overlay">
          <div className="global-modal-card animate-scale-up" style={{ maxWidth: "520px" }}>
            <button
              onClick={() => setSelectedApproveRestaurant(null)}
              style={{ position: "absolute", top: "15px", right: "15px", border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              &times;
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "var(--success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <CheckCircle size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Aprobar Restaurante</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                  Habilitar operaciones y activar credenciales de acceso
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: "var(--bg-tertiary)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              marginBottom: "20px",
              border: "1px solid var(--border-light)",
              fontSize: "13px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div><strong>Restaurante:</strong> {selectedApproveRestaurant.name}</div>
              <div><strong>Enlace Slug:</strong> /r/{selectedApproveRestaurant.slug}</div>
              {selectedApproveRestaurant.address && <div><strong>Dirección:</strong> {selectedApproveRestaurant.address}</div>}
              {selectedApproveRestaurant.phone && <div><strong>Teléfono:</strong> {selectedApproveRestaurant.phone}</div>}
              
              {(() => {
                const owner = selectedApproveRestaurant.users.find(u => u.role === "RESTAURANT_OWNER");
                return owner ? (
                  <div style={{ marginTop: "6px", paddingTop: "8px", borderTop: "1px dashed var(--border-light)" }}>
                    <div><strong>Dueño:</strong> {owner.name} (@{owner.username})</div>
                    {owner.email && <div><strong>Correo de Notificación:</strong> {owner.email}</div>}
                    {owner.phone && <div><strong>Celular Dueño:</strong> {owner.phone}</div>}
                  </div>
                ) : null;
              })()}
            </div>

            <div style={{
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 14px",
              fontSize: "13px",
              color: "#059669",
              marginBottom: "25px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px"
            }}>
              <Check size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                Al confirmar la aprobación, la cuenta del restaurante y la de su dueño pasarán a estado <strong>ACTIVO</strong>. Se enviará un correo automático de bienvenida al dueño confirmando que su local ya está habilitado en la plataforma.
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={approvingRestaurant}
                onClick={() => setSelectedApproveRestaurant(null)}
                className="secondary-btn"
                style={{ padding: "10px 18px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={approvingRestaurant}
                onClick={() => handleApproveRestaurant(selectedApproveRestaurant)}
                className="glow-btn"
                style={{
                  padding: "10px 22px",
                  backgroundColor: "var(--success)",
                  borderColor: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                {approvingRestaurant ? (
                  <>
                    <Loader2 className="spinner" size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Sí, Aprobar y Notificar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazar Restaurante */}
      {selectedRejectRestaurant && (
        <div className="global-modal-overlay">
          <div className="global-modal-card animate-scale-up" style={{ maxWidth: "520px" }}>
            <button
              onClick={() => {
                setSelectedRejectRestaurant(null);
                setRejectReason("");
              }}
              style={{ position: "absolute", top: "15px", right: "15px", border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              &times;
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <AlertTriangle size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Rechazar Solicitud</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                  {selectedRejectRestaurant.name}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                Motivo del Rechazo / Observaciones (se enviará por correo al dueño):
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej: La documentación proporcionada no es legible o faltan datos requeridos..."
                className="input-field"
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            <div style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 14px",
              fontSize: "13px",
              color: "#dc2626",
              marginBottom: "25px"
            }}>
              Al rechazar la solicitud, el local no aparecerá en el catálogo público y el dueño recibirá una notificación con las observaciones para que pueda corregirlas.
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={rejectingRestaurant}
                onClick={() => {
                  setSelectedRejectRestaurant(null);
                  setRejectReason("");
                }}
                className="secondary-btn"
                style={{ padding: "10px 18px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={rejectingRestaurant}
                onClick={() => handleRejectRestaurant(selectedRejectRestaurant)}
                className="glow-btn"
                style={{
                  padding: "10px 22px",
                  backgroundColor: "#dc2626",
                  borderColor: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                {rejectingRestaurant ? (
                  <>
                    <Loader2 className="spinner" size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Rechazando...
                  </>
                ) : (
                  <>
                    <X size={16} />
                    Confirmar Rechazo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
