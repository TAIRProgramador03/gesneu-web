// Se importa con mayúscula inicial porque es un constructor: el nombre que
// publica la librería (`jsPDF`) hace saltar la regla new-cap de ESLint.
import { jsPDF as JsPDF } from 'jspdf';

import type { ReporteCambioS60 } from '@/api/Neumaticos';

/**
 * REPORTE DE INSPECCION / CAMBIO DE NEUMÁTICOS — FR-OP-03 v01.
 *
 * Es una RÉPLICA del formato en papel, no un diseño nuevo: mismas cajas,
 * mismos rótulos, mismo orden y la misma hoja horizontal. Lo que hoy se
 * llena a mano sale ya impreso con los datos de la S60, y lo que Gesneu no
 * sabe queda en blanco dentro de su casilla, para escribirlo encima.
 *
 * Por eso está dibujado con líneas y texto en vez de con una librería de
 * tablas: el formato es una grilla fija de 7 posiciones (1 a 6 y R) con
 * celdas de ancho dado. Una tabla que se auto-ajusta no lo reproduce.
 *
 * TODAS las medidas son milímetros sobre A4 horizontal (297 × 210).
 */

/** Lo que el reporte sabe del vehículo. Todo opcional: la S60 manda. */
export interface VehiculoReporte {
    PLACA?: string;
    MARCA?: string;
    MODELO?: string;
    TIPO?: string;
    OPERACION?: string;
    PROYECTO?: string;
    TALLER?: string;
    KILOMETRO?: number | string;
}

const NEGRO: [number, number, number] = [0, 0, 0];

/** Hoja A4 horizontal. */
const ANCHO = 297;
const ALTO = 210;
const M = 8;

/* Columna izquierda y derecha del cuerpo. */
const IZQ_X = M;
const IZQ_FIN = 140;
const DER_X = 143;
const DER_FIN = ANCHO - M;

/** Las 7 filas del formato: 6 posiciones de rodaje y el repuesto. */
const FILAS_FORMATO = ['1', '2', '3', '4', '5', '6', 'R'];

const ALTO_FILA = 6.5;

/** Ancho ÷ alto de `public/assets/tair_renting.png` (150 × 96 px). */
const LOGO_PROPORCION = 150 / 96;

const texto = (valor: unknown): string => {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
};

/* =====================================================================
 * Primitivas de dibujo
 * ===================================================================== */

function caja(doc: JsPDF, x: number, y: number, w: number, h: number) {
    doc.setDrawColor(...NEGRO);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h);
}

/** Texto centrado dentro de una caja, vertical y horizontalmente. */
function centrado(doc: JsPDF, x: number, y: number, w: number, h: number, t: string, tam = 7.5, negrita = true) {
    if (!t) return;
    doc.setFont('helvetica', negrita ? 'bold' : 'normal');
    doc.setFontSize(tam);
    doc.setTextColor(...NEGRO);
    doc.text(t, x + w / 2, y + h / 2 + tam * 0.12, { align: 'center', maxWidth: w - 2 });
}

/** Texto alineado a la izquierda, con el mismo centrado vertical. */
function izquierda(doc: JsPDF, x: number, y: number, h: number, t: string, tam = 7.5, negrita = false) {
    if (!t) return;
    doc.setFont('helvetica', negrita ? 'bold' : 'normal');
    doc.setFontSize(tam);
    doc.setTextColor(...NEGRO);
    doc.text(t, x, y + h / 2 + tam * 0.12);
}

/** Caja con rótulo centrado: el "N° O.C.", "PROYECTO", etc. del formato. */
function rotulo(doc: JsPDF, x: number, y: number, w: number, h: number, t: string, tam = 7.5) {
    caja(doc, x, y, w, h);
    centrado(doc, x, y, w, h, t, tam, true);
}

/** Caja de dato: el rótulo va en su propia caja, aquí sólo el valor. */
function dato(doc: JsPDF, x: number, y: number, w: number, h: number, t: string, tam = 8) {
    caja(doc, x, y, w, h);
    centrado(doc, x, y, w, h, t, tam, false);
}

/**
 * Tamaño de letra para un nombre sobre la raya de firma.
 *
 * El hueco da para unos 26 caracteres a 7 pt. Un nombre completo con dos
 * apellidos se pasa, así que por encima de eso se achica en vez de salirse
 * del recuadro.
 */
function tamNombre(nombre: string | null): number {
    const largo = (nombre ?? '').trim().length;
    if (largo > 34) return 5.5;
    if (largo > 26) return 6.3;
    return 7;
}

/** El cuadrito de "INSTALACION ☑ / INSPECCION ☐", marcado con una palomita. */
function casilla(doc: JsPDF, x: number, y: number, lado: number, marcada: boolean) {
    caja(doc, x, y, lado, lado);
    if (!marcada) return;
    // Palomita: el trazo corto baja hasta el vértice y el largo sube a la
    // derecha. Se dibuja en dos líneas porque jsPDF no tiene polilínea.
    doc.setLineWidth(0.5);
    doc.line(x + lado * 0.2, y + lado * 0.5, x + lado * 0.42, y + lado * 0.76);
    doc.line(x + lado * 0.42, y + lado * 0.76, x + lado * 0.82, y + lado * 0.2);
}

/**
 * La rayita diagonal con la que se marcan las casillas de la inspección
 * (TV, CL, CP, PR) en el formato de papel.
 */
function diagonal(doc: JsPDF, x: number, y: number, w: number, h: number) {
    doc.setDrawColor(...NEGRO);
    doc.setLineWidth(0.4);
    doc.line(x + w * 0.25, y + h * 0.78, x + w * 0.75, y + h * 0.22);
}

/* =====================================================================
 * Reglas del formato
 * ===================================================================== */

/**
 * A qué fila del formato va una posición.
 *
 * POS01..POS06 van a 1..6 y el repuesto a R. Una posición que no entre en
 * ese molde —un RES02 de camioneta de 6, por ejemplo— devuelve null y se
 * imprime en una fila extra al pie de la tabla, con su código real: antes
 * perder el cuadriculado que perder el neumático.
 */
function filaDePosicion(posicion: string | null): string | null {
    if (!posicion) return null;
    const limpia = posicion.trim().toUpperCase();

    const rodaje = /^POS0?([1-6])$/.exec(limpia);
    if (rodaje) return rodaje[1];

    if (limpia === 'RES01' || limpia === 'RES' || limpia === 'R') return 'R';
    return null;
}

/**
 * Las filas de MOTIVO DE CAMBIO.
 *
 * No son las cuatro del papel viejo: son los cinco tipos de baja que ofrece
 * el modal de desasignación, más "Recuperado". Un neumático sale por una de
 * dos acciones: baja definitiva —y ahí se elige el tipo— o recuperado, que
 * no tiene tipo que elegir y por eso es una fila propia.
 */
const MOTIVOS = [
    'Desgaste normal',
    'Desgaste irregular',
    'Recobro',
    'Siniestro',
    'Falla de fábrica',
    'Recuperado',
];

/**
 * Qué casilla de MOTIVO DE CAMBIO marcar.
 *
 * Si la salida fue un recuperado se marca esa fila y se acabó: ese flujo no
 * pide tipo de baja. Si fue baja definitiva, manda el tipo elegido.
 *
 * Un tipo que no esté en la lista NO se marca: antes caía en "Desgaste
 * normal" por defecto y eso es inventar un motivo. Mejor la casilla vacía,
 * que se llena a mano.
 */
function motivoDeCambio(tipoBaja: string | null, accion: string | null): number | null {
    if ((accion ?? '').toUpperCase().includes('RECUPERAD')) {
        return MOTIVOS.indexOf('Recuperado');
    }

    const t = (tipoBaja ?? '').toUpperCase().trim();
    if (t === '') return null;
    if (t.includes('IRREGULAR')) return 1;
    if (t.includes('RECOBRO')) return 2;
    if (t.includes('SINIESTRO')) return 3;
    if (t.includes('FALLA') || t.includes('FABRICA') || t.includes('FÁBRICA')) return 4;
    if (t.includes('NORMAL')) return 0;
    return null;
}

/** El logo, como dataURL. Si falla, el formato sale igual sin él. */
async function cargarLogo(): Promise<string | null> {
    try {
        const respuesta = await fetch('/assets/tair_renting.png');
        if (!respuesta.ok) return null;
        const blob = await respuesta.blob();
        return await new Promise<string | null>((resolver) => {
            const lector = new FileReader();
            lector.onloadend = () => resolver(typeof lector.result === 'string' ? lector.result : null);
            lector.onerror = () => resolver(null);
            lector.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/* =====================================================================
 * Las piezas del formato
 * ===================================================================== */

function dibujarEncabezado(doc: JsPDF, logo: string | null) {
    const y = M;
    const h = 18;

    caja(doc, IZQ_X, y, 52, h);
    if (logo) {
        try {
            // Se calcula el ancho a partir del alto para RESPETAR la
            // proporción del PNG (150 × 96). Antes iba fijo a 42 × 13, que
            // es casi el triple de ancho que alto: el logo salía estirado.
            const altoLogo = h - 5;
            const anchoLogo = altoLogo * LOGO_PROPORCION;
            doc.addImage(logo, 'PNG', IZQ_X + (52 - anchoLogo) / 2, y + 2.5, anchoLogo, altoLogo);
        } catch {
            // Un logo que no se pudo dibujar no justifica quedarse sin reporte.
        }
    }

    caja(doc, IZQ_X + 52, y, 145, h);
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(13);
    doc.setTextColor(...NEGRO);
    // El papel dice "REPORTE DE INSPECCION / CAMBIO DE NEUMÁTICOS" porque el
    // mismo formato servía para las dos cosas. Este reporte sale sólo de una
    // S60, que siempre es un cambio, así que el título va sin la parte de
    // inspección.
    doc.text('CAMBIO DE NEUMÁTICO', IZQ_X + 52 + 145 / 2, y + h / 2 + 1.5, {
        align: 'center',
    });

    // Código / versión / fecha de aprobación: son del formato, no del dato.
    const xCab = IZQ_X + 52 + 145;
    const anchoCab = DER_FIN - xCab;
    const anchoRot = anchoCab * 0.62;
    const filas: [string, string][] = [
        ['Codigo', 'FR-OP-03'],
        ['Versión', '01'],
        ['Fecha de aprobacion', '17/05/2019'],
    ];
    filas.forEach(([rot, val], i) => {
        const yf = y + (h / 3) * i;
        rotulo(doc, xCab, yf, anchoRot, h / 3, rot, 7);
        dato(doc, xCab + anchoRot, yf, anchoCab - anchoRot, h / 3, val, 7.5);
    });
}

function dibujarDatosVehiculo(doc: JsPDF, reporte: ReporteCambioS60, vehiculo: VehiculoReporte | undefined) {
    const h = 7.5;
    let y = 28;

    // Donde el papel dice "N° O.C." aquí va el número de vale, que es el
    // comprobante de la S60: la orden de compra no existe en Gesneu y el
    // vale sí identifica el movimiento. La O.T. sale de la cabecera de esa
    // misma S60 en el ERP, y si no se encuentra queda vacía.
    rotulo(doc, IZQ_X, y, 32, h, 'N°  Vale');
    dato(doc, IZQ_X + 32, y, 34, h, String(reporte.comprobante));
    rotulo(doc, IZQ_X + 66, y, 32, h, 'N°  O. T.');
    dato(doc, IZQ_X + 98, y, IZQ_FIN - (IZQ_X + 98), h, texto(reporte.ot));

    y += h + 1.5;
    const mitad = (IZQ_FIN - IZQ_X) / 2;
    rotulo(doc, IZQ_X, y, mitad, h, 'PROYECTO');
    rotulo(doc, IZQ_X + mitad, y, mitad, h, 'ZONA DE OPERACION');
    y += h;
    // PROYECTO lleva el TALLER del vehículo, no el campo PROYECTO: así lo
    // usa Tair en el formato. ZONA DE OPERACION sí es la operación.
    dato(doc, IZQ_X, y, mitad, h, texto(vehiculo?.TALLER ?? reporte.taller).toUpperCase());
    dato(doc, IZQ_X + mitad, y, mitad, h, texto(vehiculo?.OPERACION).toUpperCase());

    // Fecha partida en día / mes / año, como el formato.
    y += h + 1.5;
    const [dia = '', mes = '', anio = ''] = reporte.fechaTexto.split('/');
    // El tipo sale de PO_VEHICULO.RECMEN2, que viaja en el reporte. El TIPO
    // que trae la búsqueda de placas es otro catálogo (PO_TIPO) y sólo se
    // usa si el primero no resolvió.
    rotulo(doc, IZQ_X, y, 24, h, 'Vehiculo', 7);
    dato(doc, IZQ_X + 24, y, 42, h, texto(reporte.tipoVehiculo ?? vehiculo?.TIPO));
    rotulo(doc, IZQ_X + 66, y, 26, h, 'Fecha', 7);
    const anchoFecha = (IZQ_FIN - (IZQ_X + 92)) / 3;
    dato(doc, IZQ_X + 92, y, anchoFecha, h, dia);
    dato(doc, IZQ_X + 92 + anchoFecha, y, anchoFecha, h, mes);
    dato(doc, IZQ_X + 92 + anchoFecha * 2, y, anchoFecha, h, anio.slice(-2));

    // La placa ocupa el alto de Ubicación + Km, igual que en el papel.
    y += h + 1.5;
    rotulo(doc, IZQ_X, y, 24, h * 2, 'Placa', 7);
    dato(doc, IZQ_X + 24, y, 42, h * 2, reporte.placa || texto(vehiculo?.PLACA), 10);
    rotulo(doc, IZQ_X + 66, y, 26, h, 'Ubicación', 7);
    dato(doc, IZQ_X + 92, y, IZQ_FIN - (IZQ_X + 92), h, texto(reporte.taller ?? vehiculo?.TALLER));
    rotulo(doc, IZQ_X + 66, y + h, 26, h, 'Km.', 7);
    dato(
        doc,
        IZQ_X + 92,
        y + h,
        IZQ_FIN - (IZQ_X + 92),
        h,
        reporte.odometro !== null ? String(reporte.odometro) : texto(vehiculo?.KILOMETRO)
    );

    // Las horas salen de la O.T. (inicio y fin). Si la O.T. no las tiene
    // cargadas, la casilla queda vacía para escribirla a mano.
    y += h * 2 + 1.5;
    rotulo(doc, IZQ_X, y, 34, h, 'Hr. Ingreso Taller', 7);
    dato(doc, IZQ_X + 34, y, 32, h, texto(reporte.horaIngreso), 7.5);
    rotulo(doc, IZQ_X + 66, y, 34, h, 'Hr. Salida de Taller', 7);
    dato(doc, IZQ_X + 100, y, IZQ_FIN - (IZQ_X + 100), h, texto(reporte.horaSalida), 7.5);

    return y + h + 2;
}

function dibujarMotivoDeCambio(doc: JsPDF, y: number, reporte: ReporteCambioS60) {
    const ancho = IZQ_FIN - IZQ_X;
    const hTitulo = 6;
    // 6.5 y no 7.5: ahora son seis motivos y no cuatro, y el bloque tiene
    // que seguir terminando antes que la tabla de retirados de la derecha.
    const hFila = 6.5;
    const anchoRot = 46;
    const anchoCol = (ancho - anchoRot) / FILAS_FORMATO.length;

    rotulo(doc, IZQ_X, y, ancho, hTitulo, 'MOTIVO DE CAMBIO', 8);

    let yf = y + hTitulo;
    rotulo(doc, IZQ_X, yf, anchoRot, hFila, 'POSICIONES', 7);
    FILAS_FORMATO.forEach((etiqueta, i) => {
        rotulo(doc, IZQ_X + anchoRot + anchoCol * i, yf, anchoCol, hFila, etiqueta, 7);
    });

    // Qué casilla marcar en cada posición, según el tipo de baja.
    const marcas = new Map<string, number>();
    reporte.lineas.forEach((l) => {
        const fila = filaDePosicion(l.sale.posicion ?? l.posicion);
        const motivo = motivoDeCambio(l.sale.tipoBaja, l.sale.accion);
        if (fila && motivo !== null) marcas.set(fila, motivo);
    });

    MOTIVOS.forEach((motivo, fila) => {
        yf += hFila;
        caja(doc, IZQ_X, yf, anchoRot, hFila);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...NEGRO);
        doc.text(motivo, IZQ_X + 1.5, yf + hFila / 2 + 0.9);

        FILAS_FORMATO.forEach((etiqueta, i) => {
            const x = IZQ_X + anchoRot + anchoCol * i;
            caja(doc, x, yf, anchoCol, hFila);
            if (marcas.get(etiqueta) === fila) {
                centrado(doc, x, yf, anchoCol, hFila, 'X', 9, true);
            }
        });
    });

    return yf + hFila;
}

/** Dibuja una de las dos tablas de neumáticos y devuelve dónde termina. */
function dibujarTabla(
    doc: JsPDF,
    y: number,
    columnas: { titulo: string; ancho: number }[],
    valores: Map<string, string[]>,
    extras: string[][],
    /**
     * Columna que se marca con una rayita diagonal en las filas que tienen
     * neumático. Es la de TV (tapa de válvula): se monta con tapa siempre,
     * así que en el papel se marca en todas las posiciones instaladas.
     */
    columnaDiagonal?: number
) {
    const hCab = 6.5;
    let x = DER_X;

    columnas.forEach((c) => {
        rotulo(doc, x, y, c.ancho, hCab, c.titulo, 7);
        x += c.ancho;
    });

    let yf = y + hCab;
    const pintarFila = (etiqueta: string, celdas: string[]) => {
        // La primera celda de datos es el código: si está vacía, la posición
        // no entró en este cambio y la fila va en blanco.
        const tieneNeumatico = (celdas[0] ?? '').trim() !== '';
        let xf = DER_X;
        columnas.forEach((c, i) => {
            caja(doc, xf, yf, c.ancho, ALTO_FILA);
            const contenido = i === 0 ? etiqueta : (celdas[i - 1] ?? '');
            centrado(doc, xf, yf, c.ancho, ALTO_FILA, contenido, i === 0 ? 7.5 : 7, i === 0);
            if (i === columnaDiagonal && tieneNeumatico) {
                diagonal(doc, xf, yf, c.ancho, ALTO_FILA);
            }
            xf += c.ancho;
        });
        yf += ALTO_FILA;
    };

    FILAS_FORMATO.forEach((etiqueta) => pintarFila(etiqueta, valores.get(etiqueta) ?? []));
    // Las posiciones que no entran en el molde 1-6/R, al pie y con su código.
    extras.forEach(([etiqueta, ...celdas]) => pintarFila(etiqueta, celdas));

    return yf;
}

/* =====================================================================
 * El reporte completo
 * ===================================================================== */

export async function descargarReporteCambio(
    reporte: ReporteCambioS60,
    vehiculo?: VehiculoReporte
): Promise<string> {
    const doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const logo = await cargarLogo();

    dibujarEncabezado(doc, logo);
    const yTrasDatos = dibujarDatosVehiculo(doc, reporte, vehiculo);
    const yIzq = dibujarMotivoDeCambio(doc, yTrasDatos, reporte);

    /* ---- TIPO DE TRABAJO -------------------------------------------- */
    const hTipo = 7.5;
    let yDer = 28;
    caja(doc, DER_X, yDer, DER_FIN - DER_X, hTipo);
    izquierda(doc, DER_X + 2, yDer, hTipo, 'TIPO DE TRABAJO:', 8, true);

    const xInst = DER_X + 50;
    izquierda(doc, xInst, yDer, hTipo, 'INSTALACION', 8, true);
    casilla(doc, xInst + 26, yDer + 1.2, 5, true);

    const xInsp = DER_X + 100;
    izquierda(doc, xInsp, yDer, hTipo, 'INSPECCION', 8, true);
    casilla(doc, xInsp + 24, yDer + 1.2, 5, false);

    yDer += hTipo;

    /* ---- Tabla de instalación ---------------------------------------- */
    // Los anchos suman exactamente los 146 mm de la columna derecha. Las
    // cuatro últimas no bajan de 6 mm: con 5 el rótulo se partía en dos
    // líneas y quedaba "T/V" en vertical.
    const colsInstalacion = [
        { titulo: 'Pos.', ancho: 10 },
        { titulo: 'Código', ancho: 25 },
        { titulo: 'Marca', ancho: 25 },
        { titulo: 'Medida', ancho: 23 },
        { titulo: 'Modelo', ancho: 16 },
        { titulo: 'Rem', ancho: 10 },
        { titulo: 'Presión', ancho: 13 },
        { titulo: 'TV', ancho: 6 },
        { titulo: 'CL', ancho: 6 },
        { titulo: 'CP', ancho: 6 },
        { titulo: 'PR', ancho: 6 },
    ];

    /* Arriba va el JUEGO COMPLETO que quedó montado, no sólo lo que entró:
       los nuevos más los que nadie tocó. Es lo que se quiere ver del
       vehículo "en ese momento".

       Se arma en dos capas y el orden importa:
         1. `montados`, que es una RECONSTRUCCIÓN del historial y puede tener
            huecos si a los movimientos les falta una fila.
         2. encima, los entrantes de la S60, que sí son dato cierto.
       Así lo seguro pisa a lo reconstruido y nunca al revés.

       TV/CL/CP/PR van vacías: Gesneu no registra esos hallazgos. */
    const instalados = new Map<string, string[]>();
    // Mapa y no lista: una posición fuera del molde 1-6/R puede llegar por
    // las dos capas y no debe salir dos veces.
    const extraPorPosicion = new Map<string, string[]>();

    const celdasInstalado = (n: {
        codigo: string; marca: string | null; medida: string | null;
        diseno: string | null; remanente: number | null; presion: number | null;
    }) => [
        n.codigo,
        texto(n.marca),
        texto(n.medida),
        texto(n.diseno),
        n.remanente !== null ? `${n.remanente}mm` : '',
        n.presion !== null ? `${n.presion}psi` : '',
        '', '', '', '',
    ];

    const colocar = (posicion: string | null, celdas: string[]) => {
        const fila = filaDePosicion(posicion);
        if (fila) instalados.set(fila, celdas);
        else extraPorPosicion.set(texto(posicion) || '—', celdas);
    };

    (reporte.montados ?? []).forEach((n) => colocar(n.posicion, celdasInstalado(n)));
    reporte.lineas.forEach((l) => colocar(l.entra.posicion ?? l.posicion, celdasInstalado(l.entra)));

    const instaladosExtra = [...extraPorPosicion.entries()].map(([pos, celdas]) => [pos, ...celdas]);

    // El 7 es la columna TV, la primera de las cuatro de inspección.
    const yTablaInst = dibujarTabla(doc, yDer, colsInstalacion, instalados, instaladosExtra, 7);

    /* ---- Tabla de retirados ------------------------------------------ */
    let yRet = yTablaInst + 3;
    const anchoDer = DER_FIN - DER_X;
    rotulo(doc, DER_X, yRet, anchoDer, 6, 'NEUMÁTICOS RETIRADOS', 8);
    yRet += 6;

    const colsRetirados = [
        { titulo: 'Pos.', ancho: 10 },
        { titulo: 'Código', ancho: 26 },
        { titulo: 'Marca', ancho: 32 },
        { titulo: 'Medida', ancho: 26 },
        { titulo: 'Modelo', ancho: 18 },
        // 18 mm, no 14: "Remanente" no entraba y se cortaba en dos líneas.
        { titulo: 'Remanente', ancho: 18 },
        { titulo: 'Presión', ancho: 16 },
    ];

    const retirados = new Map<string, string[]>();
    const retiradosExtra: string[][] = [];
    reporte.lineas.forEach((l) => {
        const celdas = [
            l.sale.codigo,
            texto(l.sale.marca),
            texto(l.sale.medida),
            texto(l.sale.diseno),
            l.sale.remanente !== null ? `${l.sale.remanente}mm` : '',
            l.sale.presion !== null ? `${l.sale.presion}psi` : '',
        ];
        const fila = filaDePosicion(l.sale.posicion ?? l.posicion);
        if (fila) retirados.set(fila, celdas);
        else retiradosExtra.push([texto(l.sale.posicion ?? l.posicion) || '—', ...celdas]);
    });

    const yTablaRet = dibujarTabla(doc, yRet, colsRetirados, retirados, retiradosExtra);

    /* ---- Observaciones ------------------------------------------------ */
    let y = Math.max(yIzq, yTablaRet) + 3;
    const anchoTotal = DER_FIN - IZQ_X;
    const hObs = 17;
    caja(doc, IZQ_X, y, anchoTotal, hObs);
    izquierda(doc, IZQ_X + 2, y, 6, 'Observaciones y/o recomendaciones:', 7.5, false);

    if (reporte.observacion && reporte.observacion.trim() !== '') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize(reporte.observacion.trim(), anchoTotal - 80), IZQ_X + 72, y + 4.5);
    }
    // Las rayas van siempre: el reporte se imprime y se sigue escribiendo.
    doc.setLineWidth(0.2);
    for (let i = 1; i <= 3; i++) {
        const yl = y + 4 + i * 4;
        doc.line(IZQ_X + 70, yl, DER_FIN - 2, yl);
    }

    /* ---- Leyenda y firmas --------------------------------------------- */
    y += hObs + 3;
    const hFirma = ALTO - M - y;

    const anchoFirma = 78;
    const anchoLeyenda = 70;
    const xLeyenda = IZQ_X + (anchoTotal - anchoLeyenda) / 2;

    // Firma del técnico
    doc.setDrawColor(...NEGRO);
    doc.setLineWidth(0.3);
    doc.roundedRect(IZQ_X + 6, y, anchoFirma, hFirma, 2, 2);
    centrado(doc, IZQ_X + 6, y, anchoFirma, 7, 'V° B° Tecnico', 8, false);
    doc.setLineWidth(0.2);
    doc.line(IZQ_X + 14, y + hFirma - 12, IZQ_X + 6 + anchoFirma - 8, y + hFirma - 12);
    centrado(doc, IZQ_X + 6, y + hFirma - 12, anchoFirma, 6, 'FIRMA', 7, false);
    // El mecánico de la O.T. firma como técnico. El nombre va impreso ENCIMA
    // de la raya, no sobre ella: con el `-7` de antes la línea lo tachaba.
    // La firma sigue siendo a mano.
    izquierda(doc, IZQ_X + 12, y + hFirma - 8.5, 6, 'Nombre:', 7.5, false);
    doc.line(IZQ_X + 26, y + hFirma - 3.5, IZQ_X + 6 + anchoFirma - 6, y + hFirma - 3.5);
    izquierda(doc, IZQ_X + 27, y + hFirma - 8.5, 6, texto(reporte.mecanico), tamNombre(reporte.mecanico), false);

    // Leyenda: es parte del formato, no un dato.
    const hLeyendaFila = (hFirma - 6) / 4;
    centrado(doc, xLeyenda, y, anchoLeyenda, 6, 'LEYENDA', 9, false);
    const leyenda: [string, string][] = [
        ['TV', 'Tapa Válvula'],
        ['CL', 'Corte Leve'],
        ['CP', 'Corte peligroso'],
        ['PR', 'Protuberancia'],
    ];
    leyenda.forEach(([sigla, significado], i) => {
        const yl = y + 6 + hLeyendaFila * i;
        rotulo(doc, xLeyenda, yl, 14, hLeyendaFila, sigla, 7.5);
        caja(doc, xLeyenda + 14, yl, anchoLeyenda - 14, hLeyendaFila);
        izquierda(doc, xLeyenda + 16, yl, hLeyendaFila, significado, 7.5, false);
    });

    // Firma del supervisor
    const xSup = DER_FIN - 6 - anchoFirma;
    doc.setLineWidth(0.3);
    doc.roundedRect(xSup, y, anchoFirma, hFirma, 2, 2);
    centrado(doc, xSup, y, anchoFirma, 7, 'V° B° Supervisor de Operaciones', 8, false);
    doc.setLineWidth(0.2);
    doc.line(xSup + 8, y + hFirma - 12, xSup + anchoFirma - 8, y + hFirma - 12);
    centrado(doc, xSup, y + hFirma - 12, anchoFirma, 6, 'FIRMA', 7, false);
    izquierda(doc, xSup + 6, y + hFirma - 8.5, 6, 'Nombre:', 7.5, false);
    doc.line(xSup + 20, y + hFirma - 3.5, xSup + anchoFirma - 6, y + hFirma - 3.5);
    izquierda(doc, xSup + 21, y + hFirma - 8.5, 6, texto(reporte.supervisor), tamNombre(reporte.supervisor), false);

    const nombre = `FR-OP-03_${reporte.placa}_S60-${reporte.almacen}-${reporte.comprobante}.pdf`;
    doc.save(nombre);
    return nombre;
}
