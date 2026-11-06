"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const isPdf = (src: string) => /\.pdf(?:$|[?#])/i.test(src);

/** Tracks an element's inner size. */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** A whole image, fitted to the stage, turned in 90° steps. */
function ImageView({ src, alt, rotation }: { src: string; alt: string; rotation: number }) {
  const [stage, { w, h }] = useSize<HTMLDivElement>();
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const sideways = rotation % 180 !== 0;
  const pad = 32;

  let box = { w: 0, h: 0, imgW: 0, imgH: 0 };
  if (natural && w && h) {
    const bw = sideways ? natural.h : natural.w;
    const bh = sideways ? natural.w : natural.h;
    const scale = Math.min((w - pad) / bw, (h - pad) / bh);
    box = { w: bw * scale, h: bh * scale, imgW: natural.w * scale, imgH: natural.h * scale };
  }

  return (
    <div ref={stage} className="relative grid h-full w-full place-items-center overflow-hidden">
      <div className="relative" style={{ width: box.w, height: box.h }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          className={`absolute left-1/2 top-1/2 max-w-none bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out-quint ${natural ? "" : "opacity-0"}`}
          style={{ width: box.imgW || undefined, height: box.imgH || undefined, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
        />
      </div>
      {!natural && <p className="absolute text-sm text-muted">Loading…</p>}
    </div>
  );
}

type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> };
type PdfTask = { promise: Promise<PdfDoc>; destroy: () => Promise<void> };
type PdfPage = {
  rotate: number;
  getViewport: (o: { scale: number; rotation?: number }) => { width: number; height: number };
  render: (o: { canvas: HTMLCanvasElement; viewport: { width: number; height: number } }) => { promise: Promise<void>; cancel: () => void };
};

/** pdf.js is large, so it loads only when a PDF is opened. The returned task frees the document when destroyed. */
async function openPdf(src: string): Promise<PdfTask> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerPort) {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url), { type: "module" });
  }
  return pdfjs.getDocument({ url: src }) as unknown as PdfTask;
}

/** Every page of a PDF as canvases, fitted to the width, turned in 90° steps. Works on iPad, where embedded PDFs show only page one. */
function PdfView({ src, rotation, onError }: { src: string; rotation: number; onError: () => void }) {
  const [stage, { w }] = useSize<HTMLDivElement>();
  const pages = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [rendered, setRendered] = useState(0);

  useEffect(() => {
    let alive = true;
    let task: PdfTask | null = null;
    openPdf(src)
      .then((t) => {
        task = t;
        if (!alive) {
          t.destroy().catch(() => {});
          return;
        }
        return t.promise.then((d) => alive && setDoc(d));
      })
      .catch(() => alive && onError());
    return () => {
      alive = false;
      task?.destroy().catch(() => {});
    };
  }, [src, onError]);

  useEffect(() => {
    const host = pages.current;
    if (!doc || !host || !w) return;
    let cancelled = false;
    const tasks: { cancel: () => void }[] = [];
    const width = Math.min(w - 32, 1100);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    (async () => {
      host.replaceChildren();
      setRendered(0);
      for (let n = 1; n <= doc.numPages && !cancelled; n++) {
        const page = await doc.getPage(n);
        const turn = (page.rotate + rotation) % 360;
        const base = page.getViewport({ scale: 1, rotation: turn });
        const viewport = page.getViewport({ scale: (width / base.width) * dpr, rotation: turn });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        canvas.className = "mx-auto block bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]";
        canvas.setAttribute("aria-label", `Page ${n} of ${doc.numPages}`);
        canvas.setAttribute("role", "img");
        host.appendChild(canvas);
        const task = page.render({ canvas, viewport });
        tasks.push(task);
        try {
          await task.promise;
        } catch {
          return; // cancelled by a newer render
        }
        if (!cancelled) setRendered(n);
      }
    })();

    return () => {
      cancelled = true;
      tasks.forEach((t) => t.cancel());
    };
  }, [doc, rotation, w]);

  return (
    <div ref={stage} className="h-full w-full overflow-y-auto overscroll-contain">
      <div ref={pages} className="flex flex-col gap-4 px-4 py-4" />
      {(!doc || rendered === 0) && <p className="py-10 text-center text-sm text-muted">Loading PDF…</p>}
      {doc && doc.numPages > 1 && <p className="pb-4 text-center text-xs text-muted">{doc.numPages} pages</p>}
    </div>
  );
}

export function DocViewer({ src, title, rotation, failedLabel }: { src: string; title: string; rotation: number; failedLabel: string }) {
  const [failed, setFailed] = useState(false);
  // Stable, so the PDF loader effect doesn't re-run on every render.
  const fail = useCallback(() => setFailed(true), []);
  if (failed) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <p className="text-sm text-muted">
          {failedLabel}{" "}
          <a href={src} target="_blank" rel="noreferrer" className="text-ink underline underline-offset-4">
            {src.split("/").pop()}
          </a>
        </p>
      </div>
    );
  }
  return isPdf(src) ? <PdfView src={src} rotation={rotation} onError={fail} /> : <ImageView src={src} alt={title} rotation={rotation} />;
}
