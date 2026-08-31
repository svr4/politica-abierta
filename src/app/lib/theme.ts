import { createTheme } from '@mui/material/styles';

export const colorPrimary = '#1B3A5C';
export const colorPrimaryHover = '#2C5282';
export const colorPrimaryDark = '#0F2438';

export const colorAccent = '#0FA3A3';
export const colorAccentHover = '#0C8484';
export const colorAccentTint = '#CFF4F0';
export const colorAccentText = '#0C6363';

export const colorAlert = '#E8632C';

export const colorBg = '#F5F7FA';
export const colorPaper = '#FFFFFF';
export const colorBorder = '#E2E8F0';
export const colorBorderStrong = '#CBD5E0';
export const colorTextPrimary = '#0A0E14';
export const colorTextSecondary = '#4A5568';
export const colorTextMuted = '#8A94A6';

export const colorAi = colorAccentText;

export const statusColors = {
    aprobado: { bg: '#E7F5EE', color: '#2F855A' },
    enComision: { bg: '#FDF3E1', color: '#B7791F' },
    radicado: { bg: '#EDF0F3', color: '#718096' },
    rechazado: { bg: '#FBEAEA', color: '#C53030' },
    ley: { bg: '#E1F5F2', color: '#0C8484' },
    noticia: { bg: '#F5F7FA', color: '#4A5568' },
} as const;

/** @deprecated Use colorPrimaryDark — kept for CSS var compatibility */
export const color1 = colorPrimaryDark;
/** @deprecated Use colorAccent */
export const color2 = colorAccent;
export const colorSecondaryText = colorTextSecondary;
export const colorVisitedLink = '#0C8484';

const focusOutline = {
    outline: `2px solid ${colorAccent}`,
    outlineOffset: 2,
};

export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: colorAccent,
            dark: colorAccentHover,
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: colorPrimary,
            dark: colorPrimaryDark,
            contrastText: '#FFFFFF',
        },
        background: {
            default: colorBg,
            paper: colorPaper,
        },
        text: {
            primary: colorTextPrimary,
            secondary: colorTextSecondary,
        },
        divider: colorBorder,
        error: {
            main: '#C53030',
        },
        warning: {
            main: '#B7791F',
        },
        success: {
            main: '#2F855A',
        },
    },
    typography: {
        fontFamily: [
            'Inter',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'sans-serif',
        ].join(','),
        fontSize: 14,
    },
    shape: {
        borderRadius: 10,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                ':root': {
                    '--color-1': colorPrimaryDark,
                    '--color-2': colorAccent,
                    '--color-ai': colorAi,
                    '--color-border': colorBorder,
                    '--even-tr-color': 'rgba(15, 163, 163, 0.08)',
                    '--nav-bar-bg': colorPrimaryDark,
                },
                body: {
                    backgroundColor: colorBg,
                    color: colorTextPrimary,
                },
                '.skip-link': {
                    position: 'absolute',
                    left: '-9999px',
                    zIndex: 9999,
                    padding: '8px 16px',
                    backgroundColor: colorAccent,
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    '&:focus': {
                        left: '16px',
                        top: '16px',
                        ...focusOutline,
                    },
                },
                'a.content-link': {
                    color: colorAccentText,
                    textDecoration: 'underline',
                    '&:visited': {
                        color: colorVisitedLink,
                    },
                    '&:focus-visible': focusOutline,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: colorPrimaryDark,
                    color: '#E8EDF2',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: colorPrimaryDark,
                    color: '#E8EDF2',
                    borderRight: 'none',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: colorPaper,
                    border: `1px solid ${colorBorder}`,
                    boxShadow: 'none',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                    boxShadow: 'none',
                    fontWeight: 500,
                    '&:focus-visible': focusOutline,
                },
                outlined: {
                    borderColor: colorBorderStrong,
                    color: colorTextPrimary,
                    '&:hover': {
                        backgroundColor: colorBg,
                        borderColor: colorBorderStrong,
                    },
                },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    textDecoration: 'underline',
                    '&:visited': {
                        color: colorVisitedLink,
                    },
                    '&:focus-visible': focusOutline,
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    '&:focus-visible': focusOutline,
                },
            },
        },
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    borderColor: 'transparent',
                    borderRadius: '20px !important',
                    color: colorTextSecondary,
                    px: 1.5,
                    '&:focus-visible': focusOutline,
                    '&.Mui-selected': {
                        backgroundColor: colorTextPrimary,
                        color: '#FFFFFF',
                        '&:hover': {
                            backgroundColor: colorPrimaryDark,
                        },
                    },
                    '&:not(.Mui-selected):hover': {
                        backgroundColor: colorBorder,
                    },
                },
            },
        },
        MuiToggleButtonGroup: {
            styleOverrides: {
                grouped: {
                    border: '1px solid transparent !important',
                    marginLeft: '0 !important',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    fontWeight: 500,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderColor: colorBorder,
                },
                head: {
                    color: colorTextSecondary,
                    fontWeight: 500,
                    backgroundColor: colorBg,
                    fontSize: '0.75rem',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: colorPaper,
                        borderRadius: 8,
                        '& fieldset': {
                            borderColor: colorBorderStrong,
                        },
                        '&:hover fieldset': {
                            borderColor: colorBorderStrong,
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: colorAccent,
                        },
                    },
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    backgroundColor: colorAccent,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    color: colorTextSecondary,
                    '&.Mui-selected': {
                        color: colorTextPrimary,
                    },
                },
            },
        },
    },
});
