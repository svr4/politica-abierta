import type { MouseEvent } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';

import { useAppSelector, useAppDispatch } from '../../lib/hooks';
import { updateStories, updatePagination, updateIsFiltering } from '../../lib/slices/storyList';
import { SourceType } from '../../lib/models';
import { updateCurrentComponent, selectCurrentComponent } from '../../lib/slices/imparcialApp';
import LiveRegion from '../Misc/LiveRegion';

export default function FilterBar() {
    const currentLimit = useAppSelector((state) => state.story.Limit);
    const currentComponent = useAppSelector(selectCurrentComponent);
    const isFiltering = useAppSelector((state) => state.story.IsFiltering);
    const dispatch = useAppDispatch();

    async function filterStories(source: number) {
        dispatch(updateIsFiltering(true));
        const storyResult = await window.imparcialAPI.getStories(1, currentLimit, source);
        if (!storyResult.Error) {
            const stories = storyResult.Data;
            if (stories) {
                dispatch(updateStories(stories.Stories));
                dispatch(updatePagination({
                    Source: stories.Pagination.Source,
                    Page: stories.Pagination.Page,
                    Limit: stories.Pagination.Limit,
                    Pages: stories.Pagination.Pages,
                    Total: stories.Pagination.Total,
                }));
            }
        }
        dispatch(updateIsFiltering(false));
        dispatch(updateCurrentComponent(source));
    }

    function handleSourceChange(_event: MouseEvent<HTMLElement>, value: SourceType | null) {
        if (value === null || isFiltering) {
            return;
        }
        if (value === SourceType.Legislacion) {
            dispatch(updateCurrentComponent(SourceType.Legislacion));
            return;
        }
        void filterStories(value);
    }

    return (
        <Box
            component="section"
            aria-labelledby="filter-bar-heading"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                py: 2.5,
                px: 1,
            }}
        >
            <Typography id="filter-bar-heading" component="h2" variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold' }}>
                Fuente
            </Typography>
            {isFiltering && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CircularProgress size={20} aria-hidden />
                    <LiveRegion message="Cargando noticias…" />
                </Box>
            )}
            <ToggleButtonGroup
                value={currentComponent}
                exclusive
                onChange={handleSourceChange}
                aria-label="Fuente de contenido"
                disabled={isFiltering}
                sx={{
                    flexWrap: 'wrap',
                    gap: 1,
                    '& .MuiToggleButtonGroup-grouped': {
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: '10px !important',
                        mx: 0.5,
                    },
                }}
            >
                <ToggleButton value={SourceType.ENDI} aria-label="El Nuevo Día">
                    El Nuevo Día
                </ToggleButton>
                <ToggleButton value={SourceType.Vocero} aria-label="El Vocero">
                    El Vocero
                </ToggleButton>
                <ToggleButton value={SourceType.Noticel} aria-label="Noticel">
                    Noticel
                </ToggleButton>
                <ToggleButton value={SourceType.Legislacion} aria-label="Legislación">
                    Legislación
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );
}
