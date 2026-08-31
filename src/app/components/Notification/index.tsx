import { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { useAppSelector } from '../../lib/hooks';

import StoryDetail from '../StoryList/StoryDetail';
import LegislationDetail from '../LegislationList/LegislationDetail';
import { ROUTE_TITLES, setDocumentTitle } from '../../lib/pageTitles';

export default function Notification() {
    const matched_legislation: string[] = useAppSelector((state) => state.imparcial.selectedNotification?.MatchedLegislation || []);
    const matched_news: string[] = useAppSelector((state) => state.imparcial.selectedNotification?.MatchedNews || []);
    const matched_projects: number[] = useAppSelector((state) => state.imparcial.selectedNotification?.MatchedProjectsForEvents || []);
    const notifId = useAppSelector((state) => state.imparcial.selectedNotification?.NotifId);

    useEffect(() => {
        setDocumentTitle(ROUTE_TITLES.notification);
    }, []);

    useEffect(() => {
        if (notifId) {
            (async () => {
                await window.imparcialAPI.markNotificationAsRead(notifId);
            })();
        }
    }, [notifId]);

    return (
        <>
            <Typography component="h1" variant="h5" sx={{ py: 1 }}>
                {ROUTE_TITLES.notification}
            </Typography>
            {matched_news.length > 0 ? (
                <>
                    <Typography component="h2" variant="h6">
                        Noticias Filtradas
                    </Typography>
                    {matched_news.map((val) => (
                        <StoryDetail key={`matched_news_${val}`} hash={val} />
                    ))}
                </>
            ) : null}
            {matched_legislation.length > 0 ? (
                <>
                    <Typography component="h2" variant="h6">
                        Legislación Filtrada
                    </Typography>
                    {matched_legislation.map((val) => (
                        <LegislationDetail key={`matched_legislation_${val}`} hash={val} />
                    ))}
                </>
            ) : null}
            {matched_projects.length > 0 ? (
                <>
                    <Typography component="h2" variant="h6">
                        Proyectos con Eventos Nuevos
                    </Typography>
                    {matched_projects.map((val) => (
                        <LegislationDetail key={`matched_project_${val}`} legislationId={val} />
                    ))}
                </>
            ) : null}
        </>
    );
}
