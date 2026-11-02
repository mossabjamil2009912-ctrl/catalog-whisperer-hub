import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { loadPdfBytes } from "@/lib/pdf-cache";

// Renders PDF pages as canvases. Page 1 first; other pages render only when scrolled near.
// Bytes are cached on the device so reopening is instant.
export function PdfPages({ id, url, cover }: { id: string; url: string; cover?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    const box = ref.current;
    if (!box) return;
    box.innerHTML = "";
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const [pdfjs, workerMod, data] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
          loadPdfBytes(id, url),
        ]);
        pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;
        const cdn = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}`;
        const pdf = await pdfjs.getDocument({
          data: new Uint8Array(data.slice(0)),
          cMapUrl: `${cdn}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${cdn}/standard_fonts/`,
          wasmUrl: `${cdn}/wasm/`,
          useSystemFonts: false,
          disableFontFace: true,
        }).promise;
        if (cancelled) return;
        const width = box.clientWidth || 800;
        const dpr = Math.min((window.devicePixelRatio || 1) * 2, 4);
        const first = await pdf.getPage(1);
        const base = first.getViewport({ scale: 1 });
        const ratio = base.height / base.width;

        const render = async (i: number, canvas: HTMLCanvasElement) => {
          const page = i === 1 ? first : await pdf.getPage(i);
          const b = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / b.width) * dpr });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.aspectRatio = "";
          await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
        };

        observer = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              const c = e.target as HTMLCanvasElement;
              observer?.unobserve(c);
              render(Number(c.dataset["page"]), c).catch(() => {});
            }
          },
          { rootMargin: "800px 0px" },
        );

        for (let i = 1; i <= pdf.numPages; i++) {
          const canvas = document.createElement("canvas");
          canvas.dataset["page"] = String(i);
          canvas.style.aspectRatio = `1 / ${ratio}`;
          canvas.className = "mb-2 block w-full rounded-lg bg-white shadow";
          box.appendChild(canvas);
          if (i > 1) observer.observe(canvas);
          else await render(1, canvas);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="h-full overflow-y-auto overscroll-contain p-2">
      {loading && (
        <div className="relative">
          {cover ? (
            <img src={cover} alt="" className="w-full rounded-lg bg-white opacity-80 shadow" />
          ) : (
            <div className="h-40" />
          )}
          <Loader2 className="absolute left-1/2 top-20 h-8 w-8 -translate-x-1/2 animate-spin text-primary" />
        </div>
      )}
      {error && <p className="p-6 text-center text-muted-foreground">تعذر عرض الكتالوج — استخدم زر التحميل.</p>}
      <TransformWrapper
        minScale={1}
        maxScale={5}
        panning={{ disabled: !zoomed }}
        doubleClick={{ mode: zoomed ? "reset" : "zoomIn", step: 1 }}
        wheel={{ activationKeys: ["Control"] }}
        onTransform={(_, s) => setZoomed(s.scale > 1.01)}
      >
        <TransformComponent wrapperStyle={{ width: "100%", overflow: "visible" }} contentStyle={{ width: "100%" }}>
          <div ref={ref} className="w-full" />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
