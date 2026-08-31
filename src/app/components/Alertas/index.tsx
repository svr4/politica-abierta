import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

import LiveRegion from '../Misc/LiveRegion';
import FeedCard from '../FeedCard';
import AppButton from '../Misc/AppButton';
import { useAppDispatch } from '../../lib/hooks';
import { updateConfig } from '../../lib/slices/appConfig';
import { updateSelectedNotification } from '../../lib/slices/imparcialApp';
import { Notification } from '../../lib/models';
import { getRelativeTime } from '../../lib/relativeTime';
import { ROUTE_TITLES, setDocumentTitle } from '../../lib/pageTitles';

const FREQUENCY_OPTIONS = [
    { value: 'instant', label: 'Al instante' },
    { value: 'daily', label: 'Resumen diario' },
    { value: 'weekly', label: 'Resumen semanal' },
] as const;

function NuevaRegla({ onSaved }: { onSaved?: () => void }) {
    const dispatch = useAppDispatch();
    const [topics, setTopics] = useState<string[]>([]);
    const [topicDraft, setTopicDraft] = useState('');
    const [addingTopic, setAddingTopic] = useState(false);
    const [legislator, setLegislator] = useState('');
    const [frequency, setFrequency] = useState('instant');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        (async () => {
            const result = await window.imparcialAPI.getConfig();
            if (!result.Error && result.Data?.Config.AlertRules) {
                const rules = result.Data.Config.AlertRules;
                setTopics(rules.topics || []);
                setLegislator(rules.legislator || '');
                setFrequency(rules.frequency || 'instant');
            }
        })();
    }, []);

    function addTopic() {
        const t = topicDraft.trim();
        if (!t || topics.includes(t)) {
            setTopicDraft('');
            setAddingTopic(false);
            return;
        }
        setTopics([...topics, t]);
        setTopicDraft('');
        setAddingTopic(false);
    }

    async function save() {
        setSaving(true);
        setMessage('Guardando…');
        const result = await window.imparcialAPI.updateAlertRules({
            topics,
            legislator,
            frequency,
        });
        if (!result.Error && result.Data) {
            dispatch(updateConfig(result.Data));
            setMessage('Alerta guardada.');
            onSaved?.();
        } else {
            setMessage('No se pudo guardar la alerta.');
        }
        setSaving(false);
    }

    return (
        <div className="card" style={{ maxWidth: 480 }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 16px' }}>
                Nueva regla de alerta
            </p>

            <div className="form-group">
                <span className="form-label" id="temas-label">Seguir por tema</span>
                <div className="tag-input" role="group" aria-labelledby="temas-label">
                    {topics.map((t) => (
                        <span className="tag" key={t}>
                            {t}
                            <AppButton
                                size="small"
                                aria-label={`Quitar tema ${t}`}
                                onClick={() => setTopics(topics.filter((x) => x !== t))}
                                sx={{
                                    minWidth: 0,
                                    p: 0,
                                    border: 'none',
                                    color: 'inherit',
                                    background: 'transparent',
                                    '&:hover': { background: 'transparent', opacity: 0.7 },
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 12 }} aria-hidden />
                            </AppButton>
                        </span>
                    ))}
                    {addingTopic ? (
                        <input
                            className="text-input"
                            style={{ height: 28, padding: '2px 8px', flex: 1, minWidth: 120 }}
                            value={topicDraft}
                            onChange={(e) => setTopicDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTopic();
                                }
                                if (e.key === 'Escape') {
                                    setTopicDraft('');
                                    setAddingTopic(false);
                                }
                            }}
                            onBlur={() => {
                                if (topicDraft.trim()) {
                                    addTopic();
                                } else {
                                    setAddingTopic(false);
                                }
                            }}
                            placeholder="Nombre del tema"
                            aria-label="Nuevo tema"
                            autoFocus
                        />
                    ) : (
                        <AppButton
                            size="small"
                            className="tag-add"
                            onClick={() => setAddingTopic(true)}
                            startIcon={<AddIcon sx={{ fontSize: 12 }} aria-hidden />}
                            sx={{
                                borderStyle: 'dashed',
                                borderRadius: '20px',
                                fontSize: 12,
                                py: 0.5,
                                px: 1.25,
                                textTransform: 'none',
                                color: 'text.secondary',
                            }}
                        >
                            Añadir tema
                        </AppButton>
                    )}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="legislador">Seguir legislador</label>
                <input
                    className="text-input"
                    id="legislador"
                    type="text"
                    placeholder="Buscar legislador"
                    style={{ width: '100%' }}
                    value={legislator}
                    onChange={(e) => setLegislator(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="frecuencia">Frecuencia de notificación</label>
                <select
                    className="select-input"
                    id="frecuencia"
                    style={{ width: '100%' }}
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                >
                    {FREQUENCY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <p className="form-hint">Puedes cambiar esto en cualquier momento.</p>
            </div>

            <AppButton
                loading={saving}
                onClick={save}
                variant="contained"
                fullWidth
                className="btn btn-primary btn-block"
                sx={{
                    bgcolor: 'var(--pa-accent)',
                    color: '#fff',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: 13,
                    py: 1.1,
                    borderRadius: '8px',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: 'var(--pa-accent-hover)', boxShadow: 'none' },
                }}
            >
                Guardar alerta
            </AppButton>
            <LiveRegion message={message} />
            {message ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    {message}
                </Typography>
            ) : null}
        </div>
    );
}

function ActividadReciente({
    limit,
    search = '',
}: {
    limit?: number;
    search?: string;
}) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            setLoading(true);
            const result = await window.imparcialAPI.getNotifications();
            if (!result.Error && result.Data) {
                setNotifications(result.Data);
            }
            setLoading(false);
        })();
    }, []);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = notifications;
        if (q) {
            list = list.filter((n) => (n.Message || '').toLowerCase().includes(q));
        }
        if (typeof limit === 'number') {
            list = list.slice(0, limit);
        }
        return list;
    }, [notifications, search, limit]);

    async function openNotif(n: Notification) {
        dispatch(updateSelectedNotification(n));
        if (!n.Read) {
            await window.imparcialAPI.markNotificationAsRead(n.NotifId);
        }
        navigate('/notificacion');
    }

    const statusMessage = loading
        ? 'Cargando alertas…'
        : `${visible.length} ${visible.length === 1 ? 'alerta' : 'alertas'}`;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
                <LiveRegion message={statusMessage} />
                <CircularProgress aria-hidden />
                <Typography color="text.secondary">Cargando alertas…</Typography>
            </Box>
        );
    }

    if (visible.length === 0) {
        return (
            <>
                <LiveRegion message={statusMessage} />
                <Typography color="text.secondary">No hay alertas disparadas todavía.</Typography>
            </>
        );
    }

    return (
        <Box>
            <LiveRegion message={statusMessage} />
            {visible.map((n) => (
                <FeedCard
                    key={n.NotifId}
                    statusKind="noticia"
                    statusLabel="Alerta"
                    relativeTime={getRelativeTime(n.NotificationDate)}
                    headline={n.Message || 'Alerta coincidente'}
                    source="Solo alertas"
                    showAiBadge
                    onClick={() => openNotif(n)}
                />
            ))}
        </Box>
    );
}

export default function AlertasPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const isHistorial = location.pathname.includes('/actividad');
    const [search, setSearch] = useState('');
    const [unread, setUnread] = useState(0);
    const [recentKey, setRecentKey] = useState(0);

    useEffect(() => {
        setDocumentTitle(isHistorial ? ROUTE_TITLES.alertasActividad : ROUTE_TITLES.alertas);
    }, [isHistorial]);

    useEffect(() => {
        (async () => {
            const notifResult = await window.imparcialAPI.getNotifications();
            if (!notifResult.Error && notifResult.Data) {
                setUnread(notifResult.Data.reduce((acc, n) => (n.Read ? acc : acc + 1), 0));
            }
        })();
    }, [isHistorial, recentKey]);

    return (
        <Box>
            <div className="topbar">
                <div className="search-box">
                    <SearchIcon fontSize="small" aria-hidden />
                    <input
                        type="text"
                        placeholder="Buscar proyectos, legisladores, temas"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Buscar alertas"
                    />
                </div>
                <button
                    type="button"
                    className="icon-btn"
                    aria-label="Notificaciones"
                    onClick={() => navigate('/alertas/actividad')}
                >
                    <NotificationsNoneOutlinedIcon fontSize="small" aria-hidden />
                    {unread > 0 ? <span className="badge" /> : null}
                </button>
            </div>

            <h1 className="page-title">Alertas</h1>
            <p className="page-subtitle">Configura tus notificaciones y revisa tu actividad reciente</p>

            <div className="tabs" role="tablist" aria-label="Secciones de alertas">
                <RouterLink
                    className={`tab${isHistorial ? '' : ' active'}`}
                    to="/alertas"
                    role="tab"
                    aria-selected={!isHistorial}
                >
                    Configurar
                </RouterLink>
                <RouterLink
                    className={`tab${isHistorial ? ' active' : ''}`}
                    to="/alertas/actividad"
                    role="tab"
                    aria-selected={isHistorial}
                >
                    Historial
                </RouterLink>
            </div>

            {isHistorial ? (
                <ActividadReciente search={search} />
            ) : (
                <>
                    <NuevaRegla onSaved={() => setRecentKey((k) => k + 1)} />
                    <div className="divider" />
                    <p
                        style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--pa-text-secondary)',
                            marginBottom: 12,
                        }}
                    >
                        Actividad reciente
                    </p>
                    <ActividadReciente key={recentKey} limit={5} search={search} />
                </>
            )}
        </Box>
    );
}
