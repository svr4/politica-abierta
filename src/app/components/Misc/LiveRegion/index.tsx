import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

interface LiveRegionProps {
    message?: string;
    children?: ReactNode;
}

export default function LiveRegion({ message, children }: LiveRegionProps) {
    return (
        <Box
            role="status"
            aria-live="polite"
            aria-atomic="true"
            sx={message && !children ? {
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
            } : undefined}
        >
            {children ?? message}
        </Box>
    );
}
