export interface ReporteResponse {
    cedula:    string;
    nombre:    string;
    ciu:       number;
    emision:   string;
    interes:   string;
    coactiva:  string;
    recargo:   string;
    descuento: string;
    iva:       string;
    total:     string;
}

export interface CarteraVencidaImpuestoResponse {
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

export interface CarteraVencidaTitulo {
    CODIGO:      number;
    DESCRIPCION: string;
}

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

// Respuesta cuando se inicia un job asíncrono
export interface AsyncJobResponse {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  message: string;
}

// Respuesta al consultar el estado de un job
export interface AsyncJobStatusResponse {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress?: number;
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


// Tipo unión para manejar ambas respuestas
export type ReporteUnionResponse = ReporteResponse | CarteraVencidaImpuestoResponse | CarteraVencidaTituloDetalleresponse;
