import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import { formatMoney } from "@/lib/currency";

export interface InsuranceItem {
  brand: string;
  model: string;
  reference: string | null;
  year: number | null;
  caseSize: string | null;
  material: string | null;
  serialNumber: string | null;
  purchasePrice: string | null;
  currency: string;
  marketValueEstimate: string | null;
  imageUrl: string | null;
  documents: { fileName: string; docType: string }[];
}

const MARGIN = 48;
const PAGE_W = PageSizes.A4[0];
const PAGE_H = PageSizes.A4[1];
const COL = PAGE_W - MARGIN * 2;
const GOLD = rgb(0.72, 0.58, 0.36);
const DARK = rgb(0.12, 0.1, 0.08);
const GREY = rgb(0.45, 0.43, 0.4);
const LIGHT = rgb(0.88, 0.86, 0.82);

async function fetchImageBytes(
  url: string,
): Promise<{ bytes: Uint8Array; mime: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") ?? "";
    const buf = await res.arrayBuffer();
    return { bytes: new Uint8Array(buf), mime };
  } catch {
    return null;
  }
}

function isPng(bytes: Uint8Array): boolean {
  return (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

export async function buildInsurancePdf(
  ownerName: string,
  items: InsuranceItem[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`C-Shine Time Insurance Record — ${ownerName}`);
  doc.setAuthor("Wristfolio");
  doc.setCreator("Wristfolio");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const exportDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Calculate total value across all items (dominant currency)
  const totals = new Map<string, number>();
  for (const item of items) {
    const v = Number(item.marketValueEstimate ?? 0);
    if (v > 0) {
      const cur = item.currency || "EUR";
      totals.set(cur, (totals.get(cur) ?? 0) + v);
    }
  }
  const topEntry = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
  const totalValueStr = topEntry ? formatMoney(topEntry[1], topEntry[0]) : "—";

  let page = doc.addPage(PageSizes.A4);
  let y = PAGE_H - MARGIN;

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN + 30) {
      addFooter(page, doc.getPageCount());
      page = doc.addPage(PageSizes.A4);
      y = PAGE_H - MARGIN;
    }
  }

  function addFooter(p: ReturnType<typeof doc.addPage>, pageNum: number) {
    p.drawText(
      `Confidential — For insurance purposes only  ·  Page ${pageNum}`,
      {
        x: MARGIN,
        y: 24,
        size: 7,
        font: regular,
        color: GREY,
      },
    );
    p.drawLine({
      start: { x: MARGIN, y: 34 },
      end: { x: PAGE_W - MARGIN, y: 34 },
      thickness: 0.5,
      color: LIGHT,
    });
  }

  // ── Cover block ────────────────────────────────────────────────────────────
  page.drawText("WRISTFOLIO", {
    x: MARGIN,
    y,
    size: 9,
    font: bold,
    color: GOLD,
  });
  y -= 18;
  page.drawText("Insurance Record", {
    x: MARGIN,
    y,
    size: 26,
    font: bold,
    color: DARK,
  });
  y -= 14;
  page.drawText(ownerName, {
    x: MARGIN,
    y,
    size: 13,
    font: regular,
    color: DARK,
  });
  y -= 11;
  page.drawText(`Exported ${exportDate}`, {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
    color: GREY,
  });
  y -= 9;
  page.drawText(`Total estimated value: ${totalValueStr}`, {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
    color: GREY,
  });
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.8,
    color: GOLD,
  });
  y -= 22;

  // ── One block per watch ────────────────────────────────────────────────────
  for (const item of items) {
    const IMG_SIZE = 72;
    const BLOCK_MIN = IMG_SIZE + 24;
    ensureSpace(BLOCK_MIN);

    const blockTop = y;

    // Image column
    let imgEmbedded = false;
    if (item.imageUrl) {
      const result = await fetchImageBytes(item.imageUrl);
      if (result) {
        try {
          const img = isPng(result.bytes)
            ? await doc.embedPng(result.bytes)
            : await doc.embedJpg(result.bytes);
          const dims = img.scaleToFit(IMG_SIZE, IMG_SIZE);
          page.drawImage(img, {
            x: MARGIN,
            y: y - dims.height,
            width: dims.width,
            height: dims.height,
          });
          imgEmbedded = true;
        } catch {
          // fall through to placeholder
        }
      }
    }
    if (!imgEmbedded) {
      page.drawRectangle({
        x: MARGIN,
        y: y - IMG_SIZE,
        width: IMG_SIZE,
        height: IMG_SIZE,
        color: LIGHT,
        borderColor: LIGHT,
        borderWidth: 0,
      });
    }

    // Text column
    const textX = MARGIN + IMG_SIZE + 14;
    const textW = COL - IMG_SIZE - 14;
    let ty = blockTop;

    page.drawText(`${item.brand} ${item.model}`, {
      x: textX,
      y: ty,
      size: 11,
      font: bold,
      color: DARK,
      maxWidth: textW,
    });
    ty -= 12;

    const subParts = [
      item.reference,
      item.year ? String(item.year) : null,
    ].filter(Boolean);
    if (subParts.length > 0) {
      page.drawText(subParts.join(" · "), {
        x: textX,
        y: ty,
        size: 8,
        font: regular,
        color: GREY,
        maxWidth: textW,
      });
      ty -= 10;
    }

    ty -= 4;

    const fields: [string, string | null][] = [
      ["Case size", item.caseSize ? `${item.caseSize} mm` : null],
      ["Material", item.material],
      ["Serial no.", item.serialNumber],
      [
        "Purchase price",
        item.purchasePrice
          ? formatMoney(Number(item.purchasePrice), item.currency)
          : null,
      ],
      [
        "Market value",
        item.marketValueEstimate
          ? formatMoney(Number(item.marketValueEstimate), item.currency)
          : null,
      ],
    ];

    for (const [label, value] of fields) {
      if (!value) continue;
      ensureSpace(10);
      page.drawText(`${label}:`, {
        x: textX,
        y: ty,
        size: 8,
        font: bold,
        color: DARK,
      });
      page.drawText(value, {
        x: textX + 72,
        y: ty,
        size: 8,
        font: regular,
        color: DARK,
        maxWidth: textW - 72,
      });
      ty -= 10;
    }

    if (item.documents.length > 0) {
      ty -= 4;
      ensureSpace(10);
      page.drawText("Documents:", {
        x: textX,
        y: ty,
        size: 8,
        font: bold,
        color: DARK,
      });
      ty -= 10;
      for (const d of item.documents) {
        ensureSpace(9);
        page.drawText(`· ${d.fileName} (${d.docType})`, {
          x: textX + 6,
          y: ty,
          size: 7.5,
          font: regular,
          color: GREY,
          maxWidth: textW - 6,
        });
        ty -= 9;
      }
    }

    y = Math.min(blockTop - IMG_SIZE, ty) - 18;

    page.drawLine({
      start: { x: MARGIN, y: y + 10 },
      end: { x: PAGE_W - MARGIN, y: y + 10 },
      thickness: 0.4,
      color: LIGHT,
    });
  }

  // Footer on last page
  addFooter(page, doc.getPageCount());

  return doc.save();
}
