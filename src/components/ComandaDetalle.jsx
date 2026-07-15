import {
  canMoveToState,
  ESTADO_LABELS,
  formatDateTime,
  formatMoney,
  PAYMENT_LABELS,
} from "../utils/comandas";

const FLOW_ACTIONS = [
  { label: "Confirmar comanda", estado: "pagada" },
  { label: "Marcar como preparando", estado: "preparando" },
  { label: "Marcar como lista", estado: "lista" },
  { label: "Marcar como en camino", estado: "en_camino" },
  { label: "Marcar como entregada", estado: "entregada" },
];

const PRIMARY_FLOW_STATES = new Set(["pagada", "entregada"]);

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 py-2 text-sm dark:border-slate-700">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <span className="text-right font-medium text-slate-900 dark:text-slate-100">{value || "-"}</span>
    </div>
  );
}

export default function ComandaDetalle({
  open,
  comanda,
  loading,
  onClose,
  onUpdateEstado,
  onUpdatePago,
  onCancelar,
  onGuardarReferencia,
  onCopySummary,
  onSendWhatsApp,
  onPrint,
}) {
  if (!open || !comanda) return null;

  const mustWarnNotPaid =
    (comanda.estadoPago === "pendiente" ||
      comanda.estadoPago === "validando" ||
      comanda.estadoPago === "rechazado") &&
    comanda.estado !== "cancelada";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-[2px]">
      <section className="ui-panel ui-fade-in h-full w-full max-w-2xl overflow-y-auto p-5 text-slate-900 dark:text-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Comanda {comanda.codigo}</h2>
          <button
            type="button"
            onClick={onClose}
            className="ui-btn rounded-md border border-slate-300 px-3 py-1 text-sm transition-colors hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>

        {mustWarnNotPaid && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/60 dark:bg-amber-950/50 dark:text-amber-100">
            El pago no está aprobado. Verifica antes de enviar a preparación.
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Cliente</h3>
            <DetailRow label="Nombre" value={comanda.clienteNombre} />
            <DetailRow label="Teléfono" value={comanda.clienteTelefono} />
            <DetailRow label="Canal" value={comanda.canal} />
            <DetailRow label="Dirección" value={comanda.direccionEntrega} />
            <DetailRow label="Referencia" value={comanda.referenciaDireccion} />
            <DetailRow label="Observación" value={comanda.observacion} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Comanda</h3>
            <DetailRow label="Código" value={comanda.codigo} />
            <DetailRow label="Fecha y hora" value={formatDateTime(comanda.createdAt)} />
            <DetailRow label="Estado" value={ESTADO_LABELS[comanda.estado]} />
            <DetailRow label="Estado pago" value={PAYMENT_LABELS[comanda.estadoPago]} />
            <DetailRow label="Método pago" value={comanda.metodoPago} />
            <DetailRow label="Referencia pago" value={comanda.referenciaPago} />
            <DetailRow label="Subtotal" value={formatMoney(comanda.subtotal)} />
            <DetailRow label="Delivery" value={formatMoney(comanda.costoDelivery)} />
            <DetailRow label="Total" value={formatMoney(comanda.total)} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Productos</h3>
          <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-100">
                <tr>
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2">Cant.</th>
                  <th className="px-3 py-2">Precio</th>
                  <th className="px-3 py-2">Línea</th>
                  <th className="px-3 py-2">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {comanda.detalles?.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">{item.productoNombre}</td>
                    <td className="px-3 py-2">{item.cantidad}</td>
                    <td className="px-3 py-2">{formatMoney(item.precio)}</td>
                    <td className="px-3 py-2">{formatMoney(item.total)}</td>
                    <td className="px-3 py-2">{item.observacion || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Acciones de estado</h4>
            <div className="flex flex-wrap gap-2">
              {FLOW_ACTIONS.map((action) => {
                const disabled = !canMoveToState(comanda, action.estado) || loading;
                const isPrimary = PRIMARY_FLOW_STATES.has(action.estado);
                if (action.estado === "en_camino" && comanda.tipoEntrega !== "delivery") return null;
                return (
                  <button
                    key={action.estado}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (action.estado === "entregada") {
                        const ok = window.confirm("¿Confirmar comanda como entregada?");
                        if (!ok) return;
                      }
                      onUpdateEstado(comanda, action.estado);
                    }}
                    className={`ui-btn rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:bg-slate-300 ${
                      isPrimary
                        ? "bg-cyan-600 text-white"
                        : "border border-slate-300 bg-white/70 text-slate-800 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
                    }`}
                  >
                    {action.label}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={loading || comanda.estado === "cancelada"}
                onClick={() => {
                  const ok = window.confirm("¿Seguro que deseas cancelar la comanda?");
                  if (ok) onCancelar(comanda);
                }}
                className="ui-btn rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:border-red-500/70 dark:bg-red-950/40 dark:text-red-100"
              >
                Cancelar comanda
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Gestión de pago</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUpdatePago(comanda, "validando")}
                disabled={loading}
                className="ui-btn rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
              >
                Marcar validando
              </button>
              <button
                type="button"
                onClick={() => onUpdatePago(comanda, "pagado")}
                disabled={loading}
                className="ui-btn rounded-md bg-emerald-600 px-3 py-2 text-sm text-white"
              >
                Aprobar pago
              </button>
              <button
                type="button"
                onClick={() => onUpdatePago(comanda, "rechazado")}
                disabled={loading}
                className="ui-btn rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
              >
                Rechazar pago
              </button>
              <button
                type="button"
                onClick={() => {
                  const referencia = window.prompt("Referencia de pago", comanda.referenciaPago || "");
                  if (referencia && referencia.trim()) {
                    onGuardarReferencia(comanda, referencia.trim());
                  }
                }}
                disabled={loading}
                  className="ui-btn rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100"
              >
                Guardar referencia
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onPrint(comanda)} className="ui-btn rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100">
              Imprimir ticket
            </button>
              <button type="button" onClick={() => onSendWhatsApp(comanda)} className="ui-btn rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100">
              Enviar WhatsApp
            </button>
              <button type="button" onClick={() => onCopySummary(comanda)} className="ui-btn rounded-md border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100">
              Copiar resumen
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
