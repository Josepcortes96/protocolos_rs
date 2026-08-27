import { useState } from "react";
import { API_BASE } from "../../utils/api";
import { SignatureCanvas } from "./SignatureCanvas";

export function FirmaModal({ row, onClose, onSaved }) {
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
      <div className="w-[min(620px,calc(100vw-32px))] overflow-hidden rounded-lg bg-white shadow-2xl">
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
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Firma en el recuadro inferior y guarda para registrar esta formacion.
          </div>
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
