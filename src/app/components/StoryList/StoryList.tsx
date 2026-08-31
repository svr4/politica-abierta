import React, { ReactNode, useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import { useAppSelector, useAppDispatch } from '../../lib/hooks';
import { updateStories, updateIsFiltering, updateIsSummarizing, updateStorySummary, updatePagination } from '../../lib/slices/storyList';
import '../../App.css';
import { Story } from '../../lib/models';
import Loading from '../LoadingComponent/LoadingComponent';
import NewsConfig from './NewsConfig';
import AppButton from '../Misc/AppButton';
import LiveRegion from '../Misc/LiveRegion';
import SummarizeLabel from '../../lib/SummarizeLabel';

export default function StoryList() {
    const currentPage = useAppSelector((state) => state.story.Page);
    const currentLimit = useAppSelector((state) => state.story.Limit);
    const currentSource = useAppSelector((state) => state.story.Source);
    const isFiltering = useAppSelector((state) => state.story.IsFiltering);
    const isSummarizing = useAppSelector((state) => state.story.IsSummarizing);
    const _stories = useAppSelector((state) => state.story.Stories);
    const pages = useAppSelector((state) => state.story.Pages);

    const dispatch = useAppDispatch();
    const [showSummary, setShowSummary] = useState<boolean[]>([]);

    useEffect(() => {
        (async () => {
            dispatch(updateIsFiltering(true));
            const storyResult = await window.imparcialAPI.getStories(currentPage, currentLimit, currentSource);
            if (!storyResult.Error) {
                const stories = storyResult.Data;
                if (stories) {
                    dispatch(updateStories(stories.Stories));
                    dispatch(updatePagination(stories.Pagination));
                }
            }
            dispatch(updateIsFiltering(false));
        })();
    }, []);

    useEffect(() => {
        const _showSummary = [...showSummary];
        const length = _showSummary.length;
        _stories.forEach((_, i) => {
            if (i + 1 > length) {
                _showSummary.push(false);
            }
        });
        setShowSummary(_showSummary);
    }, [_stories]);

    useEffect(() => {
        setShowSummary([]);
    }, [isFiltering]);

    async function summarizeStory(storyId: number, i: number) {
        dispatch(updateIsSummarizing(true));
        const story = _stories.find((e) => e.StoryId === storyId);
        if (story) {
            const _showSummary = [...showSummary];
            if (story.SummaryText && story.SummaryText !== '') {
                _showSummary[i] = true;
                setShowSummary(_showSummary);
            } else {
                const summaryResult = await window.imparcialAPI.summarizeArticle(storyId);
                if (!summaryResult.Error) {
                    const summary = summaryResult.Data;
                    if (summary) {
                        _showSummary[i] = true;
                        dispatch(updateStorySummary({ Id: i, Summary: summary.Body }));
                        setShowSummary(_showSummary);
                    }
                }
            }
        }
        dispatch(updateIsSummarizing(false));
    }

    function renderStoryFeed() {
        if (isFiltering) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        py: 6,
                        width: '100%',
                    }}
                >
                    <CircularProgress aria-hidden />
                    <Typography component="p" color="text.secondary">
                        Cargando noticias…
                    </Typography>
                    <LiveRegion message="Cargando noticias…" />
                </Box>
            );
        }

        if (_stories.length === 0) {
            return (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography component="p" color="text.secondary">
                        No hay noticias para esta fuente. Usa &quot;Cargar Noticias Ahora&quot; para actualizar.
                    </Typography>
                </Box>
            );
        }

        const stories: ReactNode[] = [];
        _stories.forEach((story: Story, i) => {
            stories.push(
                <Card
                    key={story.StoryId}
                    component="article"
                    sx={{
                        width: '100%',
                        mb: 1.5,
                        boxShadow: '0px 1px 7px gray',
                    }}
                >
                    <CardContent>
                    <div className="story-item-title">
                        <Typography component="h2" variant="h6" sx={{ textAlign: 'center' }}>
                            {story.Source}
                        </Typography>
                    </div>
                    {story.CanSummarize ? (
                        <div className="story-controls-container">
                            <AppButton
                                loading={isSummarizing}
                                onClick={() => void summarizeStory(story.StoryId, i)}
                                aria-label="Resumir con I.A."
                            >
                                <SummarizeLabel />
                            </AppButton>
                        </div>
                    ) : null}
                    <a href={story.Uri} target="_blank" rel="noopener noreferrer" className="content-link">
                        <div className="story-data-container">
                            <div className="story-data-item">
                                <img src={story.Media} alt={story.Title} />
                            </div>
                            <div className="story-data-item">
                                <Typography component="p" sx={{ fontWeight: 'bold' }}>{story.Title}</Typography>
                                <p>{story.Description}</p>
                            </div>
                        </div>
                    </a>
                    {showSummary[i] ? (
                        <div className="story-ai-summary-container">
                            <Typography component="p" sx={{ fontWeight: 'bold' }}>Resumen hecho por I.A.:</Typography>
                            <br />
                            <br />
                            <div>{story.SummaryText}</div>
                        </div>
                    ) : null}
                    </CardContent>
                </Card>
            );
        });
        return (
            <>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>{stories}</Box>
                {_stories.length > 0 && pages > 1 && currentPage < pages ? <Loading /> : null}
            </>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <NewsConfig />
            {renderStoryFeed()}
        </Box>
    );
}
