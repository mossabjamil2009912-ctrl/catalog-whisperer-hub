import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Renders every PDF page as a canvas so the catalog shows directly (no phone "Open" button).
// Pinch / double-tap zoom via react-zoom-pan-pinch; normal scrolling when not zoomed.
export function PdfPages({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const box = ref.current;
    if (!box) return;
    box.innerHTML = "";
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const pdf = await pdfjs.getDocument({ url }).promise;
        const width = box.clientWidth || 800;
        // Higher resolution so text stays sharp when zoomed in.
        const dpr = Math.min((window.devicePixelRatio || 1) * 2, 4);
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "mb-2 w-full rounded-lg bg-white shadow";
          box.appendChild(canvas);
          await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
          if (i === 1) setLoading(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="h-full overflow-y-auto p-2">
      {loading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
