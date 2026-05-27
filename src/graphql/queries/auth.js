export const VALIDAR_USUARIO_QUERY = `
  query ValidarUsuario($v3Login: String!, $v3Pswd: String!) {
    validarUsuario(v3login: $v3Login, v3pswd: $v3Pswd) {
      accessToken
    }
  }
`;
