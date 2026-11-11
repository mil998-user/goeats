import { appConfirm } from "../components/AppDialogs";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import {
  FolderPlus,
  Plus,
  Trash2,
  Edit,
  ChefHat,
  DollarSign,
  Loader2,
  X,
  Eye,
  EyeOff
} from "lucide-react";

interface Supply {
  id: number;
  name: string;
  unit: { name: string };
}

interface RecipeIngredient {
  id: number;
  supplyId: number;
  quantity: number;
  supply: Supply;
}

interface MenuItemVariant {
  id: number;
  name: string;
  price: number;
  promoPrice?: number | null;
  promoEndsAt?: string | null;
  stockLimit: number | null;
  recipeIngredients?: RecipeIngredient[];
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  productionAreaId: number | null;
  isActive?: boolean;
  variants: MenuItemVariant[];
}

interface MenuCategory {
  id: number;
  name: string;
  description: string | null;
  items: MenuItem[];
}

export const Menu: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [productionAreas, setProductionAreas] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view states
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<MenuCategory> | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> & { categoryId: number } | null>(null);
  const [editingVariant, setEditingVariant] = useState<Partial<MenuItemVariant> & { menuItemId: number } | null>(null);
  
  // Recipe editing drawer state
  const [activeRecipeVariant, setActiveRecipeVariant] = useState<MenuItemVariant | null>(null);
  const [activeRecipeIngredients, setActiveRecipeIngredients] = useState<Partial<RecipeIngredient>[]>([]);
  const [newIngredientSupplyId, setNewIngredientSupplyId] = useState("");
  const [newIngredientQty, setNewIngredientQty] = useState("");

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const catRes = await apiRequest("/menu/categories?includeHidden=true");
      setCategories(catRes.categories || []);
      if (catRes.categories && catRes.categories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(catRes.categories[0].id);
      }

      const supplyRes = await apiRequest("/inventory/supplies");
      setSupplies(supplyRes.supplies || []);

      const areaRes = await apiRequest("/kitchen/areas");
      setProductionAreas(areaRes.areas || []);
    } catch (error) {
      console.error("Error loading menu config:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  // CATEGORY OPERATIONS
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    try {
      if (editingCategory.id) {
        await apiRequest(`/menu/categories/${editingCategory.id}`, {
          method: "PUT",
          body: JSON.stringify(editingCategory),
        });
      } else {
        const res = await apiRequest("/menu/categories", {
          method: "POST",
          body: JSON.stringify(editingCategory),
        });
        setSelectedCategoryId(res.category.id);
      }
      setEditingCategory(null);
      await loadMenuData();
    } catch (error: any) {
      alert(error.message || "Error al guardar categoría");
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!(await appConfirm("¿Está seguro de que desea eliminar esta categoría? Se eliminarán todos sus platos asociados."))) return;
    try {
      await apiRequest(`/menu/categories/${catId}`, { method: "DELETE" });
      setSelectedCategoryId(null);
      await loadMenuData();
    } catch (error: any) {
      alert(error.message || "Error al eliminar categoría");
    }
  };

  // MENU ITEM OPERATIONS
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name || !editingItem.categoryId) return;

    try {
      if (editingItem.id) {
        await apiRequest(`/menu/items/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify(editingItem),
        });
      } else {
        await apiRequest("/menu/items", {
          method: "POST",
          body: JSON.stringify(editingItem),
        });
      }
      setEditingItem(null);
      await loadMenuData();
    } catch (error: any) {
      alert(error.message || "Error al guardar plato");
    }
  };

  // Hidden dishes leave the menu and the POS, but past orders keep their detail
  const handleToggleItemVisibility = async (itemId: number, isActive: boolean) => {
    try {
      await apiRequest(`/menu/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      });
      await loadMenuData();
    } catch (error: any) {
      alert(error.message || "No se pudo cambiar el plato");
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!(await appConfirm("¿Está seguro de eliminar este plato?"))) return;
    try {
      await apiRequest(`/menu/items/${itemId}`, { method: "DELETE" });
      await loadMenuData();
    } catch (error: any) {
      const message = error.message || "Error al eliminar plato";
      if (message.includes("Ocultar") && await appConfirm(`${message}\n\n¿Quieres ocultarlo ahora?`)) {
        await handleToggleItemVisibility(itemId, false);
        return;
      }
      alert(message);
    }
  };

  // A promotion counts only until its end date
  const promoIsActive = (variant: Partial<MenuItemVariant>) =>
    !!variant.promoPrice && !!variant.promoEndsAt && new Date(variant.promoEndsAt) > new Date() && variant.promoPrice < (variant.price || 0);

  const toDateInput = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const openVariantEditor = (variant: MenuItemVariant, menuItemId: number) => {
    // An expired promotion opens empty so it can be set again
    const active = promoIsActive(variant);
    setEditingVariant({ ...variant, menuItemId, promoPrice: active ? variant.promoPrice : null, promoEndsAt: active ? toDateInput(variant.promoEndsAt) : null });
  };

  // VARIANT OPERATIONS
  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant?.name || !editingVariant.menuItemId || !editingVariant.price) return;

    try {
      const payload = {
        name: editingVariant.name,
        price: parseFloat(editingVariant.price.toString()),
        stockLimit: editingVariant.stockLimit ? parseInt(editingVariant.stockLimit.toString(), 10) : null,
        menuItemId: editingVariant.menuItemId,
        // The promotion lasts until the end of the chosen day
        promoPrice: editingVariant.promoPrice || null,
        promoEndsAt: editingVariant.promoEndsAt ? new Date(`${editingVariant.promoEndsAt}T23:59:59`).toISOString() : null,
      };

      if (editingVariant.id) {
        await apiRequest(`/menu/variants/${editingVariant.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/menu/variants", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditingVariant(null);
      await loadMenuData();
    } catch (error: any) {
      alert(error.message || "Error al guardar presentación");
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!(await appConfirm("¿Está seguro de eliminar esta presentación?"))) return;
    try {
      await apiRequest(`/menu/variants/${variantId}`, { method: "DELETE" });
      await loadMenuData();
    } catch (error: any) {
      alert(error.message || "Error al eliminar presentación");
    }
  };

  // RECIPE MANAGEMENT
  const handleOpenRecipe = async (variant: MenuItemVariant) => {
    try {
      setActiveRecipeVariant(variant);
      const res = await apiRequest(`/menu/variants/${variant.id}/recipe`);
      setActiveRecipeIngredients(res.recipe || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddRecipeIngredient = () => {
    if (!newIngredientSupplyId || !newIngredientQty) return;
    const supply = supplies.find(s => s.id === parseInt(newIngredientSupplyId, 10));
    if (!supply) return;

    // Check duplicate
    if (activeRecipeIngredients.some(ing => ing.supplyId === supply.id)) {
      alert("Este insumo ya está agregado a la receta.");
      return;
    }

    setActiveRecipeIngredients(prev => [
      ...prev,
      {
        supplyId: supply.id,
        quantity: parseFloat(newIngredientQty),
        supply
      }
    ]);
    setNewIngredientSupplyId("");
    setNewIngredientQty("");
  };

  const handleRemoveRecipeIngredient = (supplyId: number) => {
    setActiveRecipeIngredients(prev => prev.filter(ing => ing.supplyId !== supplyId));
  };

  const handleSaveRecipe = async () => {
    if (!activeRecipeVariant) return;
    try {
      const ingredients = activeRecipeIngredients.map(ing => ({
        supplyId: ing.supplyId,
        quantity: ing.quantity
      }));
      await apiRequest(`/menu/variants/${activeRecipeVariant.id}/recipe`, {
        method: "POST",
        body: JSON.stringify({ ingredients })
      });
      alert("Receta guardada con éxito.");
      setActiveRecipeVariant(null);
      await loadMenuData();
    } catch (error: any) {
      alert(error.message || "Error al guardar la receta");
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  if (loading && categories.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px", backgroundColor: "var(--bg-primary)", minHeight: "100vh" }}>
        <Loader2 className="spinner" size={48} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "28px" }}>Configuración del Menú</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Administre categorías, platos, precios y recetas de insumos.
          </p>
        </div>
        <button
          onClick={() => setEditingCategory({ name: "", description: "" })}
          className="glow-btn"
        >
          <FolderPlus size={16} />
          Nueva Categoría
        </button>
      </div>

      <div className="menu-layout" style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: "30px",
        alignItems: "start"
      }}>
        {/* LEFT COLUMN: Categories list */}
        <div className="glass-card" style={{ padding: "15px", borderRadius: "var(--radius-md)" }}>
          <h3 style={{ fontSize: "14px", color: "var(--text-muted)", padding: "12px", textTransform: "uppercase" }}>Categorías</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: selectedCategoryId === cat.id ? "rgba(255, 71, 87, 0.1)" : "transparent",
                  color: selectedCategoryId === cat.id ? "var(--accent-primary)" : "var(--text-primary)",
                  border: `1px solid ${selectedCategoryId === cat.id ? "rgba(255, 71, 87, 0.2)" : "transparent"}`,
                  transition: "all var(--transition-fast)"
                }}
              >
                <span style={{ fontWeight: 600 }}>{cat.name}</span>
                <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setEditingCategory(cat)} style={{ color: "var(--text-muted)", cursor: "pointer" }}>
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id)} style={{ color: "var(--danger)", cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Menu Items & Variants under selected Category */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {selectedCategory ? (
            <div className="glass-card" style={{ padding: "30px", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "25px", borderBottom: "1px solid var(--border-light)", paddingBottom: "15px" }}>
                <div>
                  <h2 style={{ fontSize: "22px" }}>Platos en {selectedCategory.name}</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
                    {selectedCategory.description || "Sin descripción"}
                  </p>
                </div>
                <button
                  onClick={() => setEditingItem({ name: "", description: "", categoryId: selectedCategory.id, productionAreaId: 1 })}
                  className="secondary-btn"
                  style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", padding: "8px 16px" }}
                >
                  <Plus size={16} />
                  Agregar Plato
                </button>
              </div>

              {/* Items Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {selectedCategory.items.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "40px" }}>
                    No hay platos en esta categoría. Cree el primero.
                  </p>
                ) : (
                  selectedCategory.items.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: "20px",
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-sm)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
                        <div>
                          <h3 style={{ fontSize: "18px", opacity: item.isActive === false ? 0.6 : 1 }}>
                            {item.name}
                            {item.isActive === false && (
                              <span style={{ marginLeft: "8px", fontSize: "13px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", border: "1px solid var(--text-muted)", color: "var(--text-secondary)" }}>
                                Oculto
                              </span>
                            )}
                          </h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                            {item.description}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => setEditingVariant({ name: "", price: 0, menuItemId: item.id })}
                            className="secondary-btn"
                            style={{ padding: "6px 12px", fontSize: "13px" }}
                          >
                            + Variación
                          </button>
                          <button
                            onClick={() => setEditingItem({ ...item, categoryId: selectedCategory.id })}
                            style={{ color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleItemVisibility(item.id, item.isActive === false)}
                            title={item.isActive === false ? "Mostrar en el menú" : "Ocultar del menú"}
                            aria-label={item.isActive === false ? "Mostrar en el menú" : "Ocultar del menú"}
                            style={{ color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                          >
                            {item.isActive === false ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            style={{ color: "var(--danger)", cursor: "pointer", padding: "4px" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Variants list of the Item */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {item.variants.length === 0 ? (
                          <span style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
                            Sin presentaciones de precio. Agregue una para poder vender.
                          </span>
                        ) : (
                          item.variants.map(variant => (
                            <div
                              key={variant.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "10px",
                                padding: "8px 12px",
                                backgroundColor: "var(--bg-tertiary)",
                                border: "1px solid var(--border-light)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "13px"
                              }}
                            >
                              <span>{variant.name}: <strong style={{ color: "var(--success)" }}>${variant.price.toFixed(2)}</strong></span>
                              {promoIsActive(variant) && (
                                <span data-testid="menu-promo" style={{ background: "#b91c1c", color: "#ffffff", borderRadius: "6px", padding: "2px 8px", fontWeight: 700 }}>
                                  Promo ${variant.promoPrice!.toFixed(2)} hasta {new Date(variant.promoEndsAt!).toLocaleDateString("es-EC")}
                                </span>
                              )}
                              <div style={{ display: "flex", gap: "6px", marginLeft: "10px" }}>
                                <button
                                  onClick={() => handleOpenRecipe(variant)}
                                  title="Ver receta / insumos"
                                  style={{ color: "var(--accent-secondary)", cursor: "pointer", display: "inline-flex" }}
                                >
                                  <ChefHat size={14} />
                                </button>
                                <button
                                  onClick={() => openVariantEditor(variant, item.id)}
                                  style={{ color: "var(--text-muted)", cursor: "pointer" }}
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteVariant(variant.id)}
                                  style={{ color: "var(--danger)", cursor: "pointer" }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)" }}>Seleccione o cree una categoría para comenzar.</p>
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY FORM MODAL */}
      {editingCategory && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "480px" }}>
            <h2 style={{ marginBottom: "20px" }}>{editingCategory.id ? "Editar Categoría" : "Nueva Categoría"}</h2>
            <form onSubmit={handleSaveCategory}>
              <div className="input-group">
                <label>Nombre de Categoría</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingCategory.name || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  required
                />
              </div>
              <div className="input-group" style={{ marginBottom: "25px" }}>
                <label>Descripción</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setEditingCategory(null)} className="secondary-btn" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="glow-btn" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ITEM FORM MODAL */}
      {editingItem && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "480px" }}>
            <h2 style={{ marginBottom: "20px" }}>{editingItem.id ? "Editar Plato" : "Nuevo Plato"}</h2>
            <form onSubmit={handleSaveItem}>
              <div className="input-group">
                <label>Nombre del Plato</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingItem.name || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Descripción</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>
              <div className="input-group" style={{ marginBottom: "25px" }}>
                <label>Área de Producción (Ruta KDS / IVA)</label>
                <select
                  value={editingItem.productionAreaId || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, productionAreaId: e.target.value ? parseInt(e.target.value, 10) : null })}
                  className="input-field"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                >
                  <option value="">Sin Área (0% IVA, no KDS)</option>
                  {productionAreas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
                <small style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  * Los platos con área de producción pagan 12% de IVA en el POS y aparecen en la cocina KDS.
                </small>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setEditingItem(null)} className="secondary-btn" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="glow-btn" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VARIANT FORM MODAL */}
      {editingVariant && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "480px" }}>
            <h2 style={{ marginBottom: "20px" }}>{editingVariant.id ? "Editar Presentación" : "Nueva Presentación"}</h2>
            <form onSubmit={handleSaveVariant}>
              <div className="input-group">
                <label>Nombre de Presentación (ej: Personal, Familiar)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. Familiar"
                  value={editingVariant.name || ""}
                  onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Precio de Venta ($ USD)</label>
                <div style={{ position: "relative" }}>
                  <DollarSign size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="input-field"
                    style={{ paddingLeft: "40px" }}
                    value={editingVariant.price || ""}
                    onChange={(e) => setEditingVariant({ ...editingVariant, price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <fieldset style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: "16px" }}>
                <legend style={{ fontSize: "14px", fontWeight: 700, padding: "0 6px" }}>Promoción (opcional)</legend>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 10px" }}>
                  Precio más bajo hasta la fecha que elijas. Deja ambos vacíos para quitarla.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div className="input-group" style={{ flex: "1 1 140px", margin: 0 }}>
                    <label htmlFor="variant-promo-price">Precio de promoción ($)</label>
                    <input
                      id="variant-promo-price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="input-field"
                      value={editingVariant.promoPrice || ""}
                      onChange={(e) => setEditingVariant({ ...editingVariant, promoPrice: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                  <div className="input-group" style={{ flex: "1 1 140px", margin: 0 }}>
                    <label htmlFor="variant-promo-end">Hasta el día</label>
                    <input
                      id="variant-promo-end"
                      type="date"
                      className="input-field"
                      min={toDateInput(new Date().toISOString())}
                      value={editingVariant.promoEndsAt || ""}
                      onChange={(e) => setEditingVariant({ ...editingVariant, promoEndsAt: e.target.value || null })}
                    />
                  </div>
                </div>
              </fieldset>
              <div className="input-group" style={{ marginBottom: "25px" }}>
                <label>Límite Diario (Opcional, null = sin límite)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Ej. 50"
                  value={editingVariant.stockLimit || ""}
                  onChange={(e) => setEditingVariant({ ...editingVariant, stockLimit: e.target.value ? parseInt(e.target.value, 10) : null })}
                />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setEditingVariant(null)} className="secondary-btn" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="glow-btn" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECIPE INGREDIENTS EDIT MODAL (DRAWER) */}
      {activeRecipeVariant && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ChefHat size={22} style={{ color: "var(--accent-secondary)" }} />
                Receta: {activeRecipeVariant.name}
              </h2>
              <button onClick={() => setActiveRecipeVariant(null)} style={{ color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Add ingredient row */}
            <div style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-sm)"
            }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Insumo / Ingrediente</label>
                <select
                  value={newIngredientSupplyId}
                  onChange={(e) => setNewIngredientSupplyId(e.target.value)}
                  className="input-field"
                  style={{ height: "38px", padding: "5px", backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: "13px" }}
                >
                  <option value="">-- Seleccionar --</option>
                  {supplies.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name} ({sup.unit.name})</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Cantidad</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  className="input-field"
                  style={{ height: "38px", fontSize: "13px" }}
                  placeholder="0.000"
                  value={newIngredientQty}
                  onChange={(e) => setNewIngredientQty(e.target.value)}
                />
              </div>

              <button
                onClick={handleAddRecipeIngredient}
                className="glow-btn"
                style={{ alignSelf: "flex-end", height: "38px", padding: "0 15px", borderRadius: "var(--radius-sm)" }}
              >
                +
              </button>
            </div>

            {/* List of recipe ingredients */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "25px", maxHeight: "300px", overflowY: "auto" }}>
              <h3 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase" }}>Ingredientes en Receta</h3>
              {activeRecipeIngredients.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
                  Esta presentación no tiene receta. Se venderá sin descontar inventario de insumos.
                </p>
              ) : (
                activeRecipeIngredients.map(ing => (
                  <div
                    key={ing.supplyId}
                    style={{
                      padding: "10px 15px",
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px" }}>{ing.supply?.name}</strong>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>ID: {ing.supplyId}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                        {ing.quantity} {ing.supply?.unit.name}
                      </span>
                      <button
                        onClick={() => handleRemoveRecipeIngredient(ing.supplyId!)}
                        style={{ color: "var(--danger)", cursor: "pointer" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setActiveRecipeVariant(null)} className="secondary-btn" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSaveRecipe} className="glow-btn" style={{ flex: 1 }}>Guardar Receta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
