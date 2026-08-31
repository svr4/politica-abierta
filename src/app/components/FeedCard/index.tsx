import type { KeyboardEvent } from 'react';
import StatusBadge from '../StatusBadge';
import AiBadge from '../AiBadge';
import { StatusKind } from '../../lib/status';

export interface FeedCardProps {
    statusKind?: StatusKind;
    statusLabel?: string;
    statusRaw?: string | null;
    relativeTime: string;
    headline: string;
    source: string;
    showAiBadge?: boolean;
    onClick?: () => void;
}

export default function FeedCard({
    statusKind,
    statusLabel,
    statusRaw,
    relativeTime,
    headline,
    source,
    showAiBadge,
    onClick,
}: FeedCardProps) {
    return (
        <article
            className="card"
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(e: KeyboardEvent) => {
                if (!onClick) {
                    return;
                }
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            style={onClick ? { cursor: 'pointer' } : undefined}
        >
            <div className="card-row-top">
                <StatusBadge kind={statusKind} label={statusLabel} raw={statusRaw} />
                <span className="timestamp">{relativeTime}</span>
            </div>
            <h2 className="card-title">{headline}</h2>
            <div className="card-meta">
                {showAiBadge ? <AiBadge /> : null}
                <span>{source}</span>
            </div>
        </article>
    );
}
