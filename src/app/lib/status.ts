export type StatusKind = 'aprobado' | 'enComision' | 'radicado' | 'rechazado' | 'ley' | 'noticia' | 'otro';

export interface NormalizedStatus {
    kind: StatusKind;
    label: string;
}

export function normalizeStatus(raw: string | null | undefined, fallbackLabel = 'Estado'): NormalizedStatus {
    if (!raw || raw.trim() === '') {
        return { kind: 'radicado', label: fallbackLabel };
    }
    const lower = raw.toLowerCase();
    if (lower.includes('rechaz') || lower.includes('derrot')) {
        return { kind: 'rechazado', label: 'Rechazado' };
    }
    if (lower.includes('firmad') || lower.includes('convertid') || lower.includes('sancionad')) {
        return { kind: 'ley', label: 'Firmado / Ley' };
    }
    if (lower.includes('aprob')) {
        return { kind: 'aprobado', label: 'Aprobado' };
    }
    if (lower.includes('comisi') || lower.includes('vista')) {
        return { kind: 'enComision', label: 'En comisión' };
    }
    if (lower.includes('radic') || lower.includes('present')) {
        return { kind: 'radicado', label: 'Radicado' };
    }
    const trimmed = raw.trim();
    const label = trimmed.length > 24 ? `${trimmed.slice(0, 22)}…` : trimmed;
    return { kind: 'otro', label };
}
