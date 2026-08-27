import { useEffect, useMemo, useState } from "react";
import { DocumentCard } from "../components/documents/DocumentCard";
import { DocumentModal } from "../components/documents/DocumentModal";
import { getInformacionEndpoint } from "../utils/api";
import { groupInformaciones, normalizeInfo } from "../utils/informacion";

const INFORMACION_ENDPOINT = getInformacionEndpoint();

export function DocumentsPage() {
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

      <DocumentModal info={selectedInfo} onClose={() => setSelectedInfo(null)} />
    </main>
  );
}
