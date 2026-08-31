import data from './data';

export type Chamber = 'Camara' | 'Senado' | 'Conjunta' | 'Desconocida';

export function getCommitteeName(committeeId: number): string {
    const found = data.comisions.find((c) => c.id === committeeId);
    return found?.name ?? `Comisión ${committeeId}`;
}

export function getChamberFromCommittee(committeeId: number): Chamber {
    const name = getCommitteeName(committeeId);
    if (name.includes('Senado')) {
        return 'Senado';
    }
    if (name.includes('Cámara') || name.includes('Camara')) {
        return 'Camara';
    }
    if (name.includes('Conjunta')) {
        return 'Conjunta';
    }
    return 'Desconocida';
}

export function getChamberLabel(chamber: Chamber): string {
    switch (chamber) {
        case 'Camara':
            return 'Cámara';
        case 'Senado':
            return 'Senado';
        case 'Conjunta':
            return 'Conjunta';
        default:
            return '—';
    }
}

export function formatBillNo(chamber: Chamber, number: number): string {
    const prefix = chamber === 'Senado' ? 'PS' : chamber === 'Camara' ? 'PC' : 'P';
    return `${prefix} ${number}`;
}

export function getCommitteeIdsForChamber(chamber: Chamber): number[] {
    return data.comisions
        .filter((c) => {
            if (chamber === 'Camara') {
                return c.name.includes('Cámara') || c.name.includes('Camara');
            }
            if (chamber === 'Senado') {
                return c.name.includes('Senado');
            }
            if (chamber === 'Conjunta') {
                return c.name.includes('Conjunta');
            }
            return true;
        })
        .map((c) => c.id);
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Parses FiledDate shapes like MM/DD/YYYY or ISO-ish strings. */
export function formatShortDate(dateStr: string | null | undefined): string {
    if (!dateStr) {
        return '—';
    }
    const slash = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slash) {
        const month = Number(slash[1]) - 1;
        const day = Number(slash[2]);
        return `${day} ${MONTHS_SHORT[month] ?? ''}`;
    }
    const parsed = new Date(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
        return `${parsed.getDate()} ${MONTHS_SHORT[parsed.getMonth()]}`;
    }
    return dateStr;
}

export function formatLongDate(dateStr: string | null | undefined): string {
    if (!dateStr) {
        return '—';
    }
    const slash = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slash) {
        const month = Number(slash[1]) - 1;
        const day = Number(slash[2]);
        const year = slash[3];
        return `${day} ${MONTHS_SHORT[month] ?? ''} ${year}`;
    }
    const parsed = new Date(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
        return `${parsed.getDate()} ${MONTHS_SHORT[parsed.getMonth()]} ${parsed.getFullYear()}`;
    }
    return dateStr;
}
