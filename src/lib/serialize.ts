/**
 * Prisma v7 döndürdüğü Decimal, Date gibi nesneleri
 * Client Component'e veya JSON'a güvenli aktarılabilecek plain JS değerlerine çevirir.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serialize);
  if (typeof obj === "object") {
    if (typeof obj.toNumber === "function") return obj.toNumber();
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serialize(v)])
    );
  }
  return obj;
}
