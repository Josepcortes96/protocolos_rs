import { fixMojibake } from "./text";

export function normalizeFormacion(row) {
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

export function getDepartmentColor(id) {
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

export function isEmployeeSigned(row) {
  return Boolean(row.firma_empleado || row.fecha_firma_empleado);
}
