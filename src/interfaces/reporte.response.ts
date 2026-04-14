// Interfaces TypeScript para las respuestas de los distintos endpoints de reportes.
// Cada interfaz mapea exactamente los campos que devuelve el backend Django.

// Respuesta del endpoint /api/ct_vencida/ - Cartera Vencida general por ciudadano
export interface ReporteResponse {
    cedula:    string;
    nombre:    string;
    ciu:       number;  // Código interno del ciudadano
    emision:   string;
    interes:   string;
    coactiva:  string;
    recargo:   string;
    descuento: string;
    iva:       string;
    total:     string;
}

// Respuesta del endpoint /api/ct_vencida_impuesto/ - Cartera Vencida agrupada por tipo de impuesto
export interface CarteraVencidaImpuestoResponse {
    COD:       number;  // Código del impuesto
    IMPUESTO:  string;  // Nombre del impuesto
    ANIO:      number;
    EMISION:   number;
    INTERES:   number;
    COACTIVA:  number;
    RECARGO:   number;
    DESCUENTO: number;
    IVA:       number;
    TOTAL:     number;
}

// Respuesta del endpoint /api/ct_vencida_titulo_detalle/ - Cartera Vencida detallada por CIU
export interface CarteraVencidaTituloDetalleresponse {
    CEDULA:    string;
    NOMBRE:    string;
    CIU:       number;
    EMISION:   number;
    INTERES:   number;
    COACTIVA:  number;
    RECARGO:   number;
    DESCUENTO: number;
    IVA:       number;
    TOTAL:     number;
}

// Estructura de cada título para el selector MultiSelectTitulos
export interface CarteraVencidaTitulo {
    CODIGO:      number;
    DESCRIPCION: string;
}

// Respuesta del endpoint /api/ct_vencida_porimpuesto/ - Cartera Vencida filtrada por títulos seleccionados
export interface CarteraVencidaPorImpuesto {
    COD:       number;
    IMPUESTO:  string;
    ANIO:      number;
    EMISION:   number;
    INTERES:   number;
    COACTIVA:  number;
    RECARGO:   number;
    DESCUENTO: number;
    IVA:       number;
    TOTAL:     number;
}

// Respuesta al iniciar un job asíncrono - contiene el task_id para hacer seguimiento
export interface AsyncJobResponse {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  message: string;
}

// Respuesta al consultar el estado de un job asíncrono
export interface AsyncJobStatusResponse {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress?: number;  // Porcentaje de avance (0-100)
  message?: string;
  result?: {
    status: string;
    year: number;
    records: number;
    file?: string;
    data?: [];
  };
  error?: string;
}

// Tipo unión que engloba todas las posibles estructuras de respuesta de reportes.
// Usado en hooks y componentes que manejan múltiples tipos de reporte.
export type ReporteUnionResponse = ReporteResponse | CarteraVencidaImpuestoResponse | CarteraVencidaTituloDetalleresponse;

// Respuesta del endpoint /api/recaudacion/datos/ - Reporte de recaudación por impuesto
export interface RecaudacionResponse {
  IMPUESTO:      string | null;
  EMISIONTITULO: number;
  INTERES:       number;
  COACTIVA:      number;
  DESCUENTO:     number;
  RECARGO:       number;
  IVA:           number;
  NRO_TITULOS:   number;
  TOTAL:         number;
}

// Respuesta del endpoint /api/recaudacion_rubro/datos/ - Reporte de recaudación por rubro
export interface RecaudacionRubroResponse {
  RUBRO: string | null;
  TOTAL: number;
}

// Respuesta del endpoint /api/recaudacion_rubro_anio_emi/datos/ - Recaudación por rubro por año de emisión
export interface RecaudacionRubroAnioEmiResponse {
  RUBRO: string | null;
  TOTAL: number;
}

// Respuesta del endpoint /api/recaudacion_rubro_anio_emi_ids/datos/
// Recaudación por rubro filtrada por año, rango de fechas e IDs de rubro (emi04codi)
export interface RecaudacionRubroAnioEmiIdsResponse {
  RUBRO: string | null;
  TOTAL: number;
}

// Respuesta del endpoint /api/rubros/ - catálogo de rubros para el MultiSelect
// EMI04CODI = ID del rubro, EMI04DESD = nombre del rubro, EMI03DES = nombre del impuesto padre
export interface RubroOption {
  EMI04CODI: number;
  EMI04DESD: string;
  EMI03DES: string;
}

// Respuesta del endpoint /api/bienes_inmuebles/ - Bienes inmuebles declarados al SRI
export interface BienesInmueblesResponse {
    tipIdent:     string;  // Tipo de identificación (R/C/P)
    idIdent:      string;  // RUC, cédula o pasaporte
    razSoc:       string;  // Nombre completo o razón social
    tipTrans:     string;  // Tipo de transacción (01-05, Tabla 2)
    otroTipTrans: string;  // Solo si tipTrans='05'
    porPropied:   string;  // Porcentaje de propiedad (ej: 100.00)
    tipBien:      string;  // Tipo de bien inmueble (01-07, Tabla 3)
    otroTipBien:  string;  // Solo si tipBien='07'
    numPred:      string;  // Número de predio
    clavCat:      string;  // Clave catastral
    avalInm:      string;  // Avalúo del terreno
    avalConst:    string;  // Avalúo área de construcción
    arTotal:      string;  // Área total en m²
    avalTotal:    string;  // Avalúo total del bien
    prov:         string;  // Código provincia SRI (3 dígitos)
    cant:         string;  // Código cantón SRI (5 dígitos)
    parr:         string;  // Código parroquia SRI (7 dígitos)
    dir:          string;  // Dirección del predio
}
