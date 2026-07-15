import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import ComandaCard from "../components/ComandaCard";
import ComandaDetalle from "../components/ComandaDetalle";
import KitchenView from "../components/KitchenView";
import DeliveryView from "../components/DeliveryView";
import { COMANDAS_TABLERO_QUERY } from "../graphql/queries/comandas";
import {
  ACTUALIZAR_ESTADO_COMANDA_MUTATION,
  ACTUALIZAR_ESTADO_PAGO_MUTATION,
  ASIGNAR_REPARTIDOR_MUTATION,
  CANCELAR_COMANDA_MUTATION,
  GUARDAR_REFERENCIA_PAGO_MUTATION,
} from "../graphql/mutations/comandas";
import { COMANDAS_TABLERO_REALTIME_SUBSCRIPTION } from "../graphql/subscriptions/comandas";
import {
  COMANDA_ESTADOS,
  ESTADO_LABELS,
  PAYMENT_ESTADOS,
  PAYMENT_LABELS,
  formatDateTime,
  groupByEstado,
  normalizeComanda,
} from "../utils/comandas";
import { MOCK_COMANDAS } from "../utils/mockData";
import { authenticateFromBackend, getStoredAuth } from "../utils/auth";

function showBeep() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.07;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);
  } catch {
    // Sound is optional.
  }
}

function buildSummary(comanda) {
  const items = (comanda.detalles || [])
    .map((d) => `${d.cantidad}x ${d.productoNombre} - ${d.total}`)
    .join("\n");
  return [
    `Comanda ${comanda.codigo}`,
    `Cliente: ${comanda.clienteNombre}`,
    `Tel: ${comanda.clienteTelefono}`,
    `Tipo: ${comanda.tipoEntrega}`,
    `Estado: ${comanda.estado}`,
    `Pago: ${comanda.estadoPago}`,
    "",
    items,
    "",
    `Total: ${comanda.total}`,
  ].join("\n");
}

const DEFAULT_FILTERS = {
  estado: "",
  estadoPago: "",
  canal: "",
  tipoEntrega: "",
  fecha: "",
  sucursal: "",
  search: "",
};

const MOVING_ANIMATION_MS = 450;

export default function AdminComandas() {
  const useMock = import.meta.env.VITE_USE_MOCK === "true";
  const [view, setView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [comandas, setComandas] = useState([]);
  const [toast, setToast] = useState(null);
  const [authContext, setAuthContext] = useState(getStoredAuth());
  const [authLoading, setAuthLoading] = useState(!useMock);
  const [authError, setAuthError] = useState("");

  function markMovingBetweenColumns(nextRows, previousRows) {
    const previousById = new Map(previousRows.map((row) => [row.id, row]));
    const movingIds = [];
    const enriched = nextRows.map((row) => {
      const prev = previousById.get(row.id);
      const isMoving = Boolean(prev && prev.estado !== row.estado);
      if (isMoving) movingIds.push(row.id);
      return { ...row, isMoving };
    });

    if (movingIds.length) {
      const movingSet = new Set(movingIds);
      setTimeout(() => {
        setComandas((current) =>
          current.map((row) => (movingSet.has(row.id) ? { ...row, isMoving: false } : row))
        );
      }, MOVING_ANIMATION_MS);
    }

    return enriched;
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (useMock) {
      setAuthLoading(false);
      return;
    }
    let mounted = true;
    setAuthLoading(true);
    authenticateFromBackend()
      .then((ctx) => {
        if (!mounted) return;
        setAuthContext(ctx);
        setAuthError("");
      })
      .catch((err) => {
        if (!mounted) return;
        setAuthError(err.message);
      })
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [useMock]);

  const queryVariables = useMemo(
    () => ({
      empresa: authContext?.empresa || import.meta.env.VITE_EMPRESA || undefined,
      sucursal:
        filters.sucursal ||
        authContext?.sucursal ||
        import.meta.env.VITE_SUCURSAL ||
        undefined,
      limit: 200,
    }),
    [filters.sucursal, authContext]
  );

  const {
    data: tableroData,
    loading: loadingComandas,
    error: tableroError,
  } = useQuery(COMANDAS_TABLERO_QUERY, {
    variables: queryVariables,
    fetchPolicy: "cache-and-network",
    skip: useMock || authLoading || !authContext?.accessToken,
  });

  const [mutateEstado, { loading: loadingEstado }] = useMutation(ACTUALIZAR_ESTADO_COMANDA_MUTATION);
  const [mutatePago] = useMutation(ACTUALIZAR_ESTADO_PAGO_MUTATION);
  const [mutateCancelar] = useMutation(CANCELAR_COMANDA_MUTATION);
  const [mutateAsignar] = useMutation(ASIGNAR_REPARTIDOR_MUTATION);
  const [mutateReferencia] = useMutation(GUARDAR_REFERENCIA_PAGO_MUTATION);

  useSubscription(COMANDAS_TABLERO_REALTIME_SUBSCRIPTION, {
    variables: queryVariables,
    skip: useMock || authLoading || !authContext?.accessToken,
    onData: ({ data }) => {
      const incoming = data?.data?.comandasTableroRealtime?.comandas || [];
      if (!incoming.length) return;
      setComandas((prev) => {
        const previousIds = new Set(prev.map((o) => o.id));
        const merged = incoming.map((c) => {
          const normalized = normalizeComanda(c);
          const isNew = !previousIds.has(normalized.id);
          if (isNew) {
            setToast({ type: "success", message: `Nueva comanda ${normalized.codigo}` });
            if (soundEnabled) showBeep();
            setTimeout(() => {
              setComandas((current) =>
                current.map((item) => (item.id === normalized.id ? { ...item, isNew: false } : item))
              );
            }, 7000);
          }
          return { ...normalized, isNew };
        });
        return markMovingBetweenColumns(merged, prev);
      });
    },
  });

  useEffect(() => {
    if (useMock) {
      setComandas(MOCK_COMANDAS);
      return;
    }
    const list = tableroData?.comandasTablero?.comandas;
    if (list) {
      setComandas((prev) => {
        const previousIds = new Set(prev.map((item) => item.id));
        const nextRows = list.map((item) => {
          const normalized = normalizeComanda(item);
          const isNew = !previousIds.has(normalized.id);
          if (isNew && prev.length > 0) {
            setToast({ type: "success", message: `Nueva comanda ${normalized.codigo}` });
            if (soundEnabled) showBeep();
            setTimeout(() => {
              setComandas((current) =>
                current.map((row) => (row.id === normalized.id ? { ...row, isNew: false } : row))
              );
            }, 7000);
          }
          return { ...normalized, isNew };
        });
        return markMovingBetweenColumns(nextRows, prev);
      });
    }
  }, [tableroData, useMock, soundEnabled]);

  const filteredComandas = useMemo(() => {
    return comandas.filter((comanda) => {
      if (filters.estado && comanda.estado !== filters.estado) return false;
      if (filters.estadoPago && comanda.estadoPago !== filters.estadoPago) return false;
      if (filters.canal && comanda.canal !== filters.canal) return false;
      if (filters.tipoEntrega && comanda.tipoEntrega !== filters.tipoEntrega) return false;
      if (filters.sucursal && comanda.sucursal !== filters.sucursal) return false;
      if (filters.fecha) {
        const comandaDate = new Date(comanda.createdAt).toISOString().slice(0, 10);
        if (comandaDate !== filters.fecha) return false;
      }
      if (filters.search) {
        const value = filters.search.toLowerCase();
        const haystack = [
          comanda.codigo,
          comanda.clienteNombre,
          comanda.clienteTelefono,
          comanda.referenciaPago,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(value)) return false;
      }
      return true;
    });
  }, [comandas, filters]);

  const grouped = useMemo(() => groupByEstado(filteredComandas), [filteredComandas]);
  const kitchenOrders = useMemo(
    () => filteredComandas.filter((c) => ["pagada", "preparando"].includes(c.estado)),
    [filteredComandas]
  );
  const pickupOrders = useMemo(
    () => filteredComandas.filter((c) => c.tipoEntrega === "pickup" && c.estado === "lista"),
    [filteredComandas]
  );
  const deliveryOrders = useMemo(
    () => filteredComandas.filter((c) => c.tipoEntrega === "delivery" && ["lista", "en_camino"].includes(c.estado)),
    [filteredComandas]
  );

  async function handleUpdateEstado(comanda, estado) {
    if (comanda.estado === "cancelada") return;
    if (estado === "preparando" && comanda.estadoPago !== "pagado") {
      setToast({ type: "warning", message: "Pago no aprobado. Confirma antes de preparar." });
    }
    if (useMock) {
      setComandas((prev) => {
        const nextRows = prev.map((c) => (c.id === comanda.id ? { ...c, estado } : c));
        return markMovingBetweenColumns(nextRows, prev);
      });
      return;
    }
    const res = await mutateEstado({
      variables: {
        id: comanda.id,
        estado,
        empresa: queryVariables.empresa,
        sucursal: queryVariables.sucursal,
      },
    });
    if (!res?.data?.actualizarEstadoComanda) {
      setToast({ type: "error", message: "No se pudo actualizar el estado." });
      return;
    }
    setToast({ type: "success", message: `Comanda ${comanda.codigo} actualizada a ${estado}` });
  }

  async function handleUpdatePago(comanda, estadoPago) {
    if (useMock) {
      setComandas((prev) => prev.map((c) => (c.id === comanda.id ? { ...c, estadoPago } : c)));
      return;
    }
    try {
      await mutatePago({
        variables: {
          id: comanda.id,
          estadoPago,
          empresa: queryVariables.empresa,
          sucursal: queryVariables.sucursal,
        },
      });
      setToast({ type: "success", message: `Pago actualizado a ${estadoPago}` });
    } catch {
      const fallback = await mutateEstado({
        variables: {
          id: comanda.id,
          estado: comanda.estado,
          estado_pago: estadoPago,
          empresa: queryVariables.empresa,
          sucursal: queryVariables.sucursal,
        },
      });
      if (fallback?.data?.actualizarEstadoComanda) {
        setToast({ type: "success", message: `Pago actualizado a ${estadoPago}` });
      } else {
        setToast({ type: "error", message: "No se pudo actualizar el pago." });
      }
    }
  }

  async function handleCancelar(comanda) {
    if (useMock) {
      setComandas((prev) => prev.map((c) => (c.id === comanda.id ? { ...c, estado: "cancelada" } : c)));
      return;
    }
    try {
      await mutateCancelar({
        variables: {
          id: comanda.id,
          empresa: queryVariables.empresa,
          sucursal: queryVariables.sucursal,
        },
      });
      setToast({ type: "success", message: `Comanda ${comanda.codigo} cancelada` });
    } catch {
      await handleUpdateEstado(comanda, "cancelada");
    }
  }

  async function handleGuardarReferencia(comanda, referenciaPago) {
    if (useMock) {
      setComandas((prev) =>
        prev.map((c) => (c.id === comanda.id ? { ...c, referenciaPago } : c))
      );
      return;
    }
    try {
      await mutateReferencia({
        variables: {
          id: comanda.id,
          referenciaPago,
          empresa: queryVariables.empresa,
          sucursal: queryVariables.sucursal,
        },
      });
      setToast({ type: "success", message: "Referencia de pago guardada." });
    } catch {
      setToast({ type: "warning", message: "Mutación guardarReferenciaPago no disponible en backend actual." });
    }
  }

  async function handleAsignarRepartidor(comanda, repartidor) {
    if (useMock) {
      setToast({ type: "success", message: `${repartidor} asignado a ${comanda.codigo}` });
      return;
    }
    try {
      await mutateAsignar({
        variables: {
          id: comanda.id,
          repartidor,
          empresa: queryVariables.empresa,
          sucursal: queryVariables.sucursal,
        },
      });
      setToast({ type: "success", message: `${repartidor} asignado a ${comanda.codigo}` });
    } catch {
      setToast({ type: "warning", message: "Mutación asignarRepartidor no disponible en backend actual." });
    }
  }

  function handleCopySummary(comanda) {
    navigator.clipboard.writeText(buildSummary(comanda));
    setToast({ type: "success", message: "Resumen copiado." });
  }

  function handleSendWhatsApp(comanda) {
    const msg = encodeURIComponent(
      `Hola ${comanda.clienteNombre}, tu comanda ${comanda.codigo} está en estado: ${comanda.estado}.`
    );
    window.open(`https://wa.me/${(comanda.clienteTelefono || "").replace(/\D/g, "")}?text=${msg}`, "_blank");
  }

  return (
    <main className="min-h-screen p-4 text-slate-900 dark:text-slate-100">
      <header className="ui-panel mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div>
          <h1 className="text-2xl font-bold">Administración de Comandas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Última actualización: {formatDateTime(new Date().toISOString())}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("dashboard")}
            className={`ui-btn rounded-md px-3 py-2 text-sm ${view === "dashboard" ? "bg-slate-900 text-white" : "border border-slate-300 bg-white dark:bg-slate-900"}`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setView("kitchen")}
            className={`ui-btn rounded-md px-3 py-2 text-sm ${view === "kitchen" ? "bg-slate-900 text-white" : "border border-slate-300 bg-white dark:bg-slate-900"}`}
          >
            Cocina
          </button>
          <button
            type="button"
            onClick={() => setView("delivery")}
            className={`ui-btn rounded-md px-3 py-2 text-sm ${view === "delivery" ? "bg-slate-900 text-white" : "border border-slate-300 bg-white dark:bg-slate-900"}`}
          >
            Delivery/Pickup
          </button>
          <button
            type="button"
            onClick={() => setDarkMode((v) => !v)}
            className="ui-btn rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-900"
          >
            {darkMode ? "Modo claro" : "Modo oscuro"}
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="ui-btn rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:bg-slate-900"
          >
            Sonido {soundEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </header>

      <section className="ui-panel mb-4 grid gap-2 rounded-xl p-3 md:grid-cols-7">
        <select className="rounded-md border border-slate-200 p-2 text-sm" value={filters.estado} onChange={(e) => setFilters((s) => ({ ...s, estado: e.target.value }))}>
          <option value="">Estado comanda</option>
          {COMANDA_ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {ESTADO_LABELS[estado]}
            </option>
          ))}
        </select>

        <select className="rounded-md border border-slate-200 p-2 text-sm" value={filters.estadoPago} onChange={(e) => setFilters((s) => ({ ...s, estadoPago: e.target.value }))}>
          <option value="">Estado pago</option>
          {PAYMENT_ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {PAYMENT_LABELS[estado]}
            </option>
          ))}
        </select>

        <select className="rounded-md border border-slate-200 p-2 text-sm" value={filters.canal} onChange={(e) => setFilters((s) => ({ ...s, canal: e.target.value }))}>
          <option value="">Canal</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="web">Web</option>
        </select>

        <select className="rounded-md border border-slate-200 p-2 text-sm" value={filters.tipoEntrega} onChange={(e) => setFilters((s) => ({ ...s, tipoEntrega: e.target.value }))}>
          <option value="">Tipo entrega</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
        </select>

        <input
          className="rounded-md border border-slate-200 p-2 text-sm"
          type="date"
          value={filters.fecha}
          onChange={(e) => setFilters((s) => ({ ...s, fecha: e.target.value }))}
        />

        <input
          className="rounded-md border border-slate-200 p-2 text-sm"
          placeholder="Sucursal"
          value={filters.sucursal}
          onChange={(e) => setFilters((s) => ({ ...s, sucursal: e.target.value }))}
        />

        <input
          className="rounded-md border border-slate-200 p-2 text-sm"
          placeholder="Buscar código, cliente, teléfono, ref pago"
          value={filters.search}
          onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))}
        />
      </section>

      {authError && !useMock && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm">
          Error autenticando con backend V3: {authError}
        </div>
      )}

      {tableroError && !useMock && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm">
          Error al cargar comandas: {tableroError.message}
        </div>
      )}

      {(authLoading || loadingComandas) && !useMock ? (
        <div className="ui-panel rounded-md p-8 text-center text-sm text-slate-500">Cargando comandas...</div>
      ) : null}

      {view === "dashboard" && (
        <section className="overflow-x-auto pb-4">
          <div className="grid min-w-[1200px] grid-cols-7 gap-3">
            {COMANDA_ESTADOS.map((estado) => (
              <div key={estado} className="ui-column rounded-lg p-2">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  {ESTADO_LABELS[estado]} ({grouped[estado]?.length || 0})
                </h2>
                <div className="space-y-2">
                  {(grouped[estado] || []).map((comanda, index) => (
                    <ComandaCard key={comanda.id} comanda={comanda} index={index} onOpenDetail={setSelectedComanda} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {view === "kitchen" && (
        <KitchenView
          comandas={kitchenOrders}
          loading={loadingEstado}
          onStartPreparing={(comanda) => handleUpdateEstado(comanda, "preparando")}
          onMarkReady={(comanda) => handleUpdateEstado(comanda, "lista")}
        />
      )}

      {view === "delivery" && (
        <DeliveryView
          pickupOrders={pickupOrders}
          deliveryOrders={deliveryOrders}
          loading={loadingEstado}
          onMarkEntregada={(comanda) => handleUpdateEstado(comanda, "entregada")}
          onMarkEnCamino={(comanda) => handleUpdateEstado(comanda, "en_camino")}
          onAsignarRepartidor={handleAsignarRepartidor}
        />
      )}

      <ComandaDetalle
        open={Boolean(selectedComanda)}
        comanda={selectedComanda}
        loading={loadingEstado}
        onClose={() => setSelectedComanda(null)}
        onUpdateEstado={handleUpdateEstado}
        onUpdatePago={handleUpdatePago}
        onCancelar={handleCancelar}
        onGuardarReferencia={handleGuardarReferencia}
        onCopySummary={handleCopySummary}
        onSendWhatsApp={handleSendWhatsApp}
        onPrint={() => window.print()}
      />

      {toast ? (
        <div
          className={`fixed bottom-5 right-5 rounded-md px-4 py-3 text-sm shadow-lg ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : toast.type === "warning"
              ? "bg-amber-500 text-slate-900"
              : "bg-emerald-600 text-white"
          }`}
        >
          {toast.message}
          <button type="button" className="ml-3 text-xs underline" onClick={() => setToast(null)}>
            Cerrar
          </button>
        </div>
      ) : null}
    </main>
  );
}
