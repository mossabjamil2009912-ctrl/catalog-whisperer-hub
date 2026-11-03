import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Send, X, Loader2 } from "lucide-react";
import { askAssistant } from "@/lib/catalog.functions";
const logo = { url: "/actes-logo.png" };

type Msg = { role: "user" | "assistant"; content: string; sources?: { id: string; title: string }[] };


export function AssistantWidget() {
  const ask = useServerFn(askAssistant);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({ data: { messages: next.map(({ role, content }) => ({ role, content })) } });
      setMsgs((m) => [...m, { role: "assistant", content: res.answer, sources: res.sources }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "عذراً، حدث خطأ. حاول مرة أخرى." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="المساعد الذكي"
          className="assistant-fab fixed bottom-5 left-5 z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-foreground bg-card p-1.5 shadow-glow ring-2 ring-foreground/50 ring-offset-2 ring-offset-background transition-transform hover:scale-105"
        >
          <img src={logo.url} alt="ACTES" className="h-full w-full object-contain" />
        </button>
      )}
      {open && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex h-[78vh] flex-col overflow-hidden rounded-2xl border border-border bg-[#eef0f4] text-[#1f1f22] shadow-glow sm:inset-x-auto sm:left-5 sm:w-[400px]">
          <div className="flex items-center justify-between border-b border-border bg-foreground px-4 py-3 text-background">
            <div className="flex items-center gap-2 font-semibold">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-card p-1">
                <img src={logo.url} alt="ACTES" className="h-full w-full object-contain" />
                <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
              </span>
              <div className="leading-tight">
                <div>المساعد الذكي</div>
                <div className="flex items-center gap-1 text-xs font-normal text-emerald-600">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  متصل الآن
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="إغلاق">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.length === 0 && (
              <div className="space-y-3 text-sm text-[#4b5563]">
                <p>مرحباً! اسألني عن أي منتج أو مواصفة في كتالوجاتنا.</p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-start" : "flex justify-end"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-white text-[#1f1f22] shadow-sm"
                  }`}
                >
                  {m.content}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.sources.map((s) => (
                        <Link
                          key={s.id}
                          to="/catalog/$id"
                          params={{ id: s.id }}
                          onClick={() => setOpen(false)}
                          className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground hover:underline"
                        >
                          📄 {s.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm text-[#4b5563]">
                  <Loader2 className="h-4 w-4 animate-spin" /> يبحث في الكتالوجات...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-[#d6d9e0] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك..."
              className="flex-1 rounded-xl border-2 border-[#c7cbd3] bg-white px-3 py-2 text-base text-[#1f1f22] outline-none placeholder:text-[#9ca3af] focus:border-emerald-500"
            />
            <button
              disabled={busy || !input.trim()}
              className="rounded-xl bg-primary px-3 text-primary-foreground disabled:opacity-50"
              aria-label="إرسال"
            >
              <Send className="h-5 w-5 -scale-x-100" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
