import { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';

import { useAppDispatch } from '../../lib/hooks';
import { updateConfig } from '../../lib/slices/appConfig';
import {
    colorAccent,
    colorPrimaryDark,
} from '../../lib/theme';

const DRAWER_WIDTH = 224;
const TITLEBAR_OFFSET = 'var(--pa-titlebar-h, 28px)';
const DRAWER_PAPER_SX = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box' as const,
    border: 'none',
    background: 'var(--pa-primary-dark)',
    color: '#E8EDF2',
    top: TITLEBAR_OFFSET,
    height: `calc(100% - ${TITLEBAR_OFFSET})`,
};

const navItems = [
    { to: '/', label: 'Feed', end: true, icon: <HomeOutlinedIcon /> },
    { to: '/legislacion', label: 'Legislación', end: false, icon: <GavelOutlinedIcon /> },
    { to: '/alertas', label: 'Alertas', end: false, icon: <NotificationsNoneOutlinedIcon />, badge: true },
    { to: '/resumenes', label: 'Resúmenes IA', end: false, icon: <AutoAwesomeOutlinedIcon /> },
    { to: '/guardados', label: 'Guardados', end: false, icon: <BookmarkBorderOutlinedIcon /> },
];

export default function AppShell() {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:860px)');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const dispatch = useAppDispatch();

    useEffect(() => {
        (async () => {
            const configResult = await window.imparcialAPI.getConfig();
            if (!configResult.Error && configResult.Data) {
                dispatch(updateConfig(configResult.Data));
            }
            const notifResult = await window.imparcialAPI.getNotifications();
            if (!notifResult.Error && notifResult.Data) {
                setUnread(notifResult.Data.reduce((acc, n) => (n.Read ? acc : acc + 1), 0));
            }
        })();
    }, [dispatch]);

    const drawer = (
        <Box
            className="sidebar"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                boxSizing: 'border-box',
            }}
            component="nav"
            aria-label="Principal"
        >
            <Box className="sidebar-logo">
                Política<span className="dot">·</span>Abierta
            </Box>
            <List sx={{ flex: 1, px: 0, py: 0 }}>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.to}
                        component={NavLink}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className="nav-item"
                        sx={{
                            color: '#B9C4D1',
                            borderRadius: '8px',
                            mb: '2px',
                            borderLeft: '3px solid transparent',
                            py: '10px',
                            px: '12px',
                            gap: '10px',
                            '&:hover': {
                                background: 'rgba(255,255,255,0.06)',
                                color: '#fff',
                            },
                            '&.active': {
                                background: 'rgba(15,163,163,0.15)',
                                color: '#fff',
                                borderLeftColor: colorAccent,
                                fontWeight: 500,
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
                            {item.badge ? (
                                <Badge badgeContent={unread} color="primary" max={99}>
                                    {item.icon}
                                </Badge>
                            ) : (
                                item.icon
                            )}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.label}
                            slotProps={{
                                primary: { sx: { fontWeight: 'inherit', fontSize: '14px' } },
                            }}
                        />
                    </ListItemButton>
                ))}
            </List>
            <Box className="sidebar-footer">
                <Typography className="name" component="div">Política Abierta</Typography>
                <Typography className="email" component="div">Escritorio</Typography>
            </Box>
        </Box>
    );

    return (
        <Box
            className="app-shell"
            sx={{ display: 'flex', minHeight: 'calc(100vh - var(--pa-titlebar-h, 28px))', width: '100%', bgcolor: 'background.default' }}
        >
            {isMobile ? (
                <>
                    <Toolbar
                        sx={{
                            position: 'fixed',
                            top: TITLEBAR_OFFSET,
                            left: 0,
                            zIndex: theme.zIndex.drawer + 1,
                            width: '100%',
                            bgcolor: colorPrimaryDark,
                            color: '#E8EDF2',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            minHeight: '52px !important',
                        }}
                    >
                        <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Abrir menú" sx={{ color: '#E8EDF2' }}>
                            <MenuIcon />
                        </IconButton>
                        <Typography sx={{ fontWeight: 600, ml: 1, fontSize: '15px' }}>Política Abierta</Typography>
                    </Toolbar>
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={() => setMobileOpen(false)}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            '& .MuiDrawer-paper': DRAWER_PAPER_SX,
                        }}
                    >
                        {drawer}
                    </Drawer>
                </>
            ) : (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': DRAWER_PAPER_SX,
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            )}
            <Box
                component="main"
                id="main-content"
                className="main"
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    width: '100%',
                    // Clear fixed mobile toolbar; desktop padding comes from .main CSS.
                    pt: isMobile ? '68px' : undefined,
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}
