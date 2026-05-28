import { gql } from "@apollo/client";

export const COMANDAS_TABLERO_REALTIME_SUBSCRIPTION = gql`
  subscription ComandasTableroRealtime(
    $empresa: String
    $sucursal: String
    $estado: ComandaEstado
    $limit: Int
  ) {
    comandasTableroRealtime(
      empresa: $empresa
      sucursal: $sucursal
      estado: $estado
      limit: $limit
    ) {
      checksum
      total
      generatedAt: generated_at
      comandas {
        id
        codigo
        canal
        clienteNombre: cliente_nombre
        clienteTelefono: cliente_telefono
        tipoEntrega: tipo_entrega
        direccionEntrega: direccion_entrega
        referenciaDireccion: referencia_direccion
        costoDelivery: costo_delivery
        estado
        estadoPago: estado_pago
        metodoPago: metodo_pago
        referenciaPago: referencia_pago
        subtotal
        total
        observacion
        empresa
        sucursal
        createdAt: created_at
        updatedAt: updated_at
        detalle_comanda
      }
    }
  }
`;

export const NUEVA_COMANDA_SUBSCRIPTION = gql`
  subscription NuevaComanda($empresa: String, $sucursal: String) {
    nuevaComanda(empresa: $empresa, sucursal: $sucursal) {
      id
      codigo
      estado
      estadoPago
      updatedAt
    }
  }
`;

export const COMANDA_ACTUALIZADA_SUBSCRIPTION = gql`
  subscription ComandaActualizada($empresa: String, $sucursal: String) {
    comandaActualizada(empresa: $empresa, sucursal: $sucursal) {
      id
      codigo
      estado
      estadoPago
      updatedAt
    }
  }
`;

export const COMANDA_CANCELADA_SUBSCRIPTION = gql`
  subscription ComandaCancelada($empresa: String, $sucursal: String) {
    comandaCancelada(empresa: $empresa, sucursal: $sucursal) {
      id
      codigo
      estado
      estadoPago
      updatedAt
    }
  }
`;
