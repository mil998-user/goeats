import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Settings as SettingsIcon,
  CreditCard,
  Building2,
  Plus,
  X,
  Trash2,
  Edit,
  Loader2,
  Save,
  QrCode,
  Image as ImageIcon,
  Wifi,
  Store,
  Users,
  User,
  MapPin,
  HelpCircle,
  Upload,
  Tag,
  Eye,
  EyeOff,
  Navigation,
  Sparkles,
  CheckCircle
} from "lucide-react";
import { ClipboardList, ShoppingBag, DollarSign } from "lucide-react";
import { RestaurantLocationPicker } from "../components/RestaurantLocationPicker";
import { TableQRModal } from "../components/TableQRModal";
import { systemIconForEmoji, systemTextWithIcons } from "../utils/systemIcons";


interface BankAccount {
  id: string;
  bankName: string;
  accountType: string; // Ahorros, Corriente
  accountNumber: string;
  ownerName: string;
  ownerId: string; // Cédula/RUC
  ownerEmail?: string;
  qrCodeImage?: string; // base64 representation
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Tabs
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "general") as "general" | "payments" | "tables" | "personal" | "clientes" | "inventario" | "cajas";
  const [slug, setSlug] = useState("");

  // General restaurant form states
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [qrOrderingEnabled, setQrOrderingEnabled] = useState(true);

  // Customization states
  const [coverImage, setCoverImage] = useState("");
  const [description, setDescription] = useState("");
  const [mapLatitude, setMapLatitude] = useState("");
  const [mapLongitude, setMapLongitude] = useState("");
  const [mapIframe, setMapIframe] = useState("");
  const [reference, setReference] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [samePriceAsLocal, setSamePriceAsLocal] = useState(false);
  const [promoText, setPromoText] = useState("");
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [resolvingMaps, setResolvingMaps] = useState(false);
  const [mapsDetectMsg, setMapsDetectMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Payment configuration states
  const [payphoneToken, setPayphoneToken] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // SaaS categories states
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<number[]>([]);

  // Add Bank Account modal/form state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  
  // Bank Account fields
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("Ahorros");
  const [accountNumber, setAccountNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState("");

  // Table and Dining Area management states
  const [diningAreas, setDiningAreas] = useState<any[]>([]);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);

  const [showTableModal, setShowTableModal] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [tableCapacity, setTableCapacity] = useState(4);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrModalTable, setQrModalTable] = useState<any | null>(null);
  const [suggestedNetworkIp, setSuggestedNetworkIp] = useState<string | null>(null);

  // Staff management states
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [staffName, setStaffName] = useState("");
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState("MOZO");
  const [staffIsActive, setStaffIsActive] = useState(true);

  // Platform customers states
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Cash registers management states
  const [registersList, setRegistersList] = useState<any[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingRegisterId, setEditingRegisterId] = useState<number | null>(null);
  const [registerName, setRegisterName] = useState("");
  const [registerAssignedUserId, setRegisterAssignedUserId] = useState<string>("");
  const [registerIsActive, setRegisterIsActive] = useState(true);

  const loadRegisters = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/cash/registers");
      if (res.success) {
        setRegistersList(res.registers || []);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar las cajas registradoras");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim()) {
      alert("El nombre de la caja es requerido");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: registerName,
        assignedUserId: registerAssignedUserId ? parseInt(registerAssignedUserId, 10) : null,
        isActive: registerIsActive,
      };
      
      let res;
      if (editingRegisterId) {
        res = await apiRequest(`/cash/registers/${editingRegisterId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiRequest("/cash/registers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.success) {
        setSuccessMsg(editingRegisterId ? "Caja modificada con éxito." : "Caja registrada con éxito.");
        setShowRegisterModal(false);
        setRegisterName("");
        setRegisterAssignedUserId("");
        setRegisterIsActive(true);
        setEditingRegisterId(null);
        loadRegisters();
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar la caja");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRegister = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta caja registradora?")) return;
    try {
      const res = await apiRequest(`/cash/registers/${id}`, {
        method: "DELETE",
      });
      if (res.success) {
        setSuccessMsg("Caja eliminada con éxito.");
        loadRegisters();
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al eliminar la caja");
      setTimeout(() => setError(null), 5000);
    }
  };

  const loadDiningAreas = async () => {
    try {
      const res = await apiRequest("/tables/dining-areas");
      if (res.success) {
        setDiningAreas(res.diningAreas || []);
        if (res.restaurant?.slug && !slug) {
          setSlug(res.restaurant.slug);
        }
        if (res.serverNetwork?.localIp) {
          setSuggestedNetworkIp(res.serverNetwork.localIp);
        }
      }
    } catch (err: any) {
      console.error("Error al cargar salones y mesas:", err);
    }
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/auth/staff");
      if (res.success) {
        setStaffList(res.staff || []);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar el personal");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/clients/platform-customers");
      if (res.success) {
        setCustomersList(res.customers || []);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddStaff = () => {
    setEditingStaffId(null);
    setStaffName("");
    setStaffUsername("");
    setStaffPassword("");
    setStaffEmail("");
    setStaffRole("MOZO");
    setStaffIsActive(true);
    setShowStaffModal(true);
  };

  const handleOpenEditStaff = (member: any) => {
    setEditingStaffId(member.id);
    setStaffName(member.name);
    setStaffUsername(member.username);
    setStaffPassword("");
    setStaffEmail(member.email || "");
    setStaffRole(member.role);
    setStaffIsActive(member.isActive);
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffUsername.trim()) return;

    try {
      setSaving(true);
      if (editingStaffId) {
        const res = await apiRequest(`/auth/staff/${editingStaffId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: staffName,
            email: staffEmail || null,
            role: staffRole,
            password: staffPassword || undefined,
            isActive: staffIsActive
          })
        });
        if (res.success) {
          setSuccessMsg("Personal actualizado con éxito.");
          loadStaff();
          setShowStaffModal(false);
        }
      } else {
        const res = await apiRequest("/auth/register-staff", {
          method: "POST",
          body: JSON.stringify({
            name: staffName,
            username: staffUsername,
            password: staffPassword,
            email: staffEmail || null,
            role: staffRole
          })
        });
        if (res.success) {
          setSuccessMsg("Personal creado con éxito.");
          loadStaff();
          setShowStaffModal(false);
        }
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar personal");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar a este miembro del personal?")) return;
    try {
      const res = await apiRequest(`/auth/staff/${id}`, {
        method: "DELETE"
      });
      if (res.success) {
        setSuccessMsg("Personal eliminado con éxito.");
        loadStaff();
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al eliminar personal");
      setTimeout(() => setError(null), 5000);
    }
  };

  const loadAllSaaSCategories = async () => {
    try {
      const res = await apiRequest("/saas-categories");
      if (res.success) {
        setAllCategories(res.categories || []);
      }
    } catch (err) {
      console.error("Error loading SaaS categories", err);
    }
  };

  // TAB INVENTARIO STATES
  const [inventorySubTab, setInventorySubTab] = useState<"supplies" | "suppliers" | "record_purchase" | "kardex" | "credits">("supplies");
  const [suppliesList, setSuppliesList] = useState<any[]>([]);
  const [supplyCategories, setSupplyCategories] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [movementsList, setMovementsList] = useState<any[]>([]);
  const [creditsList, setCreditsList] = useState<any[]>([]);

  // Modals visibility
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [editingSupplyId, setEditingSupplyId] = useState<number | null>(null);
  const [supplyName, setSupplyName] = useState("");
  const [supplyCode, setSupplyCode] = useState("");
  const [supplyCategoryId, setSupplyCategoryId] = useState("");
  const [supplyUnitId, setSupplyUnitId] = useState("");
  const [supplyStock, setSupplyStock] = useState("0");
  const [supplyMinStock, setSupplyMinStock] = useState("0");
  const [supplyCost, setSupplyCost] = useState("0");

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [supplierRuc, setSupplierRuc] = useState("");
  const [supplierBusinessName, setSupplierBusinessName] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierContactName, setSupplierContactName] = useState("");

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentSupplyId, setAdjustmentSupplyId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("OUT"); // IN or OUT
  const [adjustmentQty, setAdjustmentQty] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("DESPERDICIO"); // DESPERDICIO, AJUSTE_MANUAL

  const [showPayCreditModal, setShowPayCreditModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any | null>(null);
  const [payCreditAmount, setPayCreditAmount] = useState("");

  // Record Purchase Form State
  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseType, setPurchaseType] = useState("CONTADO");
  const [purchaseDocNumber, setPurchaseDocNumber] = useState("");
  const [purchaseDiscount, setPurchaseDiscount] = useState("0");
  const [purchaseItems, setPurchaseItems] = useState<any[]>([]);
  const [purchaseInterest, setPurchaseInterest] = useState("0");
  const [purchaseDueDate, setPurchaseDueDate] = useState("");

  // Add Item to Purchase Temp State
  const [tempSupplyId, setTempSupplyId] = useState("");
  const [tempQty, setTempQty] = useState("");
  const [tempPrice, setTempPrice] = useState("");

  const loadInventoryData = async () => {
    try {
      const supRes = await apiRequest("/inventory/supplies");
      if (supRes.success) setSuppliesList(supRes.supplies || []);

      const catRes = await apiRequest("/inventory/categories");
      if (catRes.success) setSupplyCategories(catRes.categories || []);

      const unitRes = await apiRequest("/inventory/units");
      if (unitRes.success) setUnitsList(unitRes.units || []);

      const supplierRes = await apiRequest("/purchases/suppliers");
      if (supplierRes.success) setSuppliersList(supplierRes.suppliers || []);

      const movRes = await apiRequest("/inventory/movements");
      if (movRes.success) setMovementsList(movRes.movements || []);

      const credRes = await apiRequest("/purchases/credits");
      if (credRes.success) setCreditsList(credRes.credits || []);
    } catch (e) {
      console.error("Error loading inventory data:", e);
    }
  };

  const handleOpenAddSupply = () => {
    setEditingSupplyId(null);
    setSupplyName("");
    setSupplyCode("");
    setSupplyCategoryId(supplyCategories.length > 0 ? supplyCategories[0].id.toString() : "");
    setSupplyUnitId(unitsList.length > 0 ? unitsList[0].id.toString() : "");
    setSupplyStock("0");
    setSupplyMinStock("0");
    setSupplyCost("0");
    setShowSupplyModal(true);
  };

  const handleOpenEditSupply = (supply: any) => {
    setEditingSupplyId(supply.id);
    setSupplyName(supply.name);
    setSupplyCode(supply.code || "");
    setSupplyCategoryId(supply.categoryId.toString());
    setSupplyUnitId(supply.unitId.toString());
    setSupplyStock(supply.stock.toString());
    setSupplyMinStock(supply.minStock.toString());
    setSupplyCost(supply.cost.toString());
    setShowSupplyModal(true);
  };

  const handleSaveSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyName || !supplyCategoryId || !supplyUnitId) {
      alert("Por favor completa los campos requeridos.");
      return;
    }

    const payload = {
      name: supplyName,
      code: supplyCode || null,
      categoryId: parseInt(supplyCategoryId, 10),
      unitId: parseInt(supplyUnitId, 10),
      stock: parseFloat(supplyStock) || 0,
      minStock: parseFloat(supplyMinStock) || 0,
      cost: parseFloat(supplyCost) || 0
    };

    try {
      if (editingSupplyId) {
        await apiRequest(`/inventory/supplies/${editingSupplyId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest("/inventory/supplies", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setShowSupplyModal(false);
      loadInventoryData();
      alert("Insumo guardado con éxito.");
    } catch (err: any) {
      alert(err.message || "Error al guardar el insumo.");
    }
  };

  const handleDeleteSupply = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este insumo?")) return;
    try {
      await apiRequest(`/inventory/supplies/${id}`, { method: "DELETE" });
      loadInventoryData();
      alert("Insumo eliminado con éxito.");
    } catch (err: any) {
      alert(err.message || "Error al eliminar el insumo.");
    }
  };

  const handleOpenAddSupplier = () => {
    setEditingSupplierId(null);
    setSupplierRuc("");
    setSupplierBusinessName("");
    setSupplierAddress("");
    setSupplierPhone("");
    setSupplierEmail("");
    setSupplierContactName("");
    setShowSupplierModal(true);
  };

  const handleOpenEditSupplier = (supplier: any) => {
    setEditingSupplierId(supplier.id);
    setSupplierRuc(supplier.ruc);
    setSupplierBusinessName(supplier.businessName);
    setSupplierAddress(supplier.address || "");
    setSupplierPhone(supplier.phone || "");
    setSupplierEmail(supplier.email || "");
    setSupplierContactName(supplier.contactName || "");
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierRuc || !supplierBusinessName) {
      alert("Por favor completa los campos requeridos.");
      return;
    }

    const payload = {
      ruc: supplierRuc,
      businessName: supplierBusinessName,
      address: supplierAddress || null,
      phone: supplierPhone || null,
      email: supplierEmail || null,
      contactName: supplierContactName || null
    };

    try {
      if (editingSupplierId) {
        await apiRequest(`/purchases/suppliers/${editingSupplierId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest("/purchases/suppliers", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setShowSupplierModal(false);
      loadInventoryData();
      alert("Proveedor guardado con éxito.");
    } catch (err: any) {
      alert(err.message || "Error al guardar proveedor.");
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este proveedor?")) return;
    try {
      await apiRequest(`/purchases/suppliers/${id}`, { method: "DELETE" });
      loadInventoryData();
      alert("Proveedor eliminado con éxito.");
    } catch (err: any) {
      alert(err.message || "Error al eliminar proveedor.");
    }
  };

  const handleOpenAdjustment = () => {
    setAdjustmentSupplyId(suppliesList.length > 0 ? suppliesList[0].id.toString() : "");
    setAdjustmentType("OUT");
    setAdjustmentQty("");
    setAdjustmentReason("DESPERDICIO");
    setShowAdjustmentModal(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentSupplyId || !adjustmentQty) {
      alert("Por favor completa los campos requeridos.");
      return;
    }

    try {
      await apiRequest("/inventory/movements", {
        method: "POST",
        body: JSON.stringify({
          supplyId: parseInt(adjustmentSupplyId, 10),
          type: adjustmentType,
          quantity: parseFloat(adjustmentQty),
          reason: adjustmentReason
        })
      });
      setShowAdjustmentModal(false);
      loadInventoryData();
      alert("Ajuste registrado con éxito.");
    } catch (err: any) {
      alert(err.message || "Error al registrar ajuste.");
    }
  };

  const handleAddPurchaseItem = () => {
    if (!tempSupplyId || !tempQty || !tempPrice) {
      alert("Por favor selecciona un insumo, cantidad y costo unitario.");
      return;
    }

    const supply = suppliesList.find(s => s.id === parseInt(tempSupplyId, 10));
    if (!supply) return;

    if (purchaseItems.some(i => i.supplyId === supply.id)) {
      alert("Este insumo ya está agregado a la lista de compra.");
      return;
    }

    setPurchaseItems(prev => [
      ...prev,
      {
        supplyId: supply.id,
        name: supply.name,
        quantity: parseFloat(tempQty),
        price: parseFloat(tempPrice)
      }
    ]);

    setTempSupplyId("");
    setTempQty("");
    setTempPrice("");
  };

  const handleRemovePurchaseItem = (supplyId: number) => {
    setPurchaseItems(prev => prev.filter(item => item.supplyId !== supplyId));
  };

  const getPurchaseTotal = () => {
    const total = purchaseItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return total - (parseFloat(purchaseDiscount) || 0);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseSupplierId || purchaseItems.length === 0) {
      alert("Por favor selecciona un proveedor y agrega al menos un insumo.");
      return;
    }

    const payload = {
      supplierId: parseInt(purchaseSupplierId, 10),
      docNumber: purchaseDocNumber || null,
      type: purchaseType,
      discount: parseFloat(purchaseDiscount) || 0,
      items: purchaseItems.map(i => ({
        supplyId: i.supplyId,
        quantity: i.quantity,
        price: i.price
      })),
      interest: purchaseType === "CREDITO" ? parseFloat(purchaseInterest) || 0 : undefined,
      dueDate: purchaseType === "CREDITO" && purchaseDueDate ? purchaseDueDate : undefined
    };

    try {
      await apiRequest("/purchases", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      alert("Compra registrada con éxito.");
      setPurchaseSupplierId("");
      setPurchaseDocNumber("");
      setPurchaseType("CONTADO");
      setPurchaseDiscount("0");
      setPurchaseItems([]);
      setPurchaseInterest("0");
      setPurchaseDueDate("");
      loadInventoryData();
      setInventorySubTab("kardex");
    } catch (err: any) {
      alert(err.message || "Error al registrar la compra.");
    }
  };

  const handleOpenPayCredit = (credit: any) => {
    setSelectedCredit(credit);
    const balance = credit.totalAmount - credit.paidAmount;
    setPayCreditAmount(balance.toFixed(2));
    setShowPayCreditModal(true);
  };

  const handlePayCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredit || !payCreditAmount) return;

    try {
      await apiRequest(`/purchases/credits/${selectedCredit.id}/pay`, {
        method: "POST",
        body: JSON.stringify({ amount: parseFloat(payCreditAmount) })
      });
      setShowPayCreditModal(false);
      setSelectedCredit(null);
      loadInventoryData();
      alert("Abono registrado con éxito.");
    } catch (err: any) {
      alert(err.message || "Error al registrar abono.");
    }
  };

  const loadRestaurantSettings = async () => {
    if (!user?.restaurantId) {
      if (user) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      await loadAllSaaSCategories();
      const res = await apiRequest(`/restaurants/${user.restaurantId}`);
      if (res.success && res.restaurant) {
        const r = res.restaurant;
        setName(r.name || "");
        setSlug(r.slug || "");
        setLogo(r.logo || "");
        setAddress(r.address || "");
        setPhone(r.phone || "");
        setWifiSsid(r.wifiSsid || "");
        setWifiPassword(r.wifiPassword || "");
        setQrOrderingEnabled(r.qrOrderingEnabled !== false);
        setPayphoneToken(r.payphoneToken || "");
        setCoverImage(r.coverImage || "");
        setDescription(r.description || "");
        setMapLatitude(r.mapLatitude !== null && r.mapLatitude !== undefined ? r.mapLatitude.toString() : "");
        setMapLongitude(r.mapLongitude !== null && r.mapLongitude !== undefined ? r.mapLongitude.toString() : "");
        setMapIframe(r.mapIframe || "");
        setReference(r.reference || "");
        setOpeningHours(r.openingHours || "");
        setSamePriceAsLocal(r.samePriceAsLocal === true);
        setPromoText(r.promoText || "");
        setSelectedCategoryIds(r.categories?.map((c: any) => c.id) || []);
        setSelectedSubcategoryIds(r.subcategories?.map((s: any) => s.id) || []);
        
        if (r.faqsJson) {
          try {
            setFaqs(JSON.parse(r.faqsJson));
          } catch (e) {
            setFaqs([]);
          }
        } else {
          setFaqs([]);
        }
        
        if (r.bankAccountsJson) {
          try {
            setBankAccounts(JSON.parse(r.bankAccountsJson));
          } catch (e) {
            setBankAccounts([]);
          }
        } else {
          setBankAccounts([]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurantSettings();
  }, [user]);

  useEffect(() => {
    if (activeTab === "tables") {
      loadDiningAreas();
    } else if (activeTab === "personal") {
      loadStaff();
    } else if (activeTab === "cajas") {
      loadRegisters();
      loadStaff();
    } else if (activeTab === "clientes") {
      loadCustomers();
    } else if (activeTab === "inventario") {
      loadInventoryData();
    }
  }, [activeTab]);

  // Handle QR image file upload
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setQrCodeImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResolveMapsLink = async (rawUrl: string) => {
    if (!rawUrl || !rawUrl.trim()) return;
    const raw = rawUrl.trim();
    setMapsDetectMsg(null);

    // 1. Direct Regex checks if it's already an iframe or full URL with coordinates
    const iframeMatch = raw.match(/src="([^"]+)"/i);
    const candidateUrl = iframeMatch ? iframeMatch[1] : raw;

    // Check !3d(lat)!4d(lng)
    const placeCoordsMatch = candidateUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (placeCoordsMatch) {
      const lat = parseFloat(placeCoordsMatch[1]).toFixed(6);
      const lng = parseFloat(placeCoordsMatch[2]).toFixed(6);
      setMapLatitude(lat);
      setMapLongitude(lng);
      setMapIframe(`<iframe src="https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`);
      setMapsDetectMsg({ type: "success", text: `¡Ubicación detectada! Coordenadas: (${lat}, ${lng})` });
      return;
    }

    // Check @lat,lng if not a shortened link
    if (!candidateUrl.includes("maps.app.goo.gl") && !candidateUrl.includes("goo.gl/maps")) {
      const atMatch = candidateUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        const lat = parseFloat(atMatch[1]).toFixed(6);
        const lng = parseFloat(atMatch[2]).toFixed(6);
        setMapLatitude(lat);
        setMapLongitude(lng);
        setMapIframe(`<iframe src="https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`);
        setMapsDetectMsg({ type: "success", text: `¡Ubicación detectada! Coordenadas: (${lat}, ${lng})` });
        return;
      }

      const qMatch = candidateUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
        const lat = parseFloat(qMatch[1]).toFixed(6);
        const lng = parseFloat(qMatch[2]).toFixed(6);
        setMapLatitude(lat);
        setMapLongitude(lng);
        setMapIframe(`<iframe src="https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`);
        setMapsDetectMsg({ type: "success", text: `¡Ubicación detectada! Coordenadas: (${lat}, ${lng})` });
        return;
      }
    }

    // 2. Call backend resolver for shortened links (maps.app.goo.gl, etc.)
    try {
      setResolvingMaps(true);
      const res = await apiRequest("/restaurants/resolve-maps-url", {
        method: "POST",
        body: JSON.stringify({ url: candidateUrl }),
      });

      if (res.success && res.lat && res.lng) {
        const lat = Number(res.lat).toFixed(6);
        const lng = Number(res.lng).toFixed(6);
        setMapLatitude(lat);
        setMapLongitude(lng);
        setMapIframe(`<iframe src="https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`);
        setMapsDetectMsg({
          type: "success",
          text: `¡Ubicación detectada con éxito! ${res.placeName ? `(${res.placeName}) ` : ""}[${lat}, ${lng}]`,
        });
      } else {
        setMapsDetectMsg({
          type: "error",
          text: res.message || "No se pudieron extraer las coordenadas del enlace.",
        });
      }
    } catch (err: any) {
      console.error("Error resolving maps URL:", err);
      setMapsDetectMsg({
        type: "error",
        text: err.message || "Error al conectar con el servidor para resolver el enlace.",
      });
    } finally {
      setResolvingMaps(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user?.restaurantId) {
      alert("No se encontró el ID del restaurante asociado a tu usuario. Por favor vuelve a iniciar sesión.");
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    setToastMsg(null);

    try {
      const body = {
        name,
        logo,
        address,
        phone,
        wifiSsid,
        wifiPassword,
        qrOrderingEnabled,
        payphoneToken,
        bankAccountsJson: JSON.stringify(bankAccounts),
        coverImage,
        description,
        mapLatitude: mapLatitude ? parseFloat(mapLatitude) : null,
        mapLongitude: mapLongitude ? parseFloat(mapLongitude) : null,
        mapIframe,
        reference,
        openingHours,
        samePriceAsLocal,
        promoText,
        faqsJson: JSON.stringify(faqs),
        categoryIds: selectedCategoryIds,
        subcategoryIds: selectedSubcategoryIds
      };

      const res = await apiRequest(`/restaurants/${user.restaurantId}`, {
        method: "PUT",
        body: JSON.stringify(body)
      });

      if (res.success) {
        setSuccessMsg("¡Configuración y ubicación guardadas con éxito!");
        setToastMsg("¡Configuración y ubicación guardadas con éxito!");
        setTimeout(() => {
          setSuccessMsg(null);
          setToastMsg(null);
        }, 4500);
      }
    } catch (err: any) {
      const msg = err.message || "Error al guardar la configuración";
      setError(msg);
      alert(`Error al guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddAccount = () => {
    setEditingAccountId(null);
    setBankName("");
    setAccountType("Ahorros");
    setAccountNumber("");
    setOwnerName("");
    setOwnerId("");
    setOwnerEmail("");
    setQrCodeImage("");
    setShowAccountModal(true);
  };

  const handleOpenEditAccount = (acc: BankAccount) => {
    setEditingAccountId(acc.id);
    setBankName(acc.bankName);
    setAccountType(acc.accountType);
    setAccountNumber(acc.accountNumber);
    setOwnerName(acc.ownerName);
    setOwnerId(acc.ownerId);
    setOwnerEmail(acc.ownerEmail || "");
    setQrCodeImage(acc.qrCodeImage || "");
    setShowAccountModal(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !ownerName || !ownerId) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    if (editingAccountId) {
      // Edit
      setBankAccounts(prev => prev.map(a => a.id === editingAccountId ? {
        id: editingAccountId,
        bankName,
        accountType,
        accountNumber,
        ownerName,
        ownerId,
        ownerEmail,
        qrCodeImage
      } : a));
    } else {
      // Add
      const newAcc: BankAccount = {
        id: Date.now().toString(),
        bankName,
        accountType,
        accountNumber,
        ownerName,
        ownerId,
        ownerEmail,
        qrCodeImage
      };
      setBankAccounts(prev => [...prev, newAcc]);
    }

    setShowAccountModal(false);
  };

  const handleDeleteAccount = (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta cuenta bancaria?")) {
      setBankAccounts(prev => prev.filter(a => a.id !== id));
    }
  };

  // CRUD actions for Dining Areas
  const handleOpenAddArea = () => {
    setEditingAreaId(null);
    setAreaName("");
    setShowAreaModal(true);
  };

  const handleOpenEditArea = (area: any) => {
    setEditingAreaId(area.id);
    setAreaName(area.name);
    setShowAreaModal(true);
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) return;

    try {
      setSaving(true);
      if (editingAreaId) {
        // Update
        const res = await apiRequest(`/tables/dining-areas/${editingAreaId}`, {
          method: "PUT",
          body: JSON.stringify({ name: areaName })
        });
        if (res.success) {
          setSuccessMsg("Salón actualizado con éxito.");
          loadDiningAreas();
        }
      } else {
        // Create
        const res = await apiRequest("/tables/dining-areas", {
          method: "POST",
          body: JSON.stringify({ name: areaName })
        });
        if (res.success) {
          setSuccessMsg("Salón creado con éxito.");
          loadDiningAreas();
        }
      }
      setShowAreaModal(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar salón");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArea = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este salón? Se eliminarán todas las mesas asociadas.")) return;
    try {
      const res = await apiRequest(`/tables/dining-areas/${id}`, {
        method: "DELETE"
      });
      if (res.success) {
        setSuccessMsg("Salón eliminado con éxito.");
        loadDiningAreas();
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al eliminar salón");
      setTimeout(() => setError(null), 5000);
    }
  };

  // CRUD actions for Tables
  const handleOpenAddTable = (areaId: number) => {
    setEditingTableId(null);
    setSelectedAreaId(areaId);
    setTableNumber("");
    setTableCapacity(4);
    setShowTableModal(true);
  };

  const handleOpenEditTable = (table: any, areaId: number) => {
    setEditingTableId(table.id);
    setSelectedAreaId(areaId);
    setTableNumber(table.number);
    setTableCapacity(table.capacity);
    setShowTableModal(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim() || !selectedAreaId) return;

    try {
      setSaving(true);
      if (editingTableId) {
        // Update
        const res = await apiRequest(`/tables/${editingTableId}`, {
          method: "PUT",
          body: JSON.stringify({
            number: tableNumber,
            capacity: tableCapacity
          })
        });
        if (res.success) {
          setSuccessMsg("Mesa actualizada con éxito.");
          loadDiningAreas();
        }
      } else {
        // Create
        const res = await apiRequest("/tables", {
          method: "POST",
          body: JSON.stringify({
            number: tableNumber,
            capacity: tableCapacity,
            diningAreaId: selectedAreaId
          })
        });
        if (res.success) {
          setSuccessMsg("Mesa creada con éxito.");
          loadDiningAreas();
        }
      }
      setShowTableModal(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar mesa");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta mesa?")) return;
    try {
      const res = await apiRequest(`/tables/${id}`, {
        method: "DELETE"
      });
      if (res.success) {
        setSuccessMsg("Mesa eliminada con éxito.");
        loadDiningAreas();
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error al eliminar mesa");
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Loader2 className="spinner" size={40} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "30px auto", padding: "0 20px" }} className="animate-fade-in">
      {/* Floating High-Visibility Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed",
          top: "28px",
          right: "28px",
          zIndex: 999999,
          backgroundColor: "#10b981",
          color: "#ffffff",
          padding: "16px 26px",
          borderRadius: "14px",
          boxShadow: "0 12px 35px rgba(0,0,0,0.6), 0 0 25px rgba(16,185,129,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "15px",
          fontWeight: "800",
          border: "1px solid rgba(255,255,255,0.35)",
          animation: "fadeIn 0.25s ease"
        }}>
          <CheckCircle size={22} color="#ffffff" />
          <span>{toastMsg}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "10px" }}>
            <SettingsIcon size={26} style={{ color: "var(--accent-primary)" }} />
            Configuración del Restaurante
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "5px 0 0 0" }}>
            Administra los datos generales de tu local, claves de pago y cuentas bancarias.
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: "rgba(46, 213, 115, 0.1)",
          border: "1px solid var(--success)",
          color: "var(--success)",
          padding: "12px",
          borderRadius: "var(--radius-md)",
          marginBottom: "20px",
          fontSize: "14px",
          fontWeight: 600
        }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: "rgba(255, 71, 87, 0.1)",
          border: "1px solid var(--accent-primary)",
          color: "var(--accent-primary)",
          padding: "12px",
          borderRadius: "var(--radius-md)",
          marginBottom: "20px",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}



      <form onSubmit={handleSaveSettings}>
        {/* TAB 1: GENERAL SETTINGS */}
        {activeTab === "general" && (
          <div className="glass-card" style={{ padding: "30px", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
              Perfil del Restaurante
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div className="input-group">
                <label>Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Logo del Restaurante</label>
                <input
                  type="text"
                  placeholder="URL de la imagen (ej. https://ejemplo.com/logo.png)"
                  value={logo.startsWith("data:image") ? "Archivo cargado localmente" : logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="input-field"
                  disabled={logo.startsWith("data:image")}
                  style={{ marginBottom: "6px" }}
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <label style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-light)",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all var(--transition-fast)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}>
                    <Upload size={14} style={{ color: "var(--accent-primary)" }} />
                    <span>Seleccionar archivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogo(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                  {logo && logo.startsWith("data:image") && (
                    <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 500 }}>
                      Cargado ✓
                    </span>
                  )}
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo("")}
                      style={{
                        fontSize: "11px",
                        color: "var(--accent-primary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        fontWeight: 600
                      }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "25px" }}>
              <div className="input-group">
                <label>Dirección Física</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Teléfono de Contacto</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <h3 style={{ fontSize: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", marginTop: "30px" }}>
              <Wifi size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "var(--accent-secondary)" }} />
              Red WiFi local (Para Clientes en Mesa)
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div className="input-group">
                <label>SSID / Nombre de Red WiFi</label>
                <input
                  type="text"
                  placeholder="Ej. WiFi_Goeats"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Contraseña WiFi</label>
                <input
                  type="text"
                  placeholder="Contraseña de red"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "25px",
              padding: "15px",
              backgroundColor: "var(--bg-tertiary)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-light)"
            }}>
              <input
                type="checkbox"
                id="qr-ordering"
                checked={qrOrderingEnabled}
                onChange={(e) => setQrOrderingEnabled(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--accent-primary)", cursor: "pointer" }}
              />
              <label htmlFor="qr-ordering" style={{ fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                Habilitar Autoservicio QR (Los clientes en mesa pueden realizar pedidos directos desde su celular)
              </label>
            </div>

            <h3 style={{ fontSize: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", marginTop: "30px" }}>
              <Building2 size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "var(--accent-secondary)" }} />
              Personalización de la Portada y Presentación
            </h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              alignItems: "center",
              marginBottom: "20px",
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={samePriceAsLocal}
                  onChange={(e) => setSamePriceAsLocal(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--accent-primary)", cursor: "pointer" }}
                />
                Mismos precios que en el local
              </label>
              <div className="input-group" style={{ margin: 0 }}>
                <label htmlFor="restaurant-promo">Oferta para mostrar en GoEats (opcional)</label>
                <input
                  id="restaurant-promo"
                  type="text"
                  maxLength={191}
                  placeholder="Ej. 15% de descuento en tu pedido"
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div className="input-group">
                <label>Slogan o Descripción Corta</label>
                <input
                  type="text"
                  placeholder="Ej. Con alma esmeraldeña - Los mejores bolones"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Imagen de Portada / Banner</label>
                <input
                  type="text"
                  placeholder="URL de la imagen (ej. https://ejemplo.com/banner.jpg)"
                  value={coverImage.startsWith("data:image") ? "Archivo cargado localmente" : coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="input-field"
                  disabled={coverImage.startsWith("data:image")}
                  style={{ marginBottom: "6px" }}
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <label style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-light)",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all var(--transition-fast)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}>
                    <Upload size={14} style={{ color: "var(--accent-primary)" }} />
                    <span>Seleccionar archivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCoverImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                  {coverImage && coverImage.startsWith("data:image") && (
                    <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 500 }}>
                      Cargado ✓
                    </span>
                  )}
                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      style={{
                        fontSize: "11px",
                        color: "var(--accent-primary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        fontWeight: 600
                      }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", marginTop: "30px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={18} style={{ color: "var(--accent-secondary)" }} />
                Ubicación del Local en el Mapa & Horarios
              </span>

              {/* Botón GPS Rápido 1 Clic */}
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) {
                    alert("Tu navegador no soporta geolocalización GPS.");
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const lat = pos.coords.latitude.toFixed(6);
                      const lng = pos.coords.longitude.toFixed(6);
                      setMapLatitude(lat);
                      setMapLongitude(lng);
                      setMapIframe(`<iframe src="https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`);
                      alert(`¡Ubicación GPS detectada al instante! (${lat}, ${lng})`);
                    },
                    (err) => {
                      console.warn("GPS error:", err);
                      alert("No pudimos obtener el GPS automático. Por favor mueve el pin en el mapa de abajo.");
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "rgba(46, 213, 115, 0.15)",
                  color: "#2ed573",
                  border: "1px solid rgba(46, 213, 115, 0.3)",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <Navigation size={13} />
                <span>{systemIconForEmoji("📍")} Detectar mi GPS Actual</span>
              </button>
            </h3>

            {/* Selector Rápido de Ciudades */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "15px",
              padding: "10px 14px",
              backgroundColor: "var(--bg-tertiary)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)"
            }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginRight: "4px" }}>
                {systemIconForEmoji("⚡")} Fijar Ciudad:
              </span>
              {[
                { name: "Loja Centro", lat: "-3.993130", lng: "-79.204220" },
                { name: "El Artesanal (Loja)", lat: "-3.996500", lng: "-79.203000" },
                { name: "Quito", lat: "-0.180700", lng: "-78.484200" },
                { name: "Guayaquil", lat: "-2.189400", lng: "-79.889100" },
                { name: "Cuenca", lat: "-2.900100", lng: "-79.005900" },
              ].map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => {
                    setMapLatitude(city.lat);
                    setMapLongitude(city.lng);
                    setMapIframe(`<iframe src="https://maps.google.com/maps?q=${city.lat},${city.lng}&z=16&output=embed" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`);
                  }}
                  style={{
                    backgroundColor: mapLatitude === city.lat ? "var(--accent-primary)" : "var(--bg-secondary)",
                    color: mapLatitude === city.lat ? "#ffffff" : "var(--text-primary)",
                    border: "1px solid var(--border-light)",
                    padding: "4px 10px",
                    borderRadius: "14px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  {systemIconForEmoji("📍")}
                  {city.name}
                </button>
              ))}
            </div>

            {/* Smart Google Maps Link Parser */}
            <div className="input-group" style={{ marginBottom: "15px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={14} color="#ffd700" />
                <span>Auto-detectar desde Enlace de Google Maps o Iframe</span>
              </label>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Pega aquí cualquier enlace de Google Maps (ej. https://maps.app.goo.gl/... o https://maps.google.com/?q=-3.9965,-79.2030 o iframe)"
                  value={mapIframe.startsWith("<iframe") ? "Iframe configurado ✓" : mapIframe}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMapIframe(val);
                    if (val.trim()) {
                      handleResolveMapsLink(val);
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    if (pasted && pasted.trim()) {
                      setTimeout(() => handleResolveMapsLink(pasted), 50);
                    }
                  }}
                  className="input-field"
                  style={{ flex: 1 }}
                />

                <button
                  type="button"
                  onClick={() => handleResolveMapsLink(mapIframe)}
                  disabled={resolvingMaps || !mapIframe.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "var(--accent-primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: resolvingMaps || !mapIframe.trim() ? "not-allowed" : "pointer",
                    opacity: resolvingMaps || !mapIframe.trim() ? 0.6 : 1,
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  {resolvingMaps ? (
                    <>
                      <Loader2 size={15} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
                      Detectando...
                    </>
                  ) : (
                    <>
                      <Navigation size={14} />
                      Detectar
                    </>
                  )}
                </button>
              </div>

              {mapsDetectMsg && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    backgroundColor: mapsDetectMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
                    color: mapsDetectMsg.type === "success" ? "#065f46" : "#991b1b",
                    border: `1px solid ${mapsDetectMsg.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {mapsDetectMsg.type === "success" ? <CheckCircle size={15} /> : <HelpCircle size={15} />}
                  <span>{mapsDetectMsg.text}</span>
                </div>
              )}

              <small style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                {systemIconForEmoji("💡")} Pega cualquier link de Google Maps (incluyendo enlaces cortos como maps.app.goo.gl) y las coordenadas se extraerán automáticamente.
              </small>
            </div>

            {/* Interactive Visual Map Picker for Restaurant Only */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", marginBottom: "8px", display: "block", color: "var(--text-primary)" }}>
                {systemIconForEmoji("🗺️")} Ubicación Oficial de la Puerta de tu Local (Arrastra o Haz Clic)
              </label>
              <RestaurantLocationPicker
                key={`${mapLatitude}-${mapLongitude}`}
                initialLat={parseFloat(mapLatitude) || -3.99313}
                initialLng={parseFloat(mapLongitude) || -79.20422}
                restaurantName={name || "Mi Restaurante"}
                onLocationSelect={(lat, lng) => {
                  const sLat = lat.toFixed(6);
                  const sLng = lng.toFixed(6);
                  setMapLatitude(sLat);
                  setMapLongitude(sLng);
                  setMapIframe(`<iframe src="https://maps.google.com/maps?q=${sLat},${sLng}&z=16&output=embed" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`);
                }}
                height="280px"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div className="input-group">
                <label>Referencia de Dirección</label>
                <input
                  type="text"
                  placeholder="Ej. Junto Al Hospital Panamericano, Calle 24 de Mayo"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Horarios de Atención (Texto)</label>
                <input
                  type="text"
                  placeholder="Ej. Lunes a Domingo: 8:00 a.m. - 11:00 p.m."
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Numeric Coordinates (Auto-filled) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div className="input-group">
                <label>Latitud GPS (Auto-generada)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="-3.993130"
                  value={mapLatitude}
                  onChange={(e) => setMapLatitude(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Longitud GPS (Auto-generada)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="-79.204220"
                  value={mapLongitude}
                  onChange={(e) => setMapLongitude(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Botón Rápido para Guardar la Ubicación Directamente */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "25px" }}>
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={saving}
                style={{
                  backgroundColor: "#ff9f43",
                  color: "#000000",
                  border: "none",
                  borderRadius: "12px",
                  padding: "11px 22px",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(255,159,67,0.35)",
                  transition: "all 0.2s ease"
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Guardando Ubicación...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{systemIconForEmoji("💾")} Guardar Ubicación del Local</span>
                  </>
                )}
              </button>
            </div>

            <h3 style={{ fontSize: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", marginTop: "30px" }}>
              <HelpCircle size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "var(--accent-secondary)" }} />
              Preguntas Frecuentes (FAQs)
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {faqs.map((faq, index) => (
                <div key={index} style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  backgroundColor: "var(--bg-tertiary)",
                  padding: "15px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-light)"
                }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="Pregunta"
                      value={faq.question}
                      onChange={(e) => {
                        const newFaqs = [...faqs];
                        newFaqs[index].question = e.target.value;
                        setFaqs(newFaqs);
                      }}
                      className="input-field"
                      style={{ fontWeight: "bold" }}
                    />
                    <textarea
                      placeholder="Respuesta"
                      value={faq.answer}
                      onChange={(e) => {
                        const newFaqs = [...faqs];
                        newFaqs[index].answer = e.target.value;
                        setFaqs(newFaqs);
                      }}
                      className="input-field"
                      rows={2}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFaqs(faqs.filter((_, i) => i !== index));
                    }}
                    style={{
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--accent-primary)",
                      backgroundColor: "transparent",
                      color: "var(--accent-primary)",
                      cursor: "pointer"
                    }}
                    title="Eliminar Pregunta"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px",
                  border: "2px dashed var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all var(--transition-fast)"
                }}
              >
                <Plus size={16} />
                Agregar Pregunta Frecuente
              </button>
            </div>

            <h3 style={{ fontSize: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", marginTop: "30px" }}>
              <Tag size={18} style={{ marginRight: "8px", verticalAlign: "middle", color: "var(--accent-secondary)" }} />
              Categorización del Negocio
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Selecciona a qué categorías y subcategorías pertenece tu restaurante. Esto determinará en qué secciones del feed de clientes y del catálogo público aparecerá tu local.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "25px" }}>
              {allCategories.length === 0 ? (
                <div style={{ padding: "15px", border: "1px dashed var(--border-light)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)", fontSize: "13px" }}>
                  No hay categorías globales configuradas en el sistema. Contacta al administrador.
                </div>
              ) : (
                allCategories.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      padding: "15px",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--bg-secondary)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
                      <input
                        type="checkbox"
                        id={`cat-${cat.id}`}
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategoryIds(prev => [...prev, cat.id]);
                          } else {
                            setSelectedCategoryIds(prev => prev.filter(id => id !== cat.id));
                            // Also uncheck child subcategories
                            const subIds = cat.subcategories.map((s: any) => s.id);
                            setSelectedSubcategoryIds(prev => prev.filter(id => !subIds.includes(id)));
                          }
                        }}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--accent-primary)" }}
                      />
                      <label htmlFor={`cat-${cat.id}`} style={{ marginBottom: 0, cursor: "pointer", color: "var(--text-primary)" }}>
                        {cat.name}
                      </label>
                    </div>

                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "12px", paddingLeft: "24px" }}>
                        {cat.subcategories.map((sub: any) => (
                          <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                              type="checkbox"
                              id={`sub-${sub.id}`}
                              checked={selectedSubcategoryIds.includes(sub.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubcategoryIds(prev => [...prev, sub.id]);
                                  // Automatically check parent category
                                  if (!selectedCategoryIds.includes(cat.id)) {
                                    setSelectedCategoryIds(prev => [...prev, cat.id]);
                                  }
                                } else {
                                  setSelectedSubcategoryIds(prev => prev.filter(id => id !== sub.id));
                                }
                              }}
                              style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "var(--accent-primary)" }}
                            />
                            <label htmlFor={`sub-${sub.id}`} style={{ marginBottom: 0, fontSize: "13px", cursor: "pointer", color: "var(--text-secondary)" }}>
                              {sub.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENT SETTINGS */}
        {activeTab === "payments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            {/* Payphone configuration */}
            <div className="glass-card" style={{ padding: "30px", borderRadius: "var(--radius-lg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                <CreditCard size={20} style={{ color: "var(--accent-secondary)" }} />
                <h3 style={{ fontSize: "16px", margin: 0 }}>Pasarela de Pago: Payphone (Ecuador)</h3>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Configura tu token para permitir cobros en línea con tarjetas de crédito y débito.
              </p>
              
              <div className="input-group">
                <label>Token de la Aplicación (App Token)</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={payphoneToken}
                  onChange={(e) => setPayphoneToken(e.target.value)}
                  className="input-field"
                  style={{ fontFamily: "monospace" }}
                />
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Obtén este token desde tu consola de desarrollador en Payphone Developer Portal.
                </span>
              </div>
            </div>

            {/* Bank Accounts configuration */}
            <div className="glass-card" style={{ padding: "30px", borderRadius: "var(--radius-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Building2 size={20} style={{ color: "var(--accent-secondary)" }} />
                  <h3 style={{ fontSize: "16px", margin: 0 }}>Cuentas Bancarias y Códigos QR</h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddAccount}
                  className="glow-btn"
                  style={{ padding: "8px 14px", fontSize: "12px" }}
                >
                  <Plus size={14} />
                  Agregar Cuenta
                </button>
              </div>

              {bankAccounts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  <Building2 size={40} style={{ margin: "0 auto 15px auto", opacity: 0.5 }} />
                  <p style={{ fontSize: "14px", margin: 0 }}>No tienes cuentas bancarias configuradas.</p>
                  <p style={{ fontSize: "12px", margin: "5px 0 0 0" }}>Los clientes no podrán elegir "Transferencia Bancaria" en Delivery.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  {bankAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      style={{
                        padding: "15px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-light)",
                        position: "relative",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>{acc.bankName}</strong>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          {acc.accountType} — <strong>{acc.accountNumber}</strong>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                          <strong>Titular:</strong> {acc.ownerName} ({acc.ownerId})
                        </div>
                        {acc.qrCodeImage && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "11px", color: "var(--success)" }}>
                            <QrCode size={14} />
                            <span>Código QR de Pago rápido adjunto</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditAccount(acc)}
                          style={{
                            padding: "6px",
                            borderRadius: "4px",
                            backgroundColor: "var(--bg-tertiary)",
                            border: "1px solid var(--border-light)",
                            color: "var(--text-secondary)",
                            cursor: "pointer"
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc.id)}
                          style={{
                            padding: "6px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(255, 71, 87, 0.1)",
                            border: "1px solid rgba(255, 71, 87, 0.2)",
                            color: "var(--accent-primary)",
                            cursor: "pointer"
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sticky Form Actions */}
        {(activeTab === "general" || activeTab === "payments") && (
          <div style={{
            position: "sticky",
            bottom: "20px",
            zIndex: 1000,
            marginTop: "30px",
            padding: "16px 24px",
            backgroundColor: "rgba(20, 24, 33, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={16} color="#10b981" />
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Guarda los cambios para actualizar el menú público y mapa de clientes.
              </span>
            </div>

            <button
              type="submit"
              className="glow-btn"
              disabled={saving}
              style={{
                padding: "12px 28px",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="spinner" size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Guardando cambios...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {systemIconForEmoji("💾")} Guardar Todos los Cambios
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* TAB 3: TABLES SETTINGS */}
      {activeTab === "tables" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }} className="animate-fade-in">
          {/* Header Action */}
          <div className="glass-card" style={{
            padding: "20px 30px",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h3 style={{ fontSize: "16px", margin: 0, fontWeight: 700 }}>Distribución Física de Salones</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                Organiza tu restaurante por áreas (salón, terraza, VIP) y gestiona sus mesas para pedidos rápidos por QR.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setQrModalTable(null);
                  setShowQRModal(true);
                }}
                className="glow-btn"
                style={{
                  padding: "10px 18px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                title="Ver, descargar o imprimir códigos QR de las mesas"
              >
                <QrCode size={16} />
                Códigos QR de Mesas
              </button>

              <button
                type="button"
                onClick={handleOpenAddArea}
                className="secondary-btn"
                style={{
                  padding: "10px 18px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Plus size={16} />
                Crear Salón / Sala
              </button>
            </div>
          </div>

          {/* Dining Areas List */}
          {diningAreas.length === 0 ? (
            <div className="glass-card" style={{
              textAlign: "center",
              padding: "60px 40px",
              color: "var(--text-muted)",
              borderRadius: "var(--radius-lg)"
            }}>
              <Store size={48} style={{ margin: "0 auto 15px auto", opacity: 0.4, color: "var(--accent-secondary)" }} />
              <h4 style={{ fontSize: "16px", color: "var(--text-primary)", margin: "0 0 5px 0" }}>No tienes salones creados</h4>
              <p style={{ fontSize: "13px", maxWidth: "400px", margin: "0 auto 20px auto" }}>
                Comienza agregando un salón (por ejemplo, "Salón Principal" o "Terraza") para organizar y generar los códigos QR de tus mesas.
              </p>
              <button
                type="button"
                onClick={handleOpenAddArea}
                className="glow-btn"
                style={{ padding: "10px 20px" }}
              >
                Crear mi primer salón
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {diningAreas.map((area) => (
                <div
                  key={area.id}
                  className="glass-card"
                  style={{
                    padding: "25px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border-light)"
                  }}
                >
                  {/* Area Header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border-light)",
                    paddingBottom: "15px",
                    marginBottom: "20px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Store size={20} style={{ color: "var(--accent-secondary)" }} />
                      <h3 style={{ fontSize: "18px", margin: 0, fontWeight: 700 }}>
                        {area.name}
                        <span style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "var(--text-secondary)",
                          marginLeft: "10px",
                          backgroundColor: "var(--bg-tertiary)",
                          padding: "3px 8px",
                          borderRadius: "12px"
                        }}>
                          {area.tables?.length || 0} {area.tables?.length === 1 ? "mesa" : "mesas"}
                        </span>
                      </h3>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      {area.tables && area.tables.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setQrModalTable(area.tables[0]);
                            setShowQRModal(true);
                          }}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "rgba(255, 71, 87, 0.08)",
                            border: "1px solid rgba(255, 71, 87, 0.2)",
                            color: "var(--accent-primary)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontWeight: 600
                          }}
                          title="Ver o imprimir los códigos QR de este salón"
                        >
                          <QrCode size={14} />
                          QRs del Salón
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenAddTable(area.id)}
                        className="glow-btn"
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          backgroundColor: "rgba(46, 213, 115, 0.1)",
                          color: "var(--success)",
                          border: "1px solid rgba(46, 213, 115, 0.2)",
                          boxShadow: "none"
                        }}
                      >
                        <Plus size={14} />
                        Nueva Mesa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditArea(area)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-tertiary)",
                          border: "1px solid var(--border-light)",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArea(area.id)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "rgba(255, 71, 87, 0.1)",
                          border: "1px solid rgba(255, 71, 87, 0.2)",
                          color: "var(--accent-primary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Area Tables Grid */}
                  {!area.tables || area.tables.length === 0 ? (
                    <div style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "var(--text-muted)",
                      backgroundColor: "var(--bg-secondary)",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed var(--border-light)"
                    }}>
                      <QrCode size={30} style={{ margin: "0 auto 10px auto", opacity: 0.4 }} />
                      <p style={{ fontSize: "13px", margin: 0 }}>No hay mesas registradas en este salón.</p>
                      <button
                        type="button"
                        onClick={() => handleOpenAddTable(area.id)}
                        style={{
                          marginTop: "10px",
                          fontSize: "12px",
                          color: "var(--accent-secondary)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                          textDecoration: "underline"
                        }}
                      >
                        Crear Mesa
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "15px"
                    }}>
                      {area.tables.map((table: any) => (
                        <div
                          key={table.id}
                          style={{
                            padding: "16px",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "var(--bg-secondary)",
                            border: "1px solid var(--border-light)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            minHeight: "130px",
                            transition: "transform var(--transition-fast)"
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <strong style={{ fontSize: "16px", color: "var(--text-primary)" }}>
                                Mesa {table.number}
                              </strong>
                              <span style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                backgroundColor: "var(--bg-tertiary)",
                                color: "var(--text-secondary)"
                              }}>
                                Cap: {table.capacity}
                              </span>
                            </div>
                            <div style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                              marginTop: "8px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              <span style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: table.status === "OCCUPIED" ? "var(--accent-primary)" : "var(--success)"
                              }}></span>
                              {table.status === "OCCUPIED" ? "Ocupada" : "Libre"}
                            </div>
                          </div>

                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "15px",
                            borderTop: "1px solid var(--border-light)",
                            paddingTop: "12px"
                          }}>
                            <button
                              type="button"
                              onClick={() => {
                                setQrModalTable(table);
                                setShowQRModal(true);
                              }}
                              style={{
                                fontSize: "11px",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                backgroundColor: "rgba(255, 71, 87, 0.08)",
                                border: "1px solid rgba(255, 71, 87, 0.2)",
                                color: "var(--accent-primary)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: 700
                              }}
                              title="Ver, probar o imprimir el código QR de esta mesa"
                            >
                              <QrCode size={12} />
                              Ver / Imprimir QR
                            </button>

                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditTable(table, area.id)}
                                style={{
                                  padding: "4px",
                                  borderRadius: "4px",
                                  backgroundColor: "var(--bg-tertiary)",
                                  border: "1px solid var(--border-light)",
                                  color: "var(--text-secondary)",
                                  cursor: "pointer"
                                }}
                                title="Editar mesa"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTable(table.id)}
                                style={{
                                  padding: "4px",
                                  borderRadius: "4px",
                                  backgroundColor: "rgba(255, 71, 87, 0.05)",
                                  border: "1px solid rgba(255, 71, 87, 0.15)",
                                  color: "var(--accent-primary)",
                                  cursor: "pointer"
                                }}
                                title="Eliminar mesa"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BANK ACCOUNT MODAL */}
      {showAccountModal && createPortal(
        <div 
          className="global-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAccountModal(false);
          }}
        >
          <div className="global-modal-card" style={{ maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={20} style={{ color: "var(--accent-primary)" }} />
                {editingAccountId ? "Editar Cuenta Bancaria" : "Agregar Cuenta Bancaria"}
              </h2>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="global-modal-close-btn"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="input-group">
                <label>Nombre del Banco *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Banco Pichincha, Banco Guayaquil"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div className="input-group">
                  <label>Tipo de Cuenta *</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="input-field"
                    style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                  >
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Número de Cuenta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 2201928475"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Titular de la Cuenta *</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre completo del titular"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div className="input-group">
                  <label>Identificación (RUC/Cédula) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1712345678"
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value.replace(/\D/g, ""))}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Upload QR quick payment */}
              <div className="input-group">
                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <QrCode size={15} style={{ color: "var(--accent-secondary)" }} />
                  Imagen Código QR de Pago Rápido (Opcional)
                </label>
                <div style={{
                  border: "1px dashed var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  padding: "15px",
                  textAlign: "center",
                  backgroundColor: "var(--bg-tertiary)",
                  position: "relative"
                }}>
                  {qrCodeImage ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <img src={qrCodeImage} alt="QR Pago" style={{ width: "100px", height: "100px", objectFit: "contain", border: "1px solid var(--border-light)" }} />
                      <button
                        type="button"
                        onClick={() => setQrCodeImage("")}
                        style={{
                          fontSize: "11px",
                          color: "var(--accent-primary)",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        Remover Imagen
                      </button>
                    </div>
                  ) : (
                    <label style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <ImageIcon size={24} style={{ color: "var(--text-muted)" }} />
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Subir imagen QR (Deuna, Pichincha, etc.)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrUpload}
                        style={{ display: "none" }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="secondary-btn"
                  style={{ flex: 1, padding: "10px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="glow-btn"
                  style={{ flex: 1, padding: "10px" }}
                >
                  {editingAccountId ? "Actualizar Cuenta" : "Agregar Cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DINING AREA MODAL */}
      {showAreaModal && createPortal(
        <div 
          className="global-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAreaModal(false);
          }}
        >
          <div className="global-modal-card" style={{ maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                <Store size={20} style={{ color: "var(--accent-primary)" }} />
                {editingAreaId ? "Editar Salón" : "Crear Nuevo Salón"}
              </h2>
              <button
                type="button"
                onClick={() => setShowAreaModal(false)}
                className="global-modal-close-btn"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveArea} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="input-group">
                <label>Nombre del Salón *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Salón Principal, Terraza, VIP"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  type="button"
                  onClick={() => setShowAreaModal(false)}
                  className="secondary-btn"
                  style={{ flex: 1, padding: "10px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="glow-btn"
                  style={{ flex: 1, padding: "10px" }}
                >
                  {editingAreaId ? "Guardar Cambios" : "Crear Salón"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* TAB 4: PERSONAL (STAFF) SETTINGS */}
      {activeTab === "personal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }} className="animate-fade-in">
          <div className="glass-card" style={{
            padding: "20px 30px",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h3 style={{ fontSize: "16px", margin: 0, fontWeight: 700 }}>Gestión de Personal del Local</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                Administra las cuentas de cajeros, meseros y cocineros que acceden al sistema interno.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddStaff}
              className="glow-btn"
              style={{
                padding: "10px 18px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Plus size={16} />
              Agregar Personal
            </button>
          </div>

          <div className="glass-card" style={{ padding: "0", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-light)" }}>
                  <th style={{ padding: "15px 20px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: "15px 20px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Usuario</th>
                  <th style={{ padding: "15px 20px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Correo</th>
                  <th style={{ padding: "15px 20px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Rol</th>
                  <th style={{ padding: "15px 20px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: "15px 20px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px", textTransform: "none", textAlign: "center", color: "var(--text-muted)" }}>
                      No tienes personal registrado. Haz clic en "Agregar Personal" para comenzar.
                    </td>
                  </tr>
                ) : (
                  staffList.map((member) => (
                    <tr key={member.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.01)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ padding: "15px 20px", fontSize: "14px", fontWeight: 600 }}>{member.name}</td>
                      <td style={{ padding: "15px 20px", fontSize: "14px" }}>{member.username}</td>
                      <td style={{ padding: "15px 20px", fontSize: "14px", color: "var(--text-secondary)" }}>{member.email || "—"}</td>
                      <td style={{ padding: "15px 20px", fontSize: "14px" }}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "10px",
                          backgroundColor: member.role === "CAJERO" ? "rgba(46, 213, 115, 0.1)" : member.role === "PRODUCCION" ? "rgba(255, 175, 64, 0.1)" : "rgba(52, 152, 219, 0.1)",
                          color: member.role === "CAJERO" ? "var(--success)" : member.role === "PRODUCCION" ? "var(--warning)" : "#3498db"
                        }}>
                          {member.role === "CAJERO" ? "Cajero" : member.role === "PRODUCCION" ? "Cocina" : "Mesero"}
                        </span>
                      </td>
                      <td style={{ padding: "15px 20px", fontSize: "14px" }}>
                        <span style={{ color: member.isActive ? "var(--success)" : "var(--accent-primary)", fontWeight: 600 }}>
                          {member.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={{ padding: "15px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditStaff(member)}
                            style={{
                              padding: "6px",
                              borderRadius: "4px",
                              backgroundColor: "var(--bg-tertiary)",
                              border: "1px solid var(--border-light)",
                              color: "var(--text-secondary)",
                              cursor: "pointer"
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(member.id)}
                            style={{
                              padding: "6px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255, 71, 87, 0.1)",
                              border: "1px solid rgba(255, 71, 87, 0.2)",
                              color: "var(--accent-primary)",
                              cursor: "pointer"
                            }}
                          >
                            <Trash2 size={14} />
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

      {/* TAB: CAJAS REGISTRADORAS */}
      {activeTab === "cajas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }} className="animate-fade-in">
          <div className="glass-card" style={{
            padding: "20px 30px",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h3 style={{ fontSize: "16px", margin: 0, fontWeight: 700 }}>Gestión de Cajas Registradoras</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                Administra las cajas registradoras de tu local y asigna cajeros responsables.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRegisterId(null);
                setRegisterName("");
                setRegisterAssignedUserId("");
                setRegisterIsActive(true);
                setShowRegisterModal(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--accent-primary)",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <Plus size={16} />
              Agregar Caja
            </button>
          </div>

          <div className="glass-card" style={{ padding: "0", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                  <th style={{ padding: "12px 20px", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 700 }}>Nombre de Caja</th>
                  <th style={{ padding: "12px 20px", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 700 }}>Cajero Asignado</th>
                  <th style={{ padding: "12px 20px", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 700 }}>Estado</th>
                  <th style={{ padding: "12px 20px", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 700, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registersList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "40px", textTransform: "none", textAlign: "center", color: "var(--text-muted)" }}>
                      No tienes cajas registradoras creadas. Haz clic en "Agregar Caja" para comenzar.
                    </td>
                  </tr>
                ) : (
                  registersList.map((reg) => (
                    <tr key={reg.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.01)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ padding: "15px 20px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {reg.name}
                      </td>
                      <td style={{ padding: "15px 20px", fontSize: "13px", color: "var(--text-primary)" }}>
                        {reg.assignedUser ? (
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "12px",
                            backgroundColor: "rgba(0, 165, 67, 0.1)",
                            color: "var(--accent-primary)",
                            fontWeight: 600
                          }}>
                            {reg.assignedUser.name}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Sin asignar</span>
                        )}
                      </td>
                      <td style={{ padding: "15px 20px", fontSize: "13px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: 700,
                          backgroundColor: reg.isActive ? "rgba(0, 165, 67, 0.1)" : "rgba(255, 71, 87, 0.1)",
                          color: reg.isActive ? "var(--accent-primary)" : "#ff4757"
                        }}>
                          {reg.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td style={{ padding: "15px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRegisterId(reg.id);
                              setRegisterName(reg.name);
                              setRegisterAssignedUserId(reg.assignedUserId ? String(reg.assignedUserId) : "");
                              setRegisterIsActive(reg.isActive);
                              setShowRegisterModal(true);
                            }}
                            style={{
                              padding: "6px",
                              borderRadius: "4px",
                              backgroundColor: "var(--bg-secondary)",
                              border: "1px solid var(--border-light)",
                              color: "var(--text-primary)",
                              cursor: "pointer"
                            }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRegister(reg.id)}
                            style={{
                              padding: "6px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255, 71, 87, 0.1)",
                              border: "1px solid rgba(255, 71, 87, 0.2)",
                              color: "var(--accent-primary)",
                              cursor: "pointer"
                            }}
                          >
                            <Trash2 size={14} />
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

      {/* TAB 5: CLIENTES DE LA PLATAFORMA */}
      {activeTab === "clientes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }} className="animate-fade-in">
          <div className="glass-card" style={{ padding: "25px 30px", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ fontSize: "16px", margin: 0, fontWeight: 700 }}>Clientes y Pedidos</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
              Visualiza los clientes que han realizado compras en tu local y revisa su historial de pedidos en tu establecimiento.
            </p>
          </div>

          <div className="mobile-column-stack" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "25px", alignItems: "flex-start" }}>
            {/* Clientes List */}
            <div className="glass-card" style={{ padding: "0", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "15px 20px", borderBottom: "1px solid var(--border-light)", fontWeight: 700, fontSize: "14px" }}>
                Listado de Clientes ({customersList.length})
              </div>
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {customersList.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    No hay clientes registrados con compras en este local.
                  </div>
                ) : (
                  customersList.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      style={{
                        padding: "15px 20px",
                        borderBottom: "1px solid var(--border-light)",
                        cursor: "pointer",
                        backgroundColor: selectedCustomer?.id === customer.id ? "rgba(255, 71, 87, 0.05)" : "transparent",
                        borderLeft: selectedCustomer?.id === customer.id ? "4px solid var(--accent-primary)" : "4px solid transparent",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCustomer?.id !== customer.id) e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCustomer?.id !== customer.id) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{customer.name}</span>
                        {customer.isPlus && (
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                            color: "#ffffff"
                          }}>
                            PLUS
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        Cédula: {customer.cedula || "—"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {customer.customerOrders?.length || 0} {customer.customerOrders?.length === 1 ? "pedido" : "pedidos"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Historial de Pedidos */}
            <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-lg)", minHeight: "350px" }}>
              {selectedCustomer ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-light)", paddingBottom: "15px", marginBottom: "20px" }}>
                    <div>
                      <h4 style={{ fontSize: "18px", margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                        {selectedCustomer.name}
                        {selectedCustomer.isPlus && (
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                            color: "#ffffff"
                          }}>
                            CLUB PLUS
                          </span>
                        )}
                      </h4>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                        <strong>Email:</strong> {selectedCustomer.email || "No registrado"} | <strong>Cédula:</strong> {selectedCustomer.cedula || "—"}
                      </p>
                    </div>
                  </div>

                  <h5 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "15px" }}>Historial de compras en tu local</h5>

                  <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxHeight: "450px", overflowY: "auto", paddingRight: "5px" }}>
                    {selectedCustomer.customerOrders?.length === 0 ? (
                      <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "20px 0" }}>
                        No hay pedidos de este cliente en este restaurante.
                      </div>
                    ) : (
                      selectedCustomer.customerOrders.map((order: any) => (
                        <div key={order.id} style={{
                          padding: "15px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-secondary)",
                          border: "1px solid var(--border-light)"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600 }}>Pedido #{order.id}</span>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "10px",
                              backgroundColor: order.status === "DELIVERED" ? "rgba(46, 213, 115, 0.1)" : "rgba(255, 71, 87, 0.1)",
                              color: order.status === "DELIVERED" ? "var(--success)" : "var(--accent-primary)"
                            }}>
                              {order.status === "DELIVERED" ? "Entregado" : order.status}
                            </span>
                          </div>

                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
                            Fecha: {new Date(order.createdAt).toLocaleString()}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "5px", borderTop: "1px dashed var(--border-light)", paddingTop: "8px", marginBottom: "10px" }}>
                            {order.items?.map((item: any) => (
                              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                <span>{item.quantity}x {item.variant?.menuItem?.name} ({item.variant?.name})</span>
                                <span style={{ fontWeight: 600 }}>${(item.quantity * item.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-light)", paddingTop: "8px", fontWeight: 700, fontSize: "14px" }}>
                            <span>Total Facturado:</span>
                            <span style={{ color: "var(--accent-secondary)" }}>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", padding: "40px 0" }}>
                  <User size={48} style={{ opacity: 0.3, marginBottom: "15px" }} />
                  <p style={{ margin: 0, fontSize: "14px" }}>Selecciona un cliente del listado para ver su historial de pedidos en tu local.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INVENTARIO Y COMPRAS ERP */}
      {activeTab === "inventario" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }} className="animate-fade-in">
          {/* Sub-tab Navbar */}
          <div className="glass-card scrollable-tabs" style={{ padding: "12px 20px", borderRadius: "var(--radius-lg)", display: "flex", gap: "10px", overflowX: "auto" }}>
            <button
              type="button"
              onClick={() => setInventorySubTab("supplies")}
              style={{
                padding: "8px 18px",
                borderRadius: "30px",
                backgroundColor: inventorySubTab === "supplies" ? "var(--text-primary)" : "var(--bg-tertiary)",
                color: inventorySubTab === "supplies" ? "#ffffff" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Insumos / Ingredientes
            </button>
            <button
              type="button"
              onClick={() => setInventorySubTab("suppliers")}
              style={{
                padding: "8px 18px",
                borderRadius: "30px",
                backgroundColor: inventorySubTab === "suppliers" ? "var(--text-primary)" : "var(--bg-tertiary)",
                color: inventorySubTab === "suppliers" ? "#ffffff" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Proveedores
            </button>
            <button
              type="button"
              onClick={() => setInventorySubTab("record_purchase")}
              style={{
                padding: "8px 18px",
                borderRadius: "30px",
                backgroundColor: inventorySubTab === "record_purchase" ? "var(--text-primary)" : "var(--bg-tertiary)",
                color: inventorySubTab === "record_purchase" ? "#ffffff" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Registrar Compra
            </button>
            <button
              type="button"
              onClick={() => setInventorySubTab("kardex")}
              style={{
                padding: "8px 18px",
                borderRadius: "30px",
                backgroundColor: inventorySubTab === "kardex" ? "var(--text-primary)" : "var(--bg-tertiary)",
                color: inventorySubTab === "kardex" ? "#ffffff" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Kardex (Movimientos)
            </button>
            <button
              type="button"
              onClick={() => setInventorySubTab("credits")}
              style={{
                padding: "8px 18px",
                borderRadius: "30px",
                backgroundColor: inventorySubTab === "credits" ? "var(--text-primary)" : "var(--bg-tertiary)",
                color: inventorySubTab === "credits" ? "#ffffff" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Cuentas por Pagar ({creditsList.filter(c => c.status === "PENDING").length})
            </button>
          </div>

          {/* Sub-tab 1: Supplies */}
          {inventorySubTab === "supplies" && (
            <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Insumos e Ingredientes</h4>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>Mapea los insumos que utilizas para las recetas de tu menú.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={handleOpenAdjustment} className="secondary-btn" style={{ padding: "8px 16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ClipboardList size={14} />
                    Ajuste Manual / Desperdicio
                  </button>
                  <button type="button" onClick={handleOpenAddSupply} className="glow-btn" style={{ padding: "8px 16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Plus size={14} />
                    Agregar Insumo
                  </button>
                </div>
              </div>

              <div className="responsive-table-wrapper">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "12px 10px" }}>Código</th>
                      <th style={{ padding: "12px 10px" }}>Nombre Insumo</th>
                      <th style={{ padding: "12px 10px" }}>Categoría</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Stock Actual</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Stock Mínimo</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Costo Compra</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Valor Inventario</th>
                      <th style={{ padding: "12px 10px", textAlign: "center" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliesList.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                          No hay insumos registrados. Registra tu primer insumo para crear recetas.
                        </td>
                      </tr>
                    ) : (
                      suppliesList.map((sup) => {
                        const isLowStock = sup.stock <= sup.minStock;
                        const valueTotal = sup.stock * sup.cost;
                        return (
                          <tr key={sup.id} style={{ borderBottom: "1px solid var(--border-light)" }} className="table-row-hover">
                            <td style={{ padding: "12px 10px", color: "var(--text-muted)", fontFamily: "monospace" }}>{sup.code || `INS-${sup.id}`}</td>
                            <td style={{ padding: "12px 10px", fontWeight: 600 }}>{sup.name}</td>
                            <td style={{ padding: "12px 10px" }}>{sup.category?.name || "Sin Categoría"}</td>
                            <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700, color: isLowStock ? "var(--danger)" : "var(--text-primary)" }}>
                              {sup.stock.toFixed(2)} {sup.unit?.name}
                              {isLowStock && <span style={{ fontSize: "10px", display: "block", color: "var(--danger)", fontWeight: "normal" }}>{systemIconForEmoji("⚠️")} Stock Bajo</span>}
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "right", color: "var(--text-secondary)" }}>{sup.minStock.toFixed(2)} {sup.unit?.name}</td>
                            <td style={{ padding: "12px 10px", textAlign: "right" }}>${sup.cost.toFixed(2)}</td>
                            <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 600, color: "var(--accent-secondary)" }}>${valueTotal.toFixed(2)}</td>
                            <td style={{ padding: "12px 10px", textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                <button type="button" onClick={() => handleOpenEditSupply(sup)} className="secondary-btn" style={{ padding: "6px", borderRadius: "var(--radius-sm)" }} title="Editar">
                                  <Edit size={13} />
                                </button>
                                <button type="button" onClick={() => handleDeleteSupply(sup.id)} className="secondary-btn" style={{ padding: "6px", borderRadius: "var(--radius-sm)", color: "var(--danger)" }} title="Eliminar">
                                  <Trash2 size={13} />
                                </button>
                              </div>
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

          {/* Sub-tab 2: Suppliers */}
          {inventorySubTab === "suppliers" && (
            <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Proveedores de Insumos</h4>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>Administra los contactos de los distribuidores de tus insumos.</p>
                </div>
                <button type="button" onClick={handleOpenAddSupplier} className="glow-btn" style={{ padding: "8px 16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={14} />
                  Agregar Proveedor
                </button>
              </div>

              <div className="responsive-table-wrapper">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "12px 10px" }}>RUC / Cédula</th>
                      <th style={{ padding: "12px 10px" }}>Razón Social / Nombre</th>
                      <th style={{ padding: "12px 10px" }}>Contacto</th>
                      <th style={{ padding: "12px 10px" }}>Teléfono</th>
                      <th style={{ padding: "12px 10px" }}>Email</th>
                      <th style={{ padding: "12px 10px" }}>Dirección</th>
                      <th style={{ padding: "12px 10px", textAlign: "center" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliersList.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                          No hay proveedores registrados.
                        </td>
                      </tr>
                    ) : (
                      suppliersList.map((prov) => (
                        <tr key={prov.id} style={{ borderBottom: "1px solid var(--border-light)" }} className="table-row-hover">
                          <td style={{ padding: "12px 10px", fontFamily: "monospace" }}>{prov.ruc}</td>
                          <td style={{ padding: "12px 10px", fontWeight: 600 }}>{prov.businessName}</td>
                          <td style={{ padding: "12px 10px" }}>{prov.contactName || "—"}</td>
                          <td style={{ padding: "12px 10px" }}>{prov.phone || "—"}</td>
                          <td style={{ padding: "12px 10px" }}>{prov.email || "—"}</td>
                          <td style={{ padding: "12px 10px", color: "var(--text-secondary)" }}>{prov.address || "—"}</td>
                          <td style={{ padding: "12px 10px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                              <button type="button" onClick={() => handleOpenEditSupplier(prov)} className="secondary-btn" style={{ padding: "6px", borderRadius: "var(--radius-sm)" }} title="Editar">
                                <Edit size={13} />
                              </button>
                              <button type="button" onClick={() => handleDeleteSupplier(prov.id)} className="secondary-btn" style={{ padding: "6px", borderRadius: "var(--radius-sm)", color: "var(--danger)" }} title="Eliminar">
                                <Trash2 size={13} />
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

          {/* Sub-tab 3: Record Purchase */}
          {inventorySubTab === "record_purchase" && (
            <div className="mobile-column-stack" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "25px", alignItems: "flex-start" }}>
              {/* Purchase Details Panel */}
              <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
                <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShoppingBag size={18} style={{ color: "var(--accent-primary)" }} />
                  Datos de Factura de Compra
                </h4>
                <form onSubmit={handleSavePurchase} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div className="input-group">
                    <label>Proveedor *</label>
                    <select
                      required
                      value={purchaseSupplierId}
                      onChange={(e) => setPurchaseSupplierId(e.target.value)}
                      className="input-field"
                    >
                      <option value="">-- Selecciona un Proveedor --</option>
                      {suppliersList.map(s => (
                        <option key={s.id} value={s.id}>{s.businessName} (RUC: {s.ruc})</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Número de Factura / Doc</label>
                    <input
                      type="text"
                      placeholder="Ej. 001-001-000028456"
                      value={purchaseDocNumber}
                      onChange={(e) => setPurchaseDocNumber(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="input-group">
                    <label>Forma de Pago *</label>
                    <select
                      value={purchaseType}
                      onChange={(e) => setPurchaseType(e.target.value)}
                      className="input-field"
                    >
                      <option value="CONTADO">CONTADO (Aplica egreso directo de Caja POS)</option>
                      <option value="CREDITO">CRÉDITO (Registra saldo en Cuentas por Pagar)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Descuento General ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchaseDiscount}
                      onChange={(e) => setPurchaseDiscount(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  {purchaseType === "CREDITO" && (
                    <>
                      <div className="input-group">
                        <label>Interés de Crédito ($ USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={purchaseInterest}
                          onChange={(e) => setPurchaseInterest(e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div className="input-group">
                        <label>Fecha de Vencimiento de Pago</label>
                        <input
                          type="date"
                          value={purchaseDueDate}
                          onChange={(e) => setPurchaseDueDate(e.target.value)}
                          className="input-field"
                        />
                      </div>
                    </>
                  )}

                  <div style={{ marginTop: "10px", paddingTop: "15px", borderTop: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                      <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Total Compra:</span>
                      <strong style={{ fontSize: "20px", color: "var(--accent-primary)" }}>${getPurchaseTotal().toFixed(2)}</strong>
                    </div>
                    <button type="submit" className="glow-btn" style={{ width: "100%", padding: "12px" }} disabled={purchaseItems.length === 0}>
                      Procesar y Registrar Compra {systemIconForEmoji("📦")}
                    </button>
                  </div>
                </form>
              </div>

              {/* Purchase Items Drawer / Cart */}
              <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
                <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "15px" }}>Agregar Insumos Adquiridos</h4>
                
                {/* Temp Add Form Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr auto", gap: "10px", alignItems: "flex-end", marginBottom: "20px", backgroundColor: "var(--bg-tertiary)", padding: "15px", borderRadius: "var(--radius-md)" }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "11px" }}>Insumo</label>
                    <select
                      value={tempSupplyId}
                      onChange={(e) => setTempSupplyId(e.target.value)}
                      className="input-field"
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                    >
                      <option value="">-- Selecciona --</option>
                      {suppliesList.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.unit?.name})</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "11px" }}>Cant.</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="10.0"
                      value={tempQty}
                      onChange={(e) => setTempQty(e.target.value)}
                      className="input-field"
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "11px" }}>Costo Unit.</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1.50"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      className="input-field"
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPurchaseItem}
                    className="glow-btn"
                    style={{ padding: "9px 15px", borderRadius: "var(--radius-md)" }}
                  >
                    Agregar
                  </button>
                </div>

                {/* Items list */}
                <h5 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "10px" }}>Detalle de la Compra</h5>
                {purchaseItems.length === 0 ? (
                  <div style={{ border: "2px dashed var(--border-light)", padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", borderRadius: "var(--radius-md)", fontSize: "13px" }}>
                    Agrega los insumos comprados arriba para armar el detalle de la factura.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {purchaseItems.map(item => (
                      <div key={item.supplyId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)" }}>
                        <div>
                          <strong style={{ fontSize: "13px" }}>{item.name}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {item.quantity.toFixed(2)} unidades x ${item.price.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                          <span style={{ fontWeight: 700, fontSize: "14px" }}>${(item.quantity * item.price).toFixed(2)}</span>
                          <button type="button" onClick={() => handleRemovePurchaseItem(item.supplyId)} className="secondary-btn" style={{ padding: "6px", color: "var(--danger)", border: "none" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 4: Kardex Movements */}
          {inventorySubTab === "kardex" && (
            <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Historial de Movimientos (Kardex)</h4>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>Auditoría completa de entradas y salidas físicas de insumos.</p>
                </div>
                <button type="button" onClick={handleOpenAdjustment} className="secondary-btn" style={{ padding: "8px 16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ClipboardList size={14} />
                  Ajuste Manual / Desperdicio
                </button>
              </div>

              <div className="responsive-table-wrapper" style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)", position: "sticky", top: 0, backgroundColor: "#ffffff" }}>
                      <th style={{ padding: "12px 10px" }}>Fecha / Hora</th>
                      <th style={{ padding: "12px 10px" }}>Insumo</th>
                      <th style={{ padding: "12px 10px" }}>Tipo</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Cantidad</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Costo Unit.</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Valor Movimiento</th>
                      <th style={{ padding: "12px 10px" }}>Motivo / Concepto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                          No se han registrado movimientos de inventario todavía.
                        </td>
                      </tr>
                    ) : (
                      movementsList.map((mov) => {
                        const isEntry = mov.type === "IN";
                        const totalVal = mov.quantity * mov.costUnit;
                        return (
                          <tr key={mov.id} style={{ borderBottom: "1px solid var(--border-light)" }} className="table-row-hover">
                            <td style={{ padding: "12px 10px", color: "var(--text-secondary)" }}>{new Date(mov.createdAt).toLocaleString()}</td>
                            <td style={{ padding: "12px 10px", fontWeight: 600 }}>{mov.supply?.name || `Insumo ID: ${mov.supplyId}`}</td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{
                                fontSize: "10px",
                                fontWeight: "bold",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                backgroundColor: isEntry ? "rgba(46, 213, 115, 0.1)" : "rgba(255, 71, 87, 0.1)",
                                color: isEntry ? "var(--success)" : "var(--accent-primary)"
                              }}>
                                {isEntry ? "ENTRADA" : "SALIDA"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700 }}>
                              {isEntry ? "+" : "-"}{mov.quantity} {mov.supply?.unit?.name}
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "right", color: "var(--text-muted)" }}>${mov.costUnit.toFixed(2)}</td>
                            <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 600 }}>${totalVal.toFixed(2)}</td>
                            <td style={{ padding: "12px 10px", fontWeight: 500, color: "var(--text-secondary)" }}>
                              {mov.reason === "COMPRA" && systemTextWithIcons("🛒 Factura de Compra")}
                              {mov.reason === "VENTA" && systemTextWithIcons("🍔 Descuento por Venta POS")}
                              {mov.reason === "DESPERDICIO" && systemTextWithIcons("🗑️ Merma / Desperdicio")}
                              {mov.reason === "AJUSTE_MANUAL" && systemTextWithIcons("🔧 Ajuste de Inventario")}
                              {!["COMPRA", "VENTA", "DESPERDICIO", "AJUSTE_MANUAL"].includes(mov.reason) && mov.reason}
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

          {/* Sub-tab 5: Credits (Accounts Payable) */}
          {inventorySubTab === "credits" && (
            <div className="glass-card" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Cuentas por Pagar (Compras a Crédito)</h4>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>Monitorea los montos pendientes de pago a proveedores.</p>
              </div>

              <div className="responsive-table-wrapper">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "12px 10px" }}>Fecha Compra</th>
                      <th style={{ padding: "12px 10px" }}>Proveedor</th>
                      <th style={{ padding: "12px 10px" }}>Factura Compra</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Total Crédito</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Abonado</th>
                      <th style={{ padding: "12px 10px", textAlign: "right" }}>Saldo Pendiente</th>
                      <th style={{ padding: "12px 10px" }}>Vencimiento</th>
                      <th style={{ padding: "12px 10px" }}>Estado</th>
                      <th style={{ padding: "12px 10px", textAlign: "center" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditsList.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                          No hay compras registradas a crédito.
                        </td>
                      </tr>
                    ) : (
                      creditsList.map((cred) => {
                        const balance = cred.totalAmount - cred.paidAmount;
                        const isOverdue = cred.dueDate && new Date(cred.dueDate).getTime() < Date.now() && cred.status === "PENDING";
                        return (
                          <tr key={cred.id} style={{ borderBottom: "1px solid var(--border-light)" }} className="table-row-hover">
                            <td style={{ padding: "12px 10px", color: "var(--text-secondary)" }}>{new Date(cred.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: "12px 10px", fontWeight: 600 }}>{cred.purchase?.supplier?.businessName}</td>
                            <td style={{ padding: "12px 10px", fontFamily: "monospace" }}>{cred.purchase?.docNumber || "S/N"}</td>
                            <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 600 }}>${cred.totalAmount.toFixed(2)}</td>
                            <td style={{ padding: "12px 10px", textAlign: "right", color: "var(--success)" }}>${cred.paidAmount.toFixed(2)}</td>
                            <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700, color: balance > 0 ? "var(--danger)" : "var(--text-primary)" }}>${balance.toFixed(2)}</td>
                            <td style={{ padding: "12px 10px", color: isOverdue ? "var(--danger)" : "var(--text-primary)", fontWeight: isOverdue ? "bold" : "normal" }}>
                              {cred.dueDate ? new Date(cred.dueDate).toLocaleDateString() : "—"}
                              {isOverdue && <span style={{ fontSize: "10px", display: "block", color: "var(--danger)" }}>{systemIconForEmoji("⚠️")} Vencido</span>}
                            </td>
                            <td style={{ padding: "12px 10px" }}>
                              <span style={{
                                fontSize: "10px",
                                fontWeight: "bold",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                backgroundColor: cred.status === "PAID" ? "rgba(46, 213, 115, 0.1)" : "rgba(255, 165, 2, 0.1)",
                                color: cred.status === "PAID" ? "var(--success)" : "var(--warning)"
                              }}>
                                {cred.status === "PAID" ? "PAGADO" : "PENDIENTE"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 10px", textAlign: "center" }}>
                              {cred.status === "PENDING" ? (
                                <button type="button" onClick={() => handleOpenPayCredit(cred)} className="glow-btn" style={{ padding: "5px 10px", fontSize: "11px", backgroundColor: "var(--success)", borderColor: "var(--success)" }}>
                                  Pagar / Abonar
                                </button>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
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
        </div>
      )}

      {/* STAFF MODAL */}
      {showStaffModal && createPortal(
        <div 
          className="global-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStaffModal(false);
          }}
        >
          <div className="global-modal-card" style={{ maxWidth: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                <Users size={20} style={{ color: "var(--accent-primary)" }} />
                {editingStaffId ? "Editar Personal" : "Agregar Nuevo Personal"}
              </h2>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="global-modal-close-btn"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="input-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María Delgado"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Nombre de Usuario *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingStaffId}
                  placeholder="Ej. maria.delgado"
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="Ej. maria@ejemplo.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Contraseña {editingStaffId ? "(Dejar en blanco para no cambiar)" : "*"}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showStaffPassword ? "text" : "password"}
                    required={!editingStaffId}
                    placeholder="Mínimo 6 caracteres"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: showStaffPassword ? "var(--accent-primary, #ff4757)" : "var(--text-muted, #718096)",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={showStaffPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showStaffPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Rol de Personal *</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", outline: "none" }}
                >
                  <option value="MOZO">Mesero / Mozo</option>
                  <option value="CAJERO">Cajero / Administrador de Caja</option>
                  <option value="PRODUCCION">Personal de Cocina / KDS</option>
                </select>
              </div>

              {editingStaffId && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
                  <input
                    type="checkbox"
                    id="staff-active"
                    checked={staffIsActive}
                    onChange={(e) => setStaffIsActive(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--accent-primary)" }}
                  />
                  <label htmlFor="staff-active" style={{ fontSize: "14px", cursor: "pointer", fontWeight: 600 }}>Usuario Activo (Habilitado para ingresar)</label>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="secondary-btn"
                  style={{ flex: 1, padding: "10px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="glow-btn"
                  disabled={saving}
                  style={{ flex: 1, padding: "10px" }}
                >
                  {saving ? "Guardando..." : editingStaffId ? "Guardar Cambios" : "Crear Personal"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CASH REGISTER MODAL */}
      {showRegisterModal && createPortal(
        <div 
          className="global-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRegisterModal(false);
          }}
        >
          <div className="global-modal-card" style={{ maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                <Store size={20} style={{ color: "var(--accent-primary)" }} />
                {editingRegisterId ? "Editar Caja" : "Agregar Nueva Caja"}
              </h2>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="global-modal-close-btn"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="input-group">
                <label>Nombre de Caja *</label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="input-field"
                  placeholder="Ej: Caja Principal"
                  required
                  style={{ width: "100%", outline: "none" }}
                />
              </div>

              <div className="input-group">
                <label>Asignar Cajero</label>
                <select
                  value={registerAssignedUserId}
                  onChange={(e) => setRegisterAssignedUserId(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", outline: "none" }}
                >
                  <option value="">Sin asignar (Libre)</option>
                  {staffList.filter(s => s.role === "CAJERO" && s.isActive).map(cashier => (
                    <option key={cashier.id} value={cashier.id}>
                      {cashier.name} ({cashier.username})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
                <input
                  type="checkbox"
                  id="registerIsActive"
                  checked={registerIsActive}
                  onChange={(e) => setRegisterIsActive(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <label htmlFor="registerIsActive" style={{ cursor: "pointer", fontSize: "14px", fontWeight: 500 }}>
                  Caja Activa
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="secondary-btn"
                  style={{ flex: 1, padding: "10px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="glow-btn"
                  disabled={saving}
                  style={{ flex: 1, padding: "10px" }}
                >
                  {saving ? "Guardando..." : editingRegisterId ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      
      {/* TABLE MODAL */}
      {showTableModal && createPortal(
        <div 
          className="global-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTableModal(false);
          }}
        >
          <div className="global-modal-card" style={{ maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                <QrCode size={20} style={{ color: "var(--accent-primary)" }} />
                {editingTableId ? "Editar Mesa" : "Crear Nueva Mesa"}
              </h2>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="global-modal-close-btn"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTable} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="input-group">
                <label>Número/Nombre de Mesa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mesa 1, Mesa VIP, Barra"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Capacidad (Personas) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(parseInt(e.target.value, 10) || 1)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="secondary-btn"
                  style={{ flex: 1, padding: "10px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="glow-btn"
                  style={{ flex: 1, padding: "10px" }}
                >
                  {editingTableId ? "Guardar Cambios" : "Crear Mesa"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* SUPPLY MODAL */}
      {showSupplyModal && createPortal(
        <div 
          className="global-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSupplyModal(false);
          }}
        >
          <div className="global-modal-card" style={{ maxWidth: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, fontWeight: 700 }}>
                {editingSupplyId ? "Editar Insumo" : "Agregar Nuevo Insumo"}
              </h2>
              <button
                type="button"
                onClick={() => setShowSupplyModal(false)}
                className="global-modal-close-btn"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSupply} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="input-group">
                <label>Nombre de Insumo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carne de Res, Tomates, Pan Hamburguesa"
                  value={supplyName}
                  onChange={(e) => setSupplyName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Código Insumo</label>
                <input
                  type="text"
                  placeholder="Ej. INS-001"
                  value={supplyCode}
                  onChange={(e) => setSupplyCode(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div className="input-group">
                  <label>Categoría *</label>
                  <select
                    required
                    value={supplyCategoryId}
                    onChange={(e) => setSupplyCategoryId(e.target.value)}
                    className="input-field"
                  >
                    {supplyCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Unidad de Medida *</label>
                  <select
                    required
                    value={supplyUnitId}
                    onChange={(e) => setSupplyUnitId(e.target.value)}
                    className="input-field"
                  >
                    {unitsList.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div className="input-group">
                  <label>Stock Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!!editingSupplyId}
                    value={supplyStock}
                    onChange={(e) => setSupplyStock(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={supplyMinStock}
                    onChange={(e) => setSupplyMinStock(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label>Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={supplyCost}
                    onChange={(e) => setSupplyCost(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="button" onClick={() => setShowSupplyModal(false)} className="secondary-btn" style={{ flex: 1, padding: "10px" }}>Cancelar</button>
                <button type="submit" className="glow-btn" style={{ flex: 1, padding: "10px" }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* SUPPLIER MODAL */}
      {showSupplierModal && createPortal(
        <div 
          className="global-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSupplierModal(false);
          }}
        >
          <div className="global-modal-card" style={{ maxWidth: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, fontWeight: 700 }}>
                {editingSupplierId ? "Editar Proveedor" : "Agregar Proveedor"}
              </h2>
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="global-modal-close-btn"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSupplier} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="input-group">
                <label>Nombre Comercial / Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pronaca S.A."
                  value={supplierBusinessName}
                  onChange={(e) => setSupplierBusinessName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>RUC / ID Identificación *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1790011223001"
                  value={supplierRuc}
                  onChange={(e) => setSupplierRuc(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div className="input-group">
                  <label>Nombre Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={supplierContactName}
                    onChange={(e) => setSupplierContactName(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej. 099887766"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Ej. pedidos@pronaca.com"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Dirección</label>
                <input
                  type="text"
                  placeholder="Ej. Panamericana Norte Km 12"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="button" onClick={() => setShowSupplierModal(false)} className="secondary-btn" style={{ flex: 1, padding: "10px" }}>Cancelar</button>
                <button type="submit" className="glow-btn" style={{ flex: 1, padding: "10px" }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ADJUSTMENT MODAL */}
      {showAdjustmentModal && createPortal(
        <div 
          className="global-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdjustmentModal(false);
          }}
        >
          <div className="global-modal-card" style={{ maxWidth: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0, fontWeight: 700 }}>
                Registrar Ajuste Manual / Merma
              </h2>
              <button
                type="button"
                onClick={() => setShowAdjustmentModal(false)}
                className="global-modal-close-btn"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveAdjustment} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="input-group">
                <label>Insumo / Ingrediente *</label>
                <select
                  required
                  value={adjustmentSupplyId}
                  onChange={(e) => setAdjustmentSupplyId(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Selecciona un Insumo --</option>
                  {suppliesList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.unit?.name}) - Stock: {s.stock.toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Tipo de Ajuste *</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  className="input-field"
                >
                  <option value="OUT">SALIDA (-) Desperdicio / Merma / Pérdida</option>
                  <option value="IN">ENTRADA (+) Ajuste Inicial / Conteo Físico Extra</option>
                </select>
              </div>

              <div className="input-group">
                <label>Cantidad a Ajustar *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="Ej. 1.50"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Motivo / Observación *</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="input-field"
                >
                  <option value="DESPERDICIO">Merma / Desperdicio / Dañado</option>
                  <option value="AJUSTE_MANUAL">Ajuste de Conteo Físico / Inventariado</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="button" onClick={() => setShowAdjustmentModal(false)} className="secondary-btn" style={{ flex: 1, padding: "10px" }}>Cancelar</button>
                <button type="submit" className="glow-btn" style={{ flex: 1, padding: "10px" }}>Registrar Ajuste</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* PAY CREDIT MODAL */}
      {showPayCreditModal && selectedCredit && createPortal(
        <div 
          className="global-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPayCreditModal(false);
              setSelectedCredit(null);
            }
          }}
        >
          <div className="global-modal-card" style={{ maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <DollarSign size={18} style={{ color: "var(--success)" }} />
                Abonar a Cuenta por Pagar
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowPayCreditModal(false);
                  setSelectedCredit(null);
                }}
                className="global-modal-close-btn"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "15px" }}>
              Registra un pago de crédito para el proveedor <strong>{selectedCredit.purchase?.supplier?.businessName}</strong>. 
              El saldo pendiente total es de <strong>${(selectedCredit.totalAmount - selectedCredit.paidAmount).toFixed(2)}</strong>.
            </p>
            <form onSubmit={handlePayCredit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="input-group">
                <label>Monto del Abono ($ USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={(selectedCredit.totalAmount - selectedCredit.paidAmount) + 0.01}
                  value={payCreditAmount}
                  onChange={(e) => setPayCreditAmount(e.target.value)}
                  className="input-field"
                />
              </div>

              <small style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                * Se registrará una salida de caja ("Egreso") bajo la categoría "Compras" en tu turno de caja activo.
              </small>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => { setShowPayCreditModal(false); setSelectedCredit(null); }} className="secondary-btn" style={{ flex: 1, padding: "10px" }}>Cancelar</button>
                <button type="submit" className="glow-btn" style={{ flex: 1, padding: "10px", backgroundColor: "var(--success)" }}>Confirmar Pago</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* TABLE QR MODAL */}
      <TableQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        selectedTable={qrModalTable}
        diningAreas={diningAreas}
        restaurantSlug={slug || (user as any)?.restaurantSlug || "prueba"}
        restaurantName={name || user?.restaurantName || "GoEats"}
        wifiSsid={wifiSsid}
        wifiPassword={wifiPassword}
        suggestedNetworkIp={suggestedNetworkIp}
      />
    </div>
  );
};
