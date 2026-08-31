import { normalizeStatus, StatusKind } from '../../lib/status';

const kindPill: Record<StatusKind, string> = {
    aprobado: 'pill-green',
    enComision: 'pill-amber',
    radicado: 'pill-gray',
    rechazado: 'pill-red',
    ley: 'pill-teal',
    noticia: 'pill-neutral',
    otro: 'pill-gray',
};

interface StatusBadgeProps {
    raw?: string | null;
    kind?: StatusKind;
    label?: string;
}

export default function StatusBadge({ raw, kind, label }: StatusBadgeProps) {
    const normalized = kind && label
        ? { kind, label }
        : kind === 'noticia'
            ? { kind: 'noticia' as const, label: label ?? 'Noticia' }
            : normalizeStatus(raw, label);

    return (
        <span className={`pill ${kindPill[normalized.kind]}`}>
            {normalized.label}
        </span>
    );
}
