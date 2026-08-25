import { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function getInformacionEndpoint() {
  const configuredEndpoint = import.meta.env.VITE_INFORMACION_ENDPOINT;

  if (!configuredEndpoint || configuredEndpoint === "/informacion") {
    return "/api/informacion";
  }

  if (
    window.location.protocol === "https:" &&
    configuredEndpoint.startsWith("http://")
  ) {
    return "/api/informacion";
  }

  return configuredEndpoint;
}

const INFORMACION_ENDPOINT = getInformacionEndpoint();
const PDF_HOST = "pub-5c3d4294745645bfb40dddc883e0604a.r2.dev";

function DocumentIcon() {
  return (
    <svg
      viewBox="0 0 48 56"
      aria-hidden="true"
      className="h-12 w-10 fill-slate-50 stroke-ink stroke-2"
    >
      <path d="M10 4H29L40 15V48C40 50.2 38.2 52 36 52H10C7.8 52 6 50.2 6 48V8C6 5.8 7.8 4 10 4Z" />
      <path d="M29 4V14C29 15.1 29.9 16 31 16H40" />
      <path d="M14 25H32" />
      <path d="M14 32H32" />
      <path d="M14 39H25" />
    </svg>
  );
}

function fixMojibake(value) {
  if (typeof value !== "string") return value;
  if (!/[ÃÂ]/.test(value)) return value;

  try {
    return decodeURIComponent(
      value
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
  } catch {
    return value;
  }
}

function normalizeInfo(info) {
  return {
    ...info,
    titulo: fixMojibake(info.titulo || "Documento sin titulo"),
    descripcion: fixMojibake(info.descripcion || "Sin descripcion"),
    grupo: fixMojibake(info.grupo || "Sin grupo"),
  };
}

function groupInformaciones(items) {
  return items.reduce((groups, item) => {
    const groupName = item.grupo || "Sin grupo";
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(item);
    return groups;
  }, {});
}

function getPdfUrl(url) {
  try {
    const pdfUrl = new URL(url);

    if (pdfUrl.hostname === PDF_HOST) {
      return `/pdf${pdfUrl.pathname}${pdfUrl.search}`;
    }
  } catch {
    return url;
  }

  return url;
}

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

function PdfViewer({ url, title }) {
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

function Modal({ info, onClose }) {
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6">
      <div className="flex h-[min(820px,calc(100dvh-44px))] w-[min(1180px,calc(100vw-44px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl max-sm:h-dvh max-sm:w-screen max-sm:rounded-none">
        <header className="flex items-start justify-between gap-6 border-b border-line px-6 py-5 max-sm:flex-col max-sm:gap-3 max-sm:pr-14">
          <div className="min-w-0">
            <h2 className="[overflow-wrap:anywhere] text-[17px] font-medium leading-tight text-ink">
              {info.titulo}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              {info.descripcion || "Documento informativo"}
            </p>
          </div>
          <a
            href={info.url_informacion}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            Abrir en otra pestaña
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-xl leading-none text-ink shadow-sm transition hover:border-ink"
          >
            ×
          </button>
        </header>
        <PdfViewer url={info.url_informacion} title={info.titulo} />
      </div>
    </div>
  );
}

function DocumentCard({ info, onView }) {
  return (
    <article className="grid min-h-[365px] min-w-0 grid-cols-[48px_1fr] gap-4 rounded-lg border border-line bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-lg max-sm:min-h-0 max-sm:grid-cols-1">
      <div className="grid h-14 w-14 place-items-center rounded-lg border border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <DocumentIcon />
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-5">
        <div>
          <h3 className="[overflow-wrap:anywhere] text-[17px] font-semibold leading-tight text-ink">
            {info.titulo}
          </h3>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">
            {info.descripcion}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onView(info)}
          className="w-fit rounded-lg border border-ink bg-ink px-3.5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2b2948] hover:shadow-md max-sm:w-full"
        >
          Ver documento
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [informaciones, setInformaciones] = useState([]);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadInformaciones() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(INFORMACION_ENDPOINT, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        setInformaciones(Array.isArray(data) ? data.map(normalizeInfo) : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error al cargar informaciones", err);
          setError("No se han podido cargar los documentos.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadInformaciones();

    return () => controller.abort();
  }, []);

  const groupedInformaciones = useMemo(() => {
    const sorted = [...informaciones].sort(
      (a, b) =>
        new Date(b.fecha_creacion || 0).getTime() -
        new Date(a.fecha_creacion || 0).getTime()
    );

    return Object.entries(groupInformaciones(sorted)).sort(([a], [b]) => {
      if (a === "Protocolos") return -1;
      if (b === "Protocolos") return 1;
      return a.localeCompare(b, "es");
    });
  }, [informaciones]);

  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:px-8 lg:px-10">
      <section className="mx-auto flex w-full max-w-[1769px] flex-col gap-8">
        {loading && (
          <p className="text-[15px] font-medium text-muted">Cargando documentos...</p>
        )}

        {error && <p className="text-[15px] font-medium text-red-700">{error}</p>}

        {!loading && !error && groupedInformaciones.length === 0 && (
          <p className="text-[15px] font-medium text-muted">
            No hay documentos disponibles.
          </p>
        )}

        {!loading &&
          !error &&
          groupedInformaciones.map(([groupName, documents]) => (
            <section key={groupName} className="flex flex-col gap-5">
              <header className="flex items-center gap-5 max-sm:flex-col max-sm:items-start max-sm:gap-1">
                <h1 className="text-xl font-semibold text-ink">{groupName}</h1>
                <span className="text-[15px] font-semibold text-muted">
                  {documents.length}{" "}
                  {documents.length === 1 ? "documento" : "documentos"}
                </span>
              </header>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4 lg:gap-5">
                {documents.map((info) => (
                  <DocumentCard
                    key={info.id_informacion ?? info.url_informacion}
                    info={info}
                    onView={setSelectedInfo}
                  />
                ))}
              </div>
            </section>
          ))}
      </section>

      <Modal info={selectedInfo} onClose={() => setSelectedInfo(null)} />
    </main>
  );
}
