import { useEffect, useState } from "react";
import { FirmaModal } from "../components/access/FirmaModal";
import { FormacionesTable } from "../components/access/FormacionesTable";
import { ResumenModal } from "../components/access/ResumenModal";
import { API_BASE, getAccesoId } from "../utils/api";
import { isEmployeeSigned, normalizeFormacion } from "../utils/formaciones";

export function AccessPage() {
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
          setError("No hay formaciones para cargar.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadFormaciones();

    return () => controller.abort();
  }, [empleadoId]);

  const employeeName = rows[0]?.empleado || "Empleado";
  const signedCount = rows.filter(isEmployeeSigned).length;

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
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-7 text-ink sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[1760px]">
        <div className="mb-7 flex items-end justify-between gap-5 max-sm:flex-col max-sm:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Acceso empleado
            </p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight text-ink">
              Formaciones
            </h1>
          </div>
        </div>

        {!empleadoId && (
          <p className="rounded-lg border border-slate-200 bg-white p-5 text-[15px] text-muted shadow-sm">
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
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <header className="flex items-center justify-between gap-4 bg-white px-6 py-5 max-sm:flex-col max-sm:items-start">
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
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-ink"
                  >
                    Ver Resumen
                  </button>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[15px] font-semibold text-ink">
                    {signedCount}/{rows.length}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 rounded-full border-[3px] border-emerald-700 bg-emerald-50"
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
