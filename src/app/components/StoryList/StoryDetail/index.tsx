import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';

import { Story } from '../../../lib/models';
import AppButton from '../../Misc/AppButton';
import AiBadge from '../../AiBadge';
import LiveRegion from '../../Misc/LiveRegion';
import { ROUTE_TITLES, setDocumentTitle } from '../../../lib/pageTitles';
import SummarizeLabel from '../../../lib/SummarizeLabel';
import { getRelativeTime } from '../../../lib/relativeTime';

interface StoryDetailProps {
    hash?: string;
}

export default function StoryDetail({ hash }: StoryDetailProps) {
    const params = useParams();
    const [story, setStory] = useState<Story | undefined>();
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setDocumentTitle(ROUTE_TITLES.storyDetail);
    }, []);

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            const _hash = hash && hash !== '' ? hash : (params.hash as string);
            const _storyResult = await window.imparcialAPI.getStory(_hash);
            if (!_storyResult.Error && _storyResult.Data) {
                setStory(_storyResult.Data);
            }
            setIsLoading(false);
        })();
    }, [hash, params.hash]);

    async function summarizeStory() {
        setIsSummarizing(true);
        if (story) {
            if (story.SummaryText && story.SummaryText !== '') {
                setShowSummary(true);
            } else {
                const summaryResult = await window.imparcialAPI.summarizeArticle(story.StoryId);
                if (!summaryResult.Error && summaryResult.Data) {
                    setStory(Object.assign({}, story, { SummaryText: summaryResult.Data.Body }));
                    setShowSummary(true);
                }
            }
        }
        setIsSummarizing(false);
    }

    if (isLoading) {
        return (
            <div>
                <LiveRegion message="Cargando noticia…" />
                <p className="page-subtitle">Cargando noticia…</p>
            </div>
        );
    }

    if (!story) {
        return <p className="page-subtitle">Noticia no encontrada.</p>;
    }

    return (
        <div>
            <LiveRegion message={story.Title} />
            <nav className="breadcrumb" aria-label="Miga de pan">
                <RouterLink to="/">Feed</RouterLink>
                <span aria-hidden>›</span>
                <span className="current">Noticia</span>
            </nav>

            <article className="card">
                <div className="card-row-top">
                    <span className="pill pill-neutral">{story.Source}</span>
                    <span className="timestamp">{getRelativeTime(story.ScrapedDate)}</span>
                </div>
                <h1 className="page-title" style={{ fontSize: 18, marginBottom: 12 }}>{story.Title}</h1>
                {story.Media ? (
                    <img
                        src={story.Media}
                        alt=""
                        style={{
                            width: '100%',
                            maxHeight: 320,
                            objectFit: 'cover',
                            borderRadius: 'var(--pa-radius)',
                            marginBottom: 16,
                            border: '1px solid var(--pa-border)',
                        }}
                    />
                ) : null}
                <p style={{ fontSize: 14, lineHeight: 1.65, margin: '0 0 16px', color: 'var(--pa-text-primary)' }}>
                    {story.Description}
                </p>
                <div className="card-meta" style={{ marginBottom: 16 }}>
                    <a href={story.Uri} target="_blank" rel="noopener noreferrer" className="content-link">
                        Ver fuente original
                    </a>
                </div>
                {story.CanSummarize ? (
                    <AppButton
                        className="btn btn-primary"
                        variant="contained"
                        color="primary"
                        loading={isSummarizing}
                        onClick={() => void summarizeStory()}
                        aria-label="Resumir con I.A."
                    >
                        <SummarizeLabel />
                    </AppButton>
                ) : null}
            </article>

            {showSummary && story.SummaryText ? (
                <div className="card" style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 10 }}>
                        <AiBadge />
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>{story.SummaryText}</p>
                </div>
            ) : null}
        </div>
    );
}
