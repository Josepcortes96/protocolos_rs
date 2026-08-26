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
const API_BASE = "/api";

function getAccesoId() {
  const match = window.location.pathname.match(/^\/acceso\/?([^/]+)?/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(".", "");
}

function formatSession(row) {
  const date = formatDate(row.fecha_formacion);
  const start = row.hora?.slice(0, 5);
  const end = row.hora_final?.slice(0, 5);
  const time = start && end ? `${start} - ${end}` : start || end || "";

  return [date, time].filter(Boolean).join("\n");
}

function normalizeFormacion(row) {
  return {
    ...row,
    empleado: fixMojibake(row.empleado || "Empleado sin nombre"),
    departamento: fixMojibake(row.departamento || "Sin departamento"),
    delegado: fixMojibake(row.delegado || ""),
    responsable: fixMojibake(row.responsable || ""),
    estado: fixMojibake(row.estado || ""),
    grupo: fixMojibake(row.grupo || ""),
  };
}

function getDepartmentColor(id) {
  const colors = [
    "#059669",
    "#c2410c",
    "#4f46e5",
    "#ea580c",
    "#0f766e",
    "#9333ea",
  ];
  return colors[Math.abs(Number(id) || 0) % colors.length];
}

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

function SignatureStatus({ signed, date }) {
  if (!signed) {
    return <span className="text-[15px] font-medium text-muted">Pendiente</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1 text-[15px] font-medium leading-none text-ink">
        Firmado
      </span>
      {date && <span className="text-[15px] text-ink">{formatDate(date)}</span>}
    </div>
  );
}

function SignatureCanvas({ onChange, clearSignal }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";
    context.clearRect(0, 0, rect.width, rect.height);
    onChange("");
  }, [clearSignal, onChange]);

  function getPoint(event) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(event) {
    const context = canvasRef.current.getContext("2d");
    const point = getPoint(event);

    drawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event) {
    if (!drawingRef.current) return;

    const context = canvasRef.current.getContext("2d");
    const point = getPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();
    onChange(canvasRef.current.toDataURL("image/png"));
  }

  function stopDrawing() {
    drawingRef.current = false;
  }

  return (
    <canvas
      ref={canvasRef}
      className="h-52 w-full touch-none rounded-lg border border-line bg-white shadow-inner"
      onPointerDown={startDrawing}
      onPointerMove={draw}
      onPointerUp={stopDrawing}
      onPointerCancel={stopDrawing}
      onPointerLeave={stopDrawing}
    />
  );
}

function FirmaModal({ row, onClose, onSaved }) {
  const [signature, setSignature] = useState("");
  const [clearSignal, setClearSignal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!row) return null;

  async function saveSignature() {
    if (!signature) {
      setError("Dibuja la firma antes de guardar.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/formaciones/registro/${row.id_registro}/firma`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firma_empleado: signature }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const updated = await response.json();
      onSaved(updated, signature);
      onClose();
    } catch (err) {
      console.error("Error al guardar la firma", err);
      setError("No se ha podido guardar la firma.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6">
      <div className="w-[min(620px,calc(100vw-32px))] rounded-lg bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-5 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Firma trabajador/a</h2>
            <p className="mt-1 text-[15px] text-muted">{row.departamento}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-xl leading-none text-ink transition hover:border-ink"
          >
            x
          </button>
        </header>

        <div className="space-y-4 px-6 py-5">
          <SignatureCanvas onChange={setSignature} clearSignal={clearSignal} />
          {error && <p className="text-[15px] font-medium text-red-700">{error}</p>}
          <div className="flex justify-end gap-3 max-sm:flex-col">
            <button
              type="button"
              onClick={() => setClearSignal((value) => value + 1)}
              className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={saveSignature}
              disabled={saving}
              className="rounded-lg border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b2948] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar firma"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumenModal({ rows, employeeName, onClose }) {
  if (!rows) return null;

  const signed = rows.filter(
    (row) => row.firma_empleado || row.fecha_firma_empleado
  ).length;
  const pending = rows.length - signed;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6">
      <div className="w-[min(760px,calc(100vw-32px))] overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-5 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Resumen</h2>
            <p className="mt-1 text-[15px] text-muted">{employeeName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-xl leading-none text-ink transition hover:border-ink"
          >
            x
          </button>
        </header>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-3 gap-3 text-center max-sm:grid-cols-1">
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-2xl font-semibold text-ink">{rows.length}</p>
              <p className="text-sm text-muted">Total</p>
            </div>
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-2xl font-semibold text-emerald-700">{signed}</p>
              <p className="text-sm text-muted">Firmadas</p>
            </div>
            <div className="rounded-lg border border-line px-4 py-3">
              <p className="text-2xl font-semibold text-red-700">{pending}</p>
              <p className="text-sm text-muted">Pendientes</p>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto rounded-lg border border-line">
            {rows.map((row) => (
              <div
                key={row.id_registro}
                className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0 max-sm:flex-col max-sm:items-start"
              >
                <div>
                  <p className="font-medium text-ink">{row.departamento}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted">
                    {formatSession(row) || "Sin sesion"}
                  </p>
                </div>
                <SignatureStatus
                  signed={Boolean(row.firma_empleado || row.fecha_firma_empleado)}
                  date={row.fecha_firma_empleado}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormacionesTable({ rows, onSign }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="grid grid-cols-[1.45fr_1fr_1fr_1fr_1fr] border-b border-line bg-white text-[15px] font-medium text-slate-700 max-lg:hidden">
        <div className="px-5 py-4">Departamento</div>
        <div className="px-5 py-4">Formador/a</div>
        <div className="px-5 py-4">Sesion</div>
        <div className="px-5 py-4">Firma formador/a</div>
        <div className="px-5 py-4">Firma trabajador/a</div>
      </div>

      <div className="divide-y divide-line">
        {rows.map((row) => (
          <div
            key={row.id_registro}
            className="grid min-h-[86px] grid-cols-[1.45fr_1fr_1fr_1fr_1fr] items-center text-[16px] text-ink max-lg:grid-cols-1 max-lg:gap-3 max-lg:px-5 max-lg:py-4"
          >
            <div className="flex min-w-0 items-center gap-3 px-5 py-4 max-lg:px-0 max-lg:py-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getDepartmentColor(row.id_departamento) }}
              />
              <span className="[overflow-wrap:anywhere]">{row.departamento}</span>
            </div>
            <div className="px-5 py-4 max-lg:px-0 max-lg:py-0">
              {row.delegado || row.responsable || "-"}
            </div>
            <div className="whitespace-pre-line px-5 py-4 max-lg:px-0 max-lg:py-0">
              {formatSession(row) || "-"}
            </div>
            <div className="px-5 py-4 max-lg:px-0 max-lg:py-0">
              <SignatureStatus
                signed={Boolean(row.firma_formador || row.fecha_firma_formador)}
                date={row.fecha_firma_formador}
              />
            </div>
            <div className="flex items-center gap-3 px-5 py-4 max-lg:px-0 max-lg:py-0">
              {row.firma_empleado || row.fecha_firma_empleado ? (
                <SignatureStatus signed date={row.fecha_firma_empleado} />
              ) : (
                <button
                  type="button"
                  onClick={() => onSign(row)}
                  className="rounded-lg border border-ink bg-ink px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#2b2948]"
                >
                  Firmar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccessPage() {
  const empleadoId = getAccesoId();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(empleadoId));
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showResumen, setShowResumen] = useState(false);

  useEffect(() => {
    if (!empleadoId) return;

    const controller = new AbortController();

    async function loadFormaciones() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/formaciones/${empleadoId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        setRows(Array.isArray(data) ? data.map(normalizeFormacion) : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error al cargar formaciones", err);
          setError("No se han podido cargar las formaciones.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadFormaciones();

    return () => controller.abort();
  }, [empleadoId]);

  const employeeName = rows[0]?.empleado || "Empleado";
  const signedCount = rows.filter(
    (row) => row.firma_empleado || row.fecha_firma_empleado
  ).length;

  function handleSaved(updated, signature) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id_registro === updated.id_registro
          ? normalizeFormacion({
              ...row,
              ...updated,
              firma_empleado: signature,
              fecha_firma_empleado:
                updated.fecha_firma_empleado ||
                new Date().toISOString().slice(0, 10),
            })
          : row
      )
    );
  }

  return (
    <main className="min-h-screen bg-white px-1 py-6 text-ink sm:px-5">
      <section className="mx-auto w-full max-w-[1760px]">
        <h1 className="mb-8 text-2xl font-semibold text-ink">Formaciones</h1>

        {!empleadoId && (
          <p className="rounded-lg border border-line bg-white p-5 text-[15px] text-muted">
            Falta el identificador del empleado en la URL. Usa /acceso/id.
          </p>
        )}

        {loading && (
          <p className="text-[15px] font-medium text-muted">
            Cargando formaciones...
          </p>
        )}

        {error && <p className="text-[15px] font-medium text-red-700">{error}</p>}

        {!loading && !error && empleadoId && (
          <div className="rounded-xl border border-line bg-slate-50/60 p-5 shadow-sm">
            <section className="overflow-hidden rounded-lg border border-line bg-white">
              <header className="flex items-center justify-between gap-4 px-5 py-5 max-sm:flex-col max-sm:items-start">
                <button
                  type="button"
                  onClick={() => setIsOpen((value) => !value)}
                  className="flex min-w-0 items-center gap-3 text-left text-[18px] font-semibold text-ink"
                >
                  <span className="text-xl leading-none">{isOpen ? "v" : ">"}</span>
                  <span className="[overflow-wrap:anywhere]">{employeeName}</span>
                </button>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowResumen(true)}
                    className="rounded-md border border-ink bg-white px-3 py-1.5 text-sm font-medium text-ink"
                  >
                    Ver Resumen
                  </button>
                  <span className="text-[16px] font-medium text-ink">
                    {signedCount}/{rows.length}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 rounded-full border-[3px] border-emerald-700"
                  />
                </div>
              </header>

              {isOpen &&
                (rows.length > 0 ? (
                  <FormacionesTable rows={rows} onSign={setSelectedRow} />
                ) : (
                  <p className="border-t border-line px-5 py-5 text-[15px] text-muted">
                    No hay formaciones disponibles.
                  </p>
                ))}
            </section>
          </div>
        )}
      </section>

      <FirmaModal
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onSaved={handleSaved}
      />
      {showResumen && (
        <ResumenModal
          rows={rows}
          employeeName={employeeName}
          onClose={() => setShowResumen(false)}
        />
      )}
    </main>
  );
}

function DocumentsPage() {
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

export default function App() {
  if (window.location.pathname.startsWith("/acceso")) {
    return <AccessPage />;
  }

  return <DocumentsPage />;
}
