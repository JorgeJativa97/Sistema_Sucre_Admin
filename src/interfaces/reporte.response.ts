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
