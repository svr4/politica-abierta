import type { HTMLAttributeAnchorTarget } from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

export interface AppButtonProps extends ButtonProps {
    loading?: boolean;
    href?: string;
    target?: HTMLAttributeAnchorTarget;
    rel?: string;
}

export default function AppButton({ loading, disabled, children, startIcon, ...props }: AppButtonProps) {
    return (
        <Button
            variant="outlined"
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            startIcon={loading ? <CircularProgress size={16} color="inherit" aria-hidden /> : startIcon}
            {...props}
        >
            {children}
        </Button>
    );
}
