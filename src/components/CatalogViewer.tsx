import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, ExternalLink, Loader2, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { getCatalog } from "@/lib/catalog.functions";
import { PdfPages } from "@/components/PdfPages";

type Cat = Awaited<ReturnType<typeof getCatalog>>;

export function CatalogViewer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const fetchCatalog = useServerFn(getCatalog);
  const [c, setC] = useState<Cat>(null);

  useEffect(() => {
    if (!id) return;
    setC(null);
    fetchCatalog({ data: { id } }).then(setC).catch(() => toast.error("تعذر فتح الكتالوج"));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [id]);

  if (!id) return null;

  const share = async () => {
    const url = `${window.location.origin}/catalog/${id}`;
    if (navigator.share) await navigator.share({ title: c?.title ?? "كتالوج", url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-2 sm:p-6" onClick={onClose}>
      <div
        className="flex h-full max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          {c?.download_url ? (
            <a href={c.download_url} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">
              <Download className="h-4 w-4" /> تحميل
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-muted-foreground">
              <Download className="h-4 w-4" /> تحميل
            </span>
          )}
          <button onClick={share} aria-label="مشاركة" className="rounded-xl border border-border p-2 hover:text-primary">
            <Share2 className="h-4 w-4" />
          </button>
          {c?.file_url && (
            <a href={c.file_url} target="_blank" rel="noreferrer" aria-label="فتح في نافذة جديدة" className="rounded-xl border border-border p-2 hover:text-primary">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{c?.title}</p>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-xl p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 bg-muted">
          {c?.file_url ? (
            <PdfPages url={c.file_url} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
