import { getServerSession } from "next-auth";
import { and, eq, inArray } from "drizzle-orm";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users, userWatches, documents } from "@/lib/db/schema";
import { buildInsurancePdf, type InsuranceItem } from "@/lib/insurance/pdf";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const owned = await db.query.userWatches.findMany({
    where: and(eq(userWatches.userId, userId), eq(userWatches.status, "owned")),
    with: { watch: true },
  });

  const watchIds = owned.map((uw) => uw.id);
  const docs =
    watchIds.length > 0
      ? await db
          .select()
          .from(documents)
          .where(
            and(
              eq(documents.userId, userId),
              inArray(documents.userWatchId, watchIds),
            ),
          )
      : [];

  const docsByWatchId = new Map<string, typeof docs>();
  for (const d of docs) {
    const list = docsByWatchId.get(d.userWatchId) ?? [];
    list.push(d);
    docsByWatchId.set(d.userWatchId, list);
  }

  const items: InsuranceItem[] = owned.map((uw) => ({
    brand: uw.watch.brand,
    model: uw.watch.model,
    reference: uw.watch.reference,
    year: uw.watch.year,
    caseSize: uw.watch.caseSize,
    material: uw.watch.material,
    serialNumber: uw.serialNumber,
    purchasePrice: uw.purchasePrice,
    currency: uw.currency,
    marketValueEstimate: uw.marketValueEstimate,
    imageUrl: uw.watch.imageUrls?.[0] ?? null,
    documents: (docsByWatchId.get(uw.id) ?? []).map((d) => ({
      fileName: d.fileName,
      docType: d.docType,
    })),
  }));

  const pdfBytes = await buildInsurancePdf(user.name, items);

  const date = new Date().toISOString().slice(0, 10);
  return new Response(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="c-shine-time-insurance-${date}.pdf"`,
    },
  });
}
