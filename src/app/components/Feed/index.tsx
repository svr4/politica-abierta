import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';

import FeedCard from '../FeedCard';
import { SourceType, Story, RecentLegislation } from '../../lib/models';
import { getRelativeTime } from '../../lib/relativeTime';
import { normalizeStatus } from '../../lib/status';
import { assignTopic } from '../../lib/topics';
import { ROUTE_TITLES, setDocumentTitle } from '../../lib/pageTitles';
import LiveRegion from '../Misc/LiveRegion';

type FeedKind = 'all' | 'news' | 'legislation' | 'topics';

type FeedItem =
    | { kind: 'news'; date: string; story: Story }
    | { kind: 'legislation'; date: string; bill: RecentLegislation };

const FILTERS: { value: FeedKind; label: string }[] = [
    { value: 'all', label: 'Todo' },
    { value: 'news', label: 'Noticias' },
    { value: 'legislation', label: 'Legislación' },
    { value: 'topics', label: 'Mis temas' },
];

function itemMatchesTopics(item: FeedItem, topics: string[]): boolean {
    if (topics.length === 0) {
        return false;
    }
    const haystack = item.kind === 'news'
        ? `${item.story.Title} ${item.story.Description || ''} ${item.story.SummaryText || ''}`
        : `${item.bill.Title} ${item.bill.LastEvent || ''} ${item.bill.EventDescription || ''} ${item.bill.DocSummary || ''}`;
    const lower = haystack.toLowerCase();
    const assigned = assignTopic(haystack);
    return topics.some((t) => {
        const topicLower = t.toLowerCase();
        return lower.includes(topicLower) || assigned.toLowerCase() === topicLower;
    });
}

export default function FeedPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FeedKind>('all');
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<FeedItem[]>([]);
    const [myTopics, setMyTopics] = useState<string[]>([]);
    const [unread, setUnread] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        setDocumentTitle(ROUTE_TITLES.feed);
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const merged: FeedItem[] = [];
            const sources = [SourceType.ENDI, SourceType.Vocero, SourceType.Noticel];
            for (const source of sources) {
                const result = await window.imparcialAPI.getStories(1, 15, source);
                if (!result.Error && result.Data?.Stories) {
                    for (const story of result.Data.Stories) {
                        merged.push({ kind: 'news', date: story.ScrapedDate, story });
                    }
                }
            }
            const legResult = await window.imparcialAPI.getRecentLegislations(1, 20);
            if (!legResult.Error && legResult.Data?.Legislation) {
                for (const bill of legResult.Data.Legislation) {
                    merged.push({ kind: 'legislation', date: bill.ScrapedDate || bill.FiledDate, bill });
                }
            }
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setItems(merged);

            const configResult = await window.imparcialAPI.getConfig();
            if (!configResult.Error && configResult.Data?.Config.AlertRules?.topics) {
                setMyTopics(configResult.Data.Config.AlertRules.topics);
            }

            const notifResult = await window.imparcialAPI.getNotifications();
            if (!notifResult.Error && notifResult.Data) {
                setUnread(notifResult.Data.reduce((acc, n) => (n.Read ? acc : acc + 1), 0));
            }

            setLoading(false);
        })();
    }, []);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((item) => {
            if (filter === 'news' && item.kind !== 'news') {
                return false;
            }
            if (filter === 'legislation' && item.kind !== 'legislation') {
                return false;
            }
            if (filter === 'topics' && !itemMatchesTopics(item, myTopics)) {
                return false;
            }
            if (!q) {
                return true;
            }
            if (item.kind === 'news') {
                return (
                    item.story.Title.toLowerCase().includes(q)
                    || item.story.Description?.toLowerCase().includes(q)
                    || item.story.Source?.toLowerCase().includes(q)
                );
            }
            return (
                item.bill.Title.toLowerCase().includes(q)
                || String(item.bill.Number).includes(q)
                || item.bill.Author?.toLowerCase().includes(q)
                || item.bill.LastEvent?.toLowerCase().includes(q)
            );
        });
    }, [items, filter, search, myTopics]);

    return (
        <Box>
            <LiveRegion message={loading ? 'Cargando feed…' : `${visible.length} elementos`} />

            <div className="topbar">
                <div className="search-box">
                    <SearchIcon fontSize="small" aria-hidden />
                    <input
                        type="text"
                        placeholder="Buscar proyectos, legisladores, temas"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Buscar en el feed"
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

            <h1 className="page-title">Feed</h1>
            <p className="page-subtitle">Noticias y legislación en tiempo real</p>

            <div className="filter-bar" role="group" aria-label="Filtrar tipo de contenido">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        type="button"
                        className={`filter-chip${filter === f.value ? ' active' : ''}`}
                        aria-pressed={filter === f.value}
                        onClick={() => setFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1 }}>
                    <CircularProgress aria-hidden />
                    <Typography color="text.secondary">Cargando feed…</Typography>
                </Box>
            ) : (
                <Box>
                    {visible.length === 0 ? (
                        <Typography color="text.secondary">
                            {filter === 'topics' && myTopics.length === 0
                                ? 'Configura temas en Alertas para filtrar por Mis temas.'
                                : 'No hay resultados.'}
                        </Typography>
                    ) : (
                        visible.map((item) => {
                            if (item.kind === 'news') {
                                return (
                                    <FeedCard
                                        key={`n-${item.story.Hash}`}
                                        statusKind="noticia"
                                        statusLabel="Noticia"
                                        relativeTime={getRelativeTime(item.story.ScrapedDate)}
                                        headline={item.story.Title}
                                        source={item.story.Source}
                                        showAiBadge={Boolean(item.story.SummaryText)}
                                        onClick={() => navigate(`/noticia/${item.story.Hash}`)}
                                    />
                                );
                            }
                            const status = normalizeStatus(item.bill.LastEvent || item.bill.EventDescription);
                            return (
                                <FeedCard
                                    key={`l-${item.bill.Hash}`}
                                    statusRaw={item.bill.LastEvent || item.bill.EventDescription}
                                    relativeTime={getRelativeTime(item.bill.ScrapedDate || item.bill.FiledDate)}
                                    headline={`Proyecto ${item.bill.Number} ${status.label.toLowerCase()} — ${item.bill.Title}`}
                                    source="Legislatura de PR"
                                    showAiBadge={Boolean(item.bill.DocSummary)}
                                    onClick={() => navigate(`/legislacion/${item.bill.Hash}`)}
                                />
                            );
                        })
                    )}
                </Box>
            )}
        </Box>
    );
}
