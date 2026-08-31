import Box from '@mui/material/Box';
import AppButton from '../Misc/AppButton';
import LiveRegion from '../Misc/LiveRegion';
import { useAppSelector, useAppDispatch } from '../../lib/hooks';
import { appendStories, updateIsFetching, updatePagination } from '../../lib/slices/storyList';

export default function Loading() {
    const isFetching = useAppSelector((state) => state.story.IsFetching);
    const currentPage = useAppSelector((state) => state.story.Page);
    const currentLimit = useAppSelector((state) => state.story.Limit);
    const currentSource = useAppSelector((state) => state.story.Source);

    const dispatch = useAppDispatch();

    async function getAdditionalStories() {
        dispatch(updateIsFetching(true));
        const storyResult = await window.imparcialAPI.getStories(currentPage + 1, currentLimit, currentSource);
        if (!storyResult.Error) {
            const stories = storyResult.Data;
            if (stories) {
                dispatch(appendStories(stories.Stories));
                dispatch(updatePagination({
                    Source: stories.Pagination.Source,
                    Page: stories.Pagination.Page,
                    Limit: stories.Pagination.Limit,
                    Pages: stories.Pagination.Pages,
                    Total: stories.Pagination.Total,
                }));
            }
        }
        dispatch(updateIsFetching(false));
    }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            {isFetching ? (
                <>
                    <LiveRegion message="Cargando más noticias…" />
                    <span>Cargando…</span>
                </>
            ) : (
                <AppButton onClick={() => void getAdditionalStories()}>
                    Más Noticias
                </AppButton>
            )}
        </Box>
    );
}
