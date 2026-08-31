import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import CircularProgress from '@mui/material/CircularProgress';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';

import StatusBadge from '../../StatusBadge';
import AiBadge from '../../AiBadge';
import EventTimeline from '../../EventTimeline';
import FeedCard from '../../FeedCard';
import AppButton from '../../Misc/AppButton';
import LiveRegion from '../../Misc/LiveRegion';
import { Legislation, Story, SourceType } from '../../../lib/models';
import {
    formatBillNo,
    formatLongDate,
    getChamberFromCommittee,
    getChamberLabel,
} from '../../../lib/legislationMeta';
import { getRelativeTime } from '../../../lib/relativeTime';
import { ROUTE_TITLES, setDocumentTitle } from '../../../lib/pageTitles';

const TABS = ['Resumen', 'Texto completo', 'Historial', 'Noticias relacionadas'] as const;

interface LegislationDetailProps {
    hash?: string;
    legislationId?: number;
}

export default function LegislationDetail({ hash, legislationId }: LegislationDetailProps) {
    const params = useParams();
    const [legislation, setLegislation] = useState<Legislation | undefined>();
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [following, setFollowing] = useState(false);
    const [related, setRelated] = useState<Story[]>([]);

    useEffect(() => {
        setDocumentTitle(ROUTE_TITLES.legislationDetail);
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            let loaded: Legislation | undefined;
            if (legislationId && legislationId > 0) {
                const result = await window.imparcialAPI.getLegislationById(legislationId);
                if (!result.Error && result.Data) {
                    loaded = result.Data;
                }
            } else {
                const _hash = hash && hash !== '' ? hash : (params.hash as string);
                const result = await window.imparcialAPI.getLegislationByHash(_hash);
                if (!result.Error && result.Data) {
                    loaded = result.Data;
                }
            }
            if (loaded) {
                setLegislation(loaded);
                setFollowing(Boolean(loaded.IsSubscribed));
            }
            setLoading(false);
        })();
    }, [hash, legislationId, params.hash]);

    useEffect(() => {
        if (!legislation) {
            return;
        }
        (async () => {
            const tokens = [
                String(legislation.Number),
                ...legislation.Title.split(/\s+/).filter((t) => t.length > 5).slice(0, 3),
            ].map((t) => t.toLowerCase());
            const stories: Story[] = [];
            for (const source of [SourceType.ENDI, SourceType.Vocero, SourceType.Noticel]) {
                const result = await window.imparcialAPI.getStories(1, 20, source);
                if (!result.Error && result.Data?.Stories) {
                    for (const s of result.Data.Stories) {
                        const hay = `${s.Title} ${s.Description}`.toLowerCase();
                        if (tokens.some((t) => hay.includes(t))) {
                            stories.push(s);
                        }
                    }
                }
            }
            setRelated(stories.slice(0, 10));
        })();
    }, [legislation]);

    const chamber = useMemo(
        () => (legislation ? getChamberFromCommittee(legislation.Committe) : 'Desconocida'),
        [legislation],
    );
    const billNo = legislation ? formatBillNo(chamber, legislation.Number) : '';

    useEffect(() => {
        if (billNo) {
            setDocumentTitle(billNo);
        }
    }, [billNo]);

    const summaryText = useMemo(() => {
        if (!legislation) {
            return '';
        }
        const fromEvents = legislation.Events?.find((e) => e.DocSummary)?.DocSummary;
        const fromDocs = legislation.Docs?.find((d) => d.DocSummary)?.DocSummary;
        return fromEvents || fromDocs || '';
    }, [legislation]);

    const fullText = useMemo(() => {
        if (!legislation) {
            return '';
        }
        const docs = legislation.Docs || [];
        if (docs.length === 0 && legislation.Events?.length) {
            return legislation.Events.map((e) => e.Description).filter(Boolean).join('\n\n');
        }
        return docs.map((d) => d.Description).filter(Boolean).join('\n\n');
    }, [legislation]);

    const timelineEvents = useMemo(
        () => (legislation?.Events || []).map((e) => ({
            title: e.Title,
            description: e.Description,
        })),
        [legislation],
    );

    async function toggleFollow() {
        if (!legislation) {
            return;
        }
        setFollowing((v) => !v);
        await window.imparcialAPI.updateSubscribedProjects(legislation.LegislationId);
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <CircularProgress aria-hidden />
                <LiveRegion message="Cargando detalle…" />
            </div>
        );
    }

    if (!legislation) {
        return <p className="page-subtitle">Proyecto no encontrado.</p>;
    }

    return (
        <div>
            <nav className="breadcrumb" aria-label="Miga de pan">
                <RouterLink to="/legislacion">Legislación</RouterLink>
                <span aria-hidden>›</span>
                <span className="current">{billNo}</span>
            </nav>

            <div className="card-row-top" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h1 style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>{billNo}</h1>
                        <StatusBadge raw={legislation.LastEvent} />
                    </div>
                    <p
                        style={{
                            fontSize: 14,
                            color: 'var(--pa-text-secondary)',
                            margin: 0,
                            maxWidth: 460,
                        }}
                    >
                        {legislation.Title}
                    </p>
                </div>
                <AppButton
                    variant="contained"
                    color="primary"
                    className="btn btn-primary"
                    startIcon={following ? <NotificationsActiveOutlinedIcon /> : <NotificationsNoneOutlinedIcon />}
                    onClick={toggleFollow}
                    aria-pressed={following}
                >
                    Seguir
                </AppButton>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 20,
                    fontSize: 13,
                    color: 'var(--pa-text-secondary)',
                    padding: '12px 0',
                    borderTop: '1px solid var(--pa-border)',
                    borderBottom: '1px solid var(--pa-border)',
                    marginBottom: 20,
                    flexWrap: 'wrap',
                }}
            >
                <span>Autor: {legislation.Author || '—'}</span>
                <span>Cámara: {getChamberLabel(chamber)}</span>
                <span>Fecha: {formatLongDate(legislation.FiledDate)}</span>
            </div>

            <div className="tabs" role="tablist" aria-label="Secciones del proyecto">
                {TABS.map((label, index) => (
                    <button
                        key={label}
                        type="button"
                        role="tab"
                        id={`bill-tab-${index}`}
                        aria-selected={tab === index}
                        aria-controls={`bill-panel-${index}`}
                        className={`tab${tab === index ? ' active' : ''}`}
                        onClick={() => setTab(index)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 0 && (
                <div role="tabpanel" id="bill-panel-0" aria-labelledby="bill-tab-0">
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ marginBottom: 10 }}>
                            <AiBadge />
                        </div>
                        <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>
                            {summaryText || 'Aún no hay un resumen de I.A. para este proyecto.'}
                        </p>
                    </div>
                    <p
                        style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--pa-text-secondary)',
                            marginBottom: 12,
                        }}
                    >
                        Historial de acciones
                    </p>
                    <EventTimeline events={timelineEvents} />
                </div>
            )}

            {tab === 1 && (
                <div role="tabpanel" id="bill-panel-1" aria-labelledby="bill-tab-1">
                    <p
                        style={{
                            whiteSpace: 'pre-wrap',
                            fontSize: 14,
                            lineHeight: 1.65,
                            margin: 0,
                            color: fullText ? 'var(--pa-text-primary)' : 'var(--pa-text-secondary)',
                        }}
                    >
                        {fullText || 'No hay texto completo disponible.'}
                    </p>
                </div>
            )}

            {tab === 2 && (
                <div role="tabpanel" id="bill-panel-2" aria-labelledby="bill-tab-2">
                    <EventTimeline dense events={timelineEvents} />
                </div>
            )}

            {tab === 3 && (
                <div role="tabpanel" id="bill-panel-3" aria-labelledby="bill-tab-3">
                    {related.length === 0 ? (
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>No hay noticias relacionadas.</p>
                    ) : (
                        related.map((s) => (
                            <FeedCard
                                key={s.Hash}
                                statusKind="noticia"
                                statusLabel="Noticia"
                                relativeTime={getRelativeTime(s.ScrapedDate)}
                                headline={s.Title}
                                source={s.Source}
                                showAiBadge={Boolean(s.SummaryText)}
                                onClick={() => { window.location.hash = `#/noticia/${s.Hash}`; }}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
