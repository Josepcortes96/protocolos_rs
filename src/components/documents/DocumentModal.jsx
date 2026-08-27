import { PdfViewer } from "./PdfViewer";

export function DocumentModal({ info, onClose }) {
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
            x
          </button>
        </header>
        <PdfViewer url={info.url_informacion} title={info.titulo} />
      </div>
    </div>
  );
}
