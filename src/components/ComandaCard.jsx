import { ESTADO_COLOR, ESTADO_LABELS, PAYMENT_LABELS, formatDateTime, formatMoney } from "../utils/comandas";

function InfoItem({ label, value }) {
  return (
    <div className="text-xs text-slate-600">
      <span className="font-medium text-slate-700">{label}: </span>
      <span>{value || "-"}</span>
    </div>
  );
}

export default function ComandaCard({ comanda, onOpenDetail }) {
  return (
    <article
      className={`relative rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md ${
        comanda.isNew ? "ring-2 ring-emerald-400" : "border-slate-200"
      }`}
    >
      {comanda.isNew && (
        <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
          Nueva
        </span>
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{comanda.codigo}</h3>
        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${ESTADO_COLOR[comanda.estado]}`}>
          {ESTADO_LABELS[comanda.estado]}
        </span>
      </div>

      <div className="space-y-1">
        <InfoItem label="Canal" value={comanda.canal} />
        <InfoItem label="Cliente" value={comanda.clienteNombre} />
        <InfoItem label="Teléfono" value={comanda.clienteTelefono} />
        <InfoItem label="Entrega" value={comanda.tipoEntrega} />
        <InfoItem label="Pago" value={PAYMENT_LABELS[comanda.estadoPago]} />
        <InfoItem label="Total" value={formatMoney(comanda.total)} />
        <InfoItem label="Hora" value={formatDateTime(comanda.createdAt)} />
        <InfoItem label="Sucursal" value={comanda.sucursal} />
      </div>

      <button
        type="button"
        onClick={() => onOpenDetail(comanda)}
        className="mt-3 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Ver detalle
      </button>
    </article>
  );
}
