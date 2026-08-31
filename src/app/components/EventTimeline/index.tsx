import { statusColors } from '../../lib/theme';
import { normalizeStatus } from '../../lib/status';
import { formatLongDate } from '../../lib/legislationMeta';
import { LegislationEvent } from '../../lib/models';

interface TimelineEvent {
    title: string;
    date?: string | null;
    description?: string | null;
}

interface EventTimelineProps {
    events: TimelineEvent[] | LegislationEvent[];
    dense?: boolean;
}

function asTimelineEvent(e: TimelineEvent | LegislationEvent): TimelineEvent {
    if ('LegEventId' in e) {
        return {
            title: e.Title,
            date: undefined,
            description: e.Description,
        };
    }
    return e;
}

function dotColor(kind: string, isLatest: boolean): string | undefined {
    if (!isLatest) {
        return undefined;
    }
    if (kind === 'aprobado') {
        return statusColors.aprobado.color;
    }
    if (kind === 'enComision') {
        return statusColors.enComision.color;
    }
    if (kind === 'rechazado') {
        return statusColors.rechazado.color;
    }
    if (kind === 'ley') {
        return statusColors.ley.color;
    }
    return statusColors.radicado.color;
}

export default function EventTimeline({ events, dense }: EventTimelineProps) {
    const items = events.map(asTimelineEvent);
    if (items.length === 0) {
        return <p className="page-subtitle" style={{ marginBottom: 0 }}>No hay eventos registrados.</p>;
    }

    return (
        <div className="timeline">
            {items.map((event, index) => {
                const status = normalizeStatus(event.title);
                const isLatest = index === 0;
                const color = dotColor(status.kind, isLatest);
                return (
                    <div
                        key={`${event.title}-${index}`}
                        className={`timeline-item${isLatest ? ' current' : ''}`}
                    >
                        <span
                            className={`timeline-dot${isLatest ? ' done' : ''}`}
                            style={color ? { background: color } : undefined}
                            aria-hidden
                        />
                        <p className="timeline-title">{event.title}</p>
                        {event.date ? (
                            <p className="timeline-date">{formatLongDate(event.date)}</p>
                        ) : null}
                        {dense && event.description ? (
                            <p className="timeline-date" style={{ marginTop: 4 }}>{event.description}</p>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
