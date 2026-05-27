import { gql } from "@apollo/client";

export const COMANDA_FIELDS = gql`
  fragment ComandaFields on Comanda {
    id
    codigo
    canal
    clienteNombre
    clienteTelefono
    tipoEntrega
    direccionEntrega
    referenciaDireccion
    estado
    estadoPago
    metodoPago
    referenciaPago
    subtotal
    costoDelivery
    total
    empresa
    sucursal
    observacion
    createdAt
    updatedAt
    detalles {
      id
      productoId
      productoNombre
      cantidad
      precio
      total
      observacion
    }
  }
`;
