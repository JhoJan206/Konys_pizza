// Error con código HTTP. El manejador central de app.js lo convierte en
// una respuesta JSON { error: mensaje } con ese código.
export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

// Códigos de error de PostgreSQL que se traducen a mensajes claros
export const PG_DUPLICADO = '23505';       // violación de unique
export const PG_REFERENCIADO = '23503';    // violación de llave foránea
