import { gql } from "@apollo/client";

export const ACTUALIZAR_ESTADO_COMANDA_MUTATION = gql`
  mutation ActualizarEstadoComanda(
    $id: ID!
    $estado: ComandaEstado!
    $estado_pago: ComandaEstadoPago
    $empresa: String
    $sucursal: String
  ) {
    actualizarEstadoComanda(
      id: $id
      estado: $estado
      estado_pago: $estado_pago
      empresa: $empresa
      sucursal: $sucursal
    )
  }
`;

export const ACTUALIZAR_ESTADO_PAGO_MUTATION = gql`
  mutation ActualizarEstadoPago(
    $id: ID!
    $estadoPago: String!
    $empresa: String
    $sucursal: String
  ) {
    actualizarEstadoPago(
      id: $id
      estadoPago: $estadoPago
      empresa: $empresa
      sucursal: $sucursal
    ) {
      id
      estadoPago
      referenciaPago
      metodoPago
      updatedAt
    }
  }
`;

export const CANCELAR_COMANDA_MUTATION = gql`
  mutation CancelarComanda($id: ID!, $motivo: String, $empresa: String, $sucursal: String) {
    cancelarComanda(id: $id, motivo: $motivo, empresa: $empresa, sucursal: $sucursal) {
      id
      estado
      updatedAt
    }
  }
`;

export const ASIGNAR_REPARTIDOR_MUTATION = gql`
  mutation AsignarRepartidor(
    $id: ID!
    $repartidor: String!
    $empresa: String
    $sucursal: String
  ) {
    asignarRepartidor(
      id: $id
      repartidor: $repartidor
      empresa: $empresa
      sucursal: $sucursal
    ) {
      id
      repartidor
      updatedAt
    }
  }
`;

export const GUARDAR_REFERENCIA_PAGO_MUTATION = gql`
  mutation GuardarReferenciaPago(
    $id: ID!
    $referenciaPago: String!
    $empresa: String
    $sucursal: String
  ) {
    guardarReferenciaPago(
      id: $id
      referenciaPago: $referenciaPago
      empresa: $empresa
      sucursal: $sucursal
    ) {
      id
      referenciaPago
      updatedAt
    }
  }
`;
