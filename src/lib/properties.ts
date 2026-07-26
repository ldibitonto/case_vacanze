import { prisma } from "@/lib/db";

// Genera uno slug unico partendo da `base` (già passato per slugify altrove),
// aggiungendo -2, -3... in caso di collisione. `excludeId` serve quando si
// rinomina una property esistente, per non scontrarsi con se stessa.
export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base || "casa";
  let n = 2;
  while (true) {
    const existing = await prisma.property.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${n++}`;
  }
}
