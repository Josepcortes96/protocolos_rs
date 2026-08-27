import { formatSession } from "../../utils/dates";
import { isEmployeeSigned } from "../../utils/formaciones";
import { SignatureStatus } from "./SignatureStatus";

export function ResumenModal({ rows, employeeName, onClose }) {
  if (!rows) return null;

  const signed = rows.filter(isEmployeeSigned).length;
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
                  signed={isEmployeeSigned(row)}
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
