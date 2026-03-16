// Utilidades para la generación del archivo XML de Bienes Inmuebles
// con la estructura requerida por el SRI.

import { BienesInmueblesResponse } from "../interfaces/reporte.response";

// Datos fijos del GAD emisor
export const GAD_TIP_IDENT = "R";
export const GAD_ID_IDENT  = "1360001520001";
export const GAD_COD_OP    = "GAD";

/** Escapa caracteres especiales para producir XML válido */
function escapeXml(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Serializa un registro de bien inmueble como elemento <bienInmueble> */
function serializeBien(r: BienesInmueblesResponse): string {
  const campos: [string, string][] = [
    ["tipIdent",     r.tipIdent],
    ["idIdent",      r.idIdent],
    ["razSoc",       r.razSoc],
    ["tipTrans",     r.tipTrans],
    ["otroTipTrans", r.otroTipTrans],
    ["porPropied",   r.porPropied],
    ["tipBien",      r.tipBien],
    ["otroTipBien",  r.otroTipBien],
    ["numPred",      r.numPred],
    ["clavCat",      r.clavCat],
    ["avalInm",      r.avalInm],
    ["avalConst",    r.avalConst],
    ["arTotal",      r.arTotal],
    ["avalTotal",    r.avalTotal],
    ["prov",         r.prov],
    ["cant",         r.cant],
    ["parr",         r.parr],
    ["dir",          r.dir],
  ];

  const inner = campos
    .map(([tag, val]) => `\t\t\t<${tag}>${escapeXml(val)}</${tag}>`)
    .join("\n");

  return `\t\t<bienInmueble>\n${inner}\n\t\t</bienInmueble>`;
}

/** Construye el string XML completo a partir de los registros del backend */
export function buildBienesInmueblesXml(registros: BienesInmueblesResponse[]): string {
  const anio      = new Date().getFullYear();
  const bienesXml = registros.map(serializeBien).join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<gad>`,
    `\t<anio>${anio}</anio>`,
    `\t<tipIdent>${GAD_TIP_IDENT}</tipIdent>`,
    `\t<idIdent>${GAD_ID_IDENT}</idIdent>`,
    `\t<codigoOperativo>${GAD_COD_OP}</codigoOperativo>`,
    `\t<bienesInmuebles>`,
    bienesXml,
    `\t</bienesInmuebles>`,
    `</gad>`,
  ].join("\n");
}

/** Descarga un string como archivo en el navegador */
export function downloadXmlFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/xml" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
