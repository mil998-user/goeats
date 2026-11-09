// Reglas para la cadena de conexión de la base.
// Las usan el backend, los scripts y los seeds, para que todos decidan igual.

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function parseDatabaseUrl(url: string | undefined): URL | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "mysql:" ? parsed : null;
  } catch {
    return null;
  }
}

/** La base corre en esta misma máquina. Solo ahí se permiten acciones que borran datos. */
export function isLocalDatabase(url: string | undefined): boolean {
  const parsed = parseDatabaseUrl(url);
  return !!parsed && LOCAL_HOSTS.has(parsed.hostname);
}

/** El certificado del servidor se verifica. Sin esto, Prisma acepta cualquier certificado. */
export function hasStrictTls(url: string | undefined): boolean {
  const parsed = parseDatabaseUrl(url);
  return !!parsed && parsed.searchParams.get("sslaccept") === "strict";
}

/** Host y base sin usuario ni contraseña, para mostrar en consola. */
export function describeDatabase(url: string | undefined): string {
  const parsed = parseDatabaseUrl(url);
  if (!parsed) return "(DATABASE_URL inválida)";
  const port = parsed.port ? `:${parsed.port}` : "";
  return `${parsed.hostname}${port}${parsed.pathname}`;
}

/**
 * Valida DATABASE_URL al arrancar.
 * Una base remota sin verificación del certificado se rechaza: la contraseña y los datos
 * viajarían por internet sin garantía de hablar con el servidor correcto.
 */
export function validateDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error("DATABASE_URL es obligatoria. Copia backend/.env.example a backend/.env y complétala.");
  }
  if (!parseDatabaseUrl(url)) {
    throw new Error("DATABASE_URL no es válida. Debe empezar con mysql://");
  }
  if (!isLocalDatabase(url) && !hasStrictTls(url)) {
    throw new Error(
      "La base remota necesita conexión cifrada y verificada. " +
        "Agrega ?sslaccept=strict&sslcert=../certs/ca.pem a DATABASE_URL (ver docs/BASE_DE_DATOS_EQUIPO.md)."
    );
  }
  return url;
}

/** Corta un script destructivo si la base no es local. */
export function assertLocalDatabase(action: string, url: string | undefined = process.env.DATABASE_URL): void {
  if (!isLocalDatabase(url)) {
    throw new Error(
      `${action} solo se permite en una base local. DATABASE_URL apunta a ${describeDatabase(url)}.`
    );
  }
}
