import { formatMoney } from "../utils/comandas";

export default function DeliveryView({
  pickupOrders,
  deliveryOrders,
  loading,
  onMarkEntregada,
  onMarkEnCamino,
  onAsignarRepartidor,
}) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Despacho Delivery / Pickup</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-slate-500">Pickup listo para retirar</h3>
          <div className="space-y-2">
            {pickupOrders.map((comanda) => (
              <article key={comanda.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="font-semibold">{comanda.codigo}</div>
                <div className="text-sm">{comanda.clienteNombre}</div>
                <div className="text-sm text-slate-600">{comanda.clienteTelefono}</div>
                <div className="text-sm text-slate-600">Total: {formatMoney(comanda.total)}</div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onMarkEntregada(comanda)}
                  className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-300"
                >
                  Marcar entregada
                </button>
              </article>
            ))}
            {pickupOrders.length === 0 && <p className="text-sm text-slate-500">Sin pickup pendientes.</p>}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-slate-500">Delivery listo para enviar</h3>
          <div className="space-y-2">
            {deliveryOrders.map((comanda) => (
              <article key={comanda.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="font-semibold">{comanda.codigo}</div>
                <div className="text-sm">{comanda.direccionEntrega || "-"}</div>
                <div className="text-sm text-slate-600">{comanda.referenciaDireccion || "-"}</div>
                <div className="text-sm text-slate-600">{comanda.clienteTelefono}</div>
                <div className="text-sm text-slate-600">Total: {formatMoney(comanda.total)}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onMarkEnCamino(comanda)}
                    className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-300"
                  >
                    Marcar en camino
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onMarkEntregada(comanda)}
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-300"
                  >
                    Marcar entregada
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      const repartidor = window.prompt("Nombre del repartidor");
                      if (repartidor && repartidor.trim()) onAsignarRepartidor(comanda, repartidor.trim());
                    }}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    Asignar repartidor
                  </button>
                </div>
              </article>
            ))}
            {deliveryOrders.length === 0 && <p className="text-sm text-slate-500">Sin delivery pendientes.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
