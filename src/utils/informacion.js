import { fixMojibake } from "./text";

export function normalizeInfo(info) {
  return {
    ...info,
    titulo: fixMojibake(info.titulo || "Documento sin titulo"),
    descripcion: fixMojibake(info.descripcion || "Sin descripcion"),
    grupo: fixMojibake(info.grupo || "Sin grupo"),
  };
}

export function groupInformaciones(items) {
  return items.reduce((groups, item) => {
    const groupName = item.grupo || "Sin grupo";
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(item);
    return groups;
  }, {});
}
