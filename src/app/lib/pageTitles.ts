import { SourceType } from './models';

const SOURCE_TITLES: Record<SourceType, string> = {
    [SourceType.ENDI]: 'Noticias — El Nuevo Día',
    [SourceType.Vocero]: 'Noticias — El Vocero',
    [SourceType.Noticel]: 'Noticias — Noticel',
    [SourceType.Legislacion]: 'Legislación',
};

export function getSourcePageTitle(source: SourceType): string {
    return SOURCE_TITLES[source];
}

export const ROUTE_TITLES = {
    home: 'Inicio',
    feed: 'Feed',
    legislation: 'Legislación',
    storyDetail: 'Detalle de noticia',
    legislationDetail: 'Detalle de legislación',
    notification: 'Notificación',
    myProjects: 'Mis Proyectos',
    guardados: 'Guardados',
    alertas: 'Alertas',
    alertasActividad: 'Alertas · Historial',
    resumenes: 'Resúmenes IA',
} as const;

export function setDocumentTitle(pageTitle: string) {
    document.title = `${pageTitle} — Política Abierta`;
}
