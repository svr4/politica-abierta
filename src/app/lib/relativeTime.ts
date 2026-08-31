export function getRelativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) {
        return '';
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
        return dateStr;
    }
    const now = new Date();
    const ms = now.getTime() - date.getTime();
    const minutes = Math.floor(ms / (1000 * 60));
    if (minutes < 1) {
        return 'Hace un momento';
    }
    if (minutes < 60) {
        return `Hace ${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `Hace ${hours}h`;
    }
    const days = Math.floor(hours / 24);
    if (days === 1) {
        return 'Hace 1 día';
    }
    if (days < 30) {
        return `Hace ${days} días`;
    }
    return date.toLocaleDateString('es-PR');
}
