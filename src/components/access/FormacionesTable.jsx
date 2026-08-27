import { formatSession } from "../../utils/dates";
import { getDepartmentColor, isEmployeeSigned } from "../../utils/formaciones";
import { SignatureStatus } from "./SignatureStatus";

export function FormacionesTable({ rows, onSign }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] border-b border-slate-200 bg-slate-50 text-[13px] font-bold uppercase tracking-wide text-slate-500 max-lg:hidden">
        <div className="px-6 py-4">Departamento</div>
        <div className="px-6 py-4">Formador/a</div>
        <div className="px-6 py-4">Sesion</div>
        <div className="px-6 py-4">Firma trabajador/a</div>
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.id_registro}
            className="grid min-h-[92px] grid-cols-[1.6fr_1fr_1fr_1fr] items-center text-[16px] text-ink transition hover:bg-slate-50/70 max-lg:grid-cols-1 max-lg:gap-3 max-lg:px-5 max-lg:py-4"
          >
            <div className="flex min-w-0 items-center gap-3 px-6 py-4 max-lg:px-0 max-lg:py-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getDepartmentColor(row.id_departamento) }}
              />
              <span className="[overflow-wrap:anywhere] font-medium">
                {row.departamento}
              </span>
            </div>
            <div className="px-6 py-4 text-slate-700 max-lg:px-0 max-lg:py-0">
              {row.delegado || row.responsable || "-"}
            </div>
            <div className="whitespace-pre-line px-6 py-4 text-slate-700 max-lg:px-0 max-lg:py-0">
              {formatSession(row) || "-"}
            </div>
            <div className="flex items-center gap-3 px-6 py-4 max-lg:px-0 max-lg:py-0">
              {isEmployeeSigned(row) ? (
                <SignatureStatus signed date={row.fecha_firma_empleado} />
              ) : (
                <button
                  type="button"
                  onClick={() => onSign(row)}
                  className="rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
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
