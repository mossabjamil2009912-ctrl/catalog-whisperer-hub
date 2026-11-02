// Browser-only helpers: catalog info memo + PDF bytes cached on the device (keyed by catalog id,
// because signed file URLs change every time).
import { getCatalog } from "@/lib/catalog.functions";

type Cat = Awaited<ReturnType<typeof getCatalog>>;
const infoMemo = new Map<string, Promise<Cat>>();
const bytesMemo = new Map<string, Promise<ArrayBuffer>>();
const CACHE = "catalog-pdfs-v1";

export function loadCatalogInfo(id: string, fetcher: (a: { data: { id: string } }) => Promise<Cat>) {
  let p = infoMemo.get(id);
  if (!p) {
    p = fetcher({ data: { id } }).catch((e) => {
      infoMemo.delete(id);
      throw e;
    });
    infoMemo.set(id, p);
  }
  return p;
}

export function loadPdfBytes(id: string, url: string): Promise<ArrayBuffer> {
  let p = bytesMemo.get(id);
  if (!p) {
    p = (async () => {
      const key = `/__catalog/${id}`;
      const cache = "caches" in window ? await caches.open(CACHE).catch(() => null) : null;
      const hit = await cache?.match(key);
      if (hit) return hit.arrayBuffer();
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const buf = await res.arrayBuffer();
      cache?.put(key, new Response(buf.slice(0), { headers: { "content-type": "application/pdf" } })).catch(() => {});
      return buf;
    })().catch((e) => {
      bytesMemo.delete(id);
      throw e;
    });
    bytesMemo.set(id, p);
  }
  return p;
}

export function prefetchCatalog(id: string, fetcher: (a: { data: { id: string } }) => Promise<Cat>) {
  loadCatalogInfo(id, fetcher)
    .then((c) => c?.file_url && loadPdfBytes(id, c.file_url))
    .catch(() => {});
}

const RECENT = "recent-catalogs";
export function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT) || "[]");
  } catch {
    return [];
  }
}
export function pushRecent(id: string) {
  const list = [id, ...getRecent().filter((x) => x !== id)].slice(0, 4);
  localStorage.setItem(RECENT, JSON.stringify(list));
  window.dispatchEvent(new Event("recent-changed"));
}
