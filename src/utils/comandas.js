export const COMANDA_ESTADOS = [
  "pendiente",
  "pagada",
  "preparando",
  "lista",
  "en_camino",
  "entregada",
  "cancelada",
];

export const PAYMENT_ESTADOS = ["pendiente", "validando", "pagado", "rechazado"];

export const ESTADO_LABELS = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  preparando: "Preparando",
  lista: "Lista",
  en_camino: "En camino",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

export const PAYMENT_LABELS = {
  pendiente: "Pendiente",
  validando: "Validando",
  pagado: "Pagado",
  rechazado: "Rechazado",
};

export const ESTADO_COLOR = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pagada: "bg-blue-100 text-blue-800 border-blue-200",
  preparando: "bg-orange-100 text-orange-800 border-orange-200",
  lista: "bg-green-100 text-green-800 border-green-200",
  en_camino: "bg-purple-100 text-purple-800 border-purple-200",
  entregada: "bg-slate-200 text-slate-700 border-slate-300",
  cancelada: "bg-red-100 text-red-800 border-red-200",
};

const PICKUP_FLOW = ["pendiente", "pagada", "preparando", "lista", "entregada"];
const DELIVERY_FLOW = ["pendiente", "pagada", "preparando", "lista", "en_camino", "entregada"];

export function canMoveToState(comanda, nextState) {
  if (!comanda || comanda.estado === "cancelada") return false;
  if (comanda.estado === nextState) return true;

  const flow = comanda.tipoEntrega === "delivery" ? DELIVERY_FLOW : PICKUP_FLOW;
  const current = flow.indexOf(comanda.estado);
  const next = flow.indexOf(nextState);
  if (current === -1 || next === -1) return false;
  return next === current + 1;
}

export function groupByEstado(comandas = []) {
  const grouped = COMANDA_ESTADOS.reduce((acc, estado) => {
    acc[estado] = [];
    return acc;
  }, {});

  for (const comanda of comandas) {
    if (!grouped[comanda.estado]) {
      grouped[comanda.estado] = [];
    }
    grouped[comanda.estado].push(comanda);
  }
  return grouped;
}

export function formatMoney(value) {
  const numberValue = Number(value || 0);
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(numberValue);
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function normalizeComanda(comanda) {
  if (!comanda) return comanda;
  const detalleRaw = comanda.detalle_comanda ?? comanda.detalleComanda ?? comanda.detalles ?? [];
  let detalleList = [];

  if (Array.isArray(detalleRaw)) {
    detalleList = detalleRaw;
  } else if (typeof detalleRaw === "string") {
    try {
      const parsed = JSON.parse(detalleRaw);
      detalleList = Array.isArray(parsed) ? parsed : [];
    } catch {
      detalleList = [];
    }
  }

  return {
    ...comanda,
    clienteNombre: comanda.clienteNombre ?? comanda.cliente_nombre ?? "",
    clienteTelefono: comanda.clienteTelefono ?? comanda.cliente_telefono ?? "",
    tipoEntrega: comanda.tipoEntrega ?? comanda.tipo_entrega ?? "",
    direccionEntrega: comanda.direccionEntrega ?? comanda.direccion_entrega ?? "",
    referenciaDireccion:
      comanda.referenciaDireccion ?? comanda.referencia_direccion ?? "",
    costoDelivery: comanda.costoDelivery ?? comanda.costo_delivery ?? 0,
    estadoPago: comanda.estadoPago ?? comanda.estado_pago ?? "pendiente",
    metodoPago: comanda.metodoPago ?? comanda.metodo_pago ?? "-",
    referenciaPago: comanda.referenciaPago ?? comanda.referencia_pago ?? "",
    createdAt: comanda.createdAt ?? comanda.created_at,
    updatedAt: comanda.updatedAt ?? comanda.updated_at,
    detalleComanda: detalleList,
    detalles: detalleList.map((d, index) => ({
      ...d,
      id: d.id ?? `${comanda.id || "comanda"}-${index}`,
      productoId: d.productoId ?? d.producto_id ?? null,
      productoNombre: d.productoNombre ?? d.producto_nombre ?? "",
      cantidad: Number(d.cantidad ?? 0),
      precio: Number(d.precio ?? 0),
      total: Number(d.total ?? (Number(d.cantidad ?? 0) * Number(d.precio ?? 0))),
    })),
  };
}
