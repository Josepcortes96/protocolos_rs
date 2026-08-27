import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { getPdfUrl } from "../../utils/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function PdfPage({ pdf, pageNumber }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let renderTask;
    let isCancelled = false;

    async function renderPage() {
      const page = await pdf.getPage(pageNumber);
      if (isCancelled) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const containerWidth = Math.min(window.innerWidth - 32, 920);
      const scale = containerWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      renderTask = page.render({
        canvasContext: context,
        viewport,
        transform: pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null,
      });

      await renderTask.promise;
    }

    renderPage();

    return () => {
      isCancelled = true;
      renderTask?.cancel();
    };
  }, [pageNumber, pdf]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block max-w-full rounded bg-white shadow-sm"
    />
  );
}

export function PdfViewer({ url, title }) {
  const [pdf, setPdf] = useState(null);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadingTask = pdfjsLib.getDocument(getPdfUrl(url));

    setPdf(null);
    setPdfError("");

    loadingTask.promise
      .then((document) => {
        if (isMounted) setPdf(document);
      })
      .catch((error) => {
        console.error("Error al cargar el PDF", error);
        if (isMounted) {
          setPdfError("No se ha podido previsualizar el PDF.");
        }
      });

    return () => {
      isMounted = false;
      loadingTask.destroy();
    };
  }, [url]);

  if (pdfError) {
    return (
      <div className="grid flex-1 place-items-center bg-slate-50 p-6 text-center">
        <div>
          <p className="text-[15px] font-medium text-red-700">{pdfError}</p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-lg border border-ink bg-ink px-3.5 py-2.5 text-sm font-semibold text-white"
          >
            Abrir documento
          </a>
        </div>
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className="grid flex-1 place-items-center bg-slate-50 p-6 text-[15px] font-medium text-muted">
        Cargando documento...
      </div>
    );
  }

  return (
    <div
      aria-label={title}
      className="flex-1 space-y-5 overflow-y-auto bg-slate-100 px-4 py-5"
    >
      {Array.from({ length: pdf.numPages }, (_, index) => (
        <PdfPage key={index + 1} pdf={pdf} pageNumber={index + 1} />
      ))}
    </div>
  );
}
