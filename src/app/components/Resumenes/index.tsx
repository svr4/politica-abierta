import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';

import { SourceType, Story, RecentLegislation } from '../../lib/models';
import { assignTopic } from '../../lib/topics';
import { ROUTE_TITLES, setDocumentTitle } from '../../lib/pageTitles';
import LiveRegion from '../Misc/LiveRegion';

interface DigestSource {
    label: string;
    text: string;
}

interface TopicDigest {
    topic: string;
    sources: DigestSource[];
    body: string;
}

function formatTodaySubtitle(): string {
    const date = new Date().toLocaleDateString('es-PR', {
        day: 'numeric',
        month: 'long',
    });
    return `Agrupado por tema · Hoy, ${date}`;
}

export default function ResumenesPage() {
    const [loading, setLoading] = useState(true);
    const [digests, setDigests] = useState<TopicDigest[]>([]);
    const [search, setSearch] = useState('');
    const [unread, setUnread] = useState(0);
    const [subtitle] = useState(formatTodaySubtitle);
    const navigate = useNavigate();

    useEffect(() => {
        setDocumentTitle(ROUTE_TITLES.resumenes);
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const sources: DigestSource[] = [];

            for (const source of [SourceType.ENDI, SourceType.Vocero, SourceType.Noticel]) {
                const result = await window.imparcialAPI.getStories(1, 30, source);
                if (!result.Error && result.Data?.Stories) {
                    for (const story of result.Data.Stories as Story[]) {
                        if (story.SummaryText) {
                            sources.push({
                                label: story.Title,
                                text: story.SummaryText,
                            });
                        }
                    }
                }
            }

            const legResult = await window.imparcialAPI.getRecentLegislations(1, 40);
            if (!legResult.Error && legResult.Data?.Legislation) {
                for (const bill of legResult.Data.Legislation as RecentLegislation[]) {
                    if (bill.DocSummary) {
                        sources.push({
                            label: `Proyecto ${bill.Number}: ${bill.Title}`,
                            text: bill.DocSummary,
                        });
                    }
                }
            }

            const byTopic = new Map<string, DigestSource[]>();
            for (const s of sources) {
                const topic = assignTopic(`${s.label} ${s.text}`);
                const list = byTopic.get(topic) || [];
                list.push(s);
                byTopic.set(topic, list);
            }

            const built: TopicDigest[] = [];
            for (const [topic, list] of byTopic.entries()) {
                built.push({
                    topic,
                    sources: list,
                    body: list.map((x) => x.text).join(' '),
                });
            }
            built.sort((a, b) => b.sources.length - a.sources.length);
            setDigests(built);

            const notifResult = await window.imparcialAPI.getNotifications();
            if (!notifResult.Error && notifResult.Data) {
                setUnread(notifResult.Data.reduce((acc, n) => (n.Read ? acc : acc + 1), 0));
            }

            setLoading(false);
        })();
    }, []);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return digests;
        }
        return digests.filter(
            (d) => d.topic.toLowerCase().includes(q) || d.body.toLowerCase().includes(q),
        );
    }, [digests, search]);

    const countLabel = useMemo(() => `${visible.length} temas`, [visible]);

    return (
        <Box>
            <LiveRegion message={loading ? 'Cargando resúmenes…' : countLabel} />

            <div className="topbar">
                <div className="search-box">
                    <SearchIcon fontSize="small" aria-hidden />
                    <input
                        type="text"
                        placeholder="Buscar proyectos, legisladores, temas"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Buscar en resúmenes"
                    />
                </div>
                <button
                    type="button"
                    className="icon-btn"
                    aria-label="Notificaciones"
                    onClick={() => navigate('/alertas')}
                >
                    <NotificationsNoneOutlinedIcon fontSize="small" aria-hidden />
                    {unread > 0 ? <span className="badge" /> : null}
                </button>
            </div>

            <h1 className="page-title">Resúmenes IA</h1>
            <p className="page-subtitle">{subtitle}</p>

            {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1 }}>
                    <CircularProgress aria-hidden />
                    <Typography color="text.secondary">Cargando resúmenes…</Typography>
                </Box>
            ) : visible.length === 0 ? (
                <Typography color="text.secondary">
                    {digests.length === 0
                        ? 'No hay resúmenes de I.A. todavía. Genera resúmenes desde el feed o la legislación.'
                        : 'No hay resultados.'}
                </Typography>
            ) : (
                visible.map((d) => (
                    <article key={d.topic} className="card">
                        <div className="card-row-top">
                            <span className="card-title" style={{ margin: 0 }}>{d.topic}</span>
                            <span className="timestamp">
                                {d.sources.length} {d.sources.length === 1 ? 'fuente' : 'fuentes'}
                            </span>
                        </div>
                        <p
                            style={{
                                fontSize: 13,
                                lineHeight: 1.65,
                                color: 'var(--pa-text-secondary)',
                                margin: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 4,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {d.body}
                        </p>
                    </article>
                ))
            )}
        </Box>
    );
}
