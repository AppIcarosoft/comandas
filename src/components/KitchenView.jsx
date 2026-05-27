import { formatDateTime } from "../utils/comandas";

export default function KitchenView({ comandas, onStartPreparing, onMarkReady, loading }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Vista Cocina</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {comandas.map((comanda) => (
          <article key={comanda.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-bold">{comanda.codigo}</h3>
              <span className="text-xs font-semibold uppercase text-slate-500">{comanda.tipoEntrega}</span>
            </div>
            <p className="mb-2 text-xs text-slate-500">Entró: {formatDateTime(comanda.createdAt)}</p>
            <ul className="mb-3 space-y-1 text-sm">
              {comanda.detalles.map((item) => (
                <li key={item.id} className="rounded-md bg-slate-50 px-2 py-1">
                  <div className="font-medium">
                    {item.cantidad}x {item.productoNombre}
                  </div>
                  {item.observacion ? <div className="text-xs text-slate-600">{item.observacion}</div> : null}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onStartPreparing(comanda)}
                disabled={loading || comanda.estado !== "pagada"}
                className="flex-1 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-300"
              >
                Iniciar preparación
              </button>
              <button
                type="button"
                onClick={() => onMarkReady(comanda)}
                disabled={loading || (comanda.estado !== "preparando" && comanda.estado !== "pagada")}
                className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-300"
              >
                Marcar lista
              </button>
            </div>
          </article>
        ))}
      </div>
      {comandas.length === 0 && <p className="text-sm text-slate-500">No hay comandas para cocina.</p>}
    </section>
  );
}
