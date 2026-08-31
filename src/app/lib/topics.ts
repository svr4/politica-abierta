export const TOPIC_KEYWORDS: { topic: string; keywords: string[] }[] = [
    { topic: 'Vivienda', keywords: ['vivienda', 'permiso', 'construcción', 'construccion', 'alquiler', 'hipoteca'] },
    { topic: 'Presupuesto', keywords: ['presupuesto', 'hacienda', 'fondos', 'asignación', 'asignacion', 'fiscal'] },
    { topic: 'Transparencia', keywords: ['transparencia', 'contrato', 'contratos', 'ética', 'etica', 'corrupción', 'corrupcion'] },
    { topic: 'Salud', keywords: ['salud', 'hospital', 'médic', 'medic', 'aseguradora'] },
    { topic: 'Economía', keywords: ['economía', 'economia', 'empleo', 'negocio', 'comercio', 'industria'] },
    { topic: 'Educación', keywords: ['educación', 'educacion', 'escuela', 'universidad', 'maestro'] },
];

export function assignTopic(text: string): string {
    const lower = text.toLowerCase();
    for (const entry of TOPIC_KEYWORDS) {
        if (entry.keywords.some((k) => lower.includes(k))) {
            return entry.topic;
        }
    }
    return 'Sin clasificar';
}
