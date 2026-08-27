import { formatDate } from "../../utils/dates";

export function SignatureStatus({ signed, date }) {
  if (!signed) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[13px] font-semibold text-amber-700 ring-1 ring-amber-200">
        Pendiente
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold leading-none text-emerald-700 ring-1 ring-emerald-200">
        Firmado
      </span>
      {date && <span className="text-[14px] text-slate-600">{formatDate(date)}</span>}
    </div>
  );
}
