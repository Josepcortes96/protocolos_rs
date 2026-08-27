import { DocumentIcon } from "./DocumentIcon";

export function DocumentCard({ info, onView }) {
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
