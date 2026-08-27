export function formatDate(value) {
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

export function formatSession(row) {
  const date = formatDate(row.fecha_formacion);
  const start = row.hora?.slice(0, 5);
  const end = row.hora_final?.slice(0, 5);
  const time = start && end ? `${start} - ${end}` : start || end || "";

  return [date, time].filter(Boolean).join("\n");
}
