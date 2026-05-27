import { gql } from "@apollo/client";

export const COMANDAS_TABLERO_QUERY = gql`
  query ComandasTablero($empresa: String, $sucursal: String, $estado: ComandaEstado, $limit: Int) {
    comandasTablero(empresa: $empresa, sucursal: $sucursal, estado: $estado, limit: $limit) {
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
        detalles {
          id
          productoId: producto_id
          productoNombre: producto_nombre
          cantidad
          precio
          total
          observacion
        }
      }
    }
  }
`;

export const COMANDA_BY_CODIGO_QUERY = gql`
  query ComandaByCodigo($codigo: String!, $empresa: String, $sucursal: String) {
    comandaByCodigo(codigo: $codigo, empresa: $empresa, sucursal: $sucursal) {
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
      detalles {
        id
        productoId: producto_id
        productoNombre: producto_nombre
        cantidad
        precio
        total
        observacion
      }
    }
  }
`;
