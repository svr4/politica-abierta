import React, { useState, useEffect, useRef, useId } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InboxIcon from '@mui/icons-material/Inbox';

import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { updateSelectedNotification, updateSetNotificationsVisible } from '../../lib/slices/imparcialApp';
import { Notification as AppNotification } from '../../lib/models';
import { getRelativeTime } from '../../lib/relativeTime';

export default function NavBar() {
    const notificationsVisible = useAppSelector((state) => state.imparcial.setNotificationsVisible);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
    const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const notifAnchorRef = useRef<HTMLButtonElement>(null);
    const notifTitleId = useId();
    const isHome = location.pathname === '/' || location.pathname === '';

    useEffect(() => {
        (async () => {
            const notifResult = await window.imparcialAPI.getNotifications();
            if (!notifResult.Error) {
                const notifs = notifResult.Data;
                if (notifs) {
                    const _unread = notifs.reduce((acc, notif): number => {
                        if (!notif.Read) {
                            return acc + 1;
                        }
                        return acc;
                    }, 0);
                    setNotifications(notifs);
                    setUnreadNotifications(_unread);
                }
            }
        })();
    }, []);

    function openNotifications(anchor: HTMLElement) {
        setNotifAnchorEl(anchor);
        dispatch(updateSetNotificationsVisible(true));
    }

    function closeNotifications() {
        dispatch(updateSetNotificationsVisible(false));
        setNotifAnchorEl(null);
    }

    function toggleNotificationPanel(anchor: HTMLElement) {
        if (notificationsVisible) {
            closeNotifications();
        } else {
            openNotifications(anchor);
        }
    }

    function selectNotification(index: number) {
        dispatch(updateSelectedNotification(notifications[index]));
        closeNotifications();
        navigate('/notificacion', { replace: true });
    }

    const notificationAriaLabel = unreadNotifications > 0
        ? `Notificaciones, ${unreadNotifications} sin leer`
        : 'Notificaciones';

    const navLinkSx = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        color: 'primary.main',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '1.25rem',
    };

    const notificationsControl = (
        <IconButton
            ref={notifAnchorRef}
            color="primary"
            onClick={(e) => toggleNotificationPanel(e.currentTarget)}
            aria-label={notificationAriaLabel}
            aria-expanded={notificationsVisible}
            aria-controls="notif_container"
        >
            <Badge badgeContent={unreadNotifications > 0 ? unreadNotifications : undefined} color="error">
                <NotificationsIcon />
            </Badge>
        </IconButton>
    );

    const myProjectsLink = (
        <Link component={RouterLink} to="/mis-proyectos" sx={navLinkSx} aria-current={location.pathname === '/mis-proyectos' ? 'page' : undefined}>
            Mis Proyectos&nbsp;<VisibilityIcon fontSize="small" aria-hidden />
        </Link>
    );

    return (
        <>
            <AppBar position="static" elevation={0} component="nav" aria-label="Principal">
                <Toolbar
                    sx={{
                        justifyContent: isMobile ? 'center' : 'space-evenly',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 1 : 0,
                        py: isMobile ? 1 : 0,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Link
                            component={RouterLink}
                            to="/"
                            sx={navLinkSx}
                            aria-current={isHome ? 'page' : undefined}
                        >
                            <HomeIcon fontSize="small" aria-hidden />
                            Inicio
                        </Link>
                        {isMobile && (
                            <IconButton color="primary" onClick={(e) => setMobileMenuAnchor(e.currentTarget)} aria-label="Menú de navegación">
                                <MenuIcon />
                            </IconButton>
                        )}
                    </Box>

                    {!isMobile && (
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography component="span" sx={{ color: 'primary.main', fontWeight: 'bold', fontSize: '1.25rem' }}>
                                Notificaciones
                            </Typography>
                            {notificationsControl}
                        </Box>
                    )}
                    {!isMobile && myProjectsLink}
                </Toolbar>
            </AppBar>

            <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={() => setMobileMenuAnchor(null)}
            >
                <MenuItem onClick={(e) => { setMobileMenuAnchor(null); openNotifications(e.currentTarget); }}>
                    Notificaciones
                    {unreadNotifications > 0 && (
                        <Typography component="span" color="error" sx={{ ml: 1 }}>
                            ({unreadNotifications})
                        </Typography>
                    )}
                </MenuItem>
                <MenuItem
                    component={RouterLink}
                    to="/mis-proyectos"
                    onClick={() => setMobileMenuAnchor(null)}
                >
                    Mis Proyectos
                </MenuItem>
            </Menu>

            <Popover
                id="notif_container"
                open={notificationsVisible}
                anchorEl={notifAnchorEl ?? notifAnchorRef.current}
                onClose={closeNotifications}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: { width: 350, maxHeight: 600, mt: 1 },
                        'aria-labelledby': notifTitleId,
                    },
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <Typography id={notifTitleId} component="h2" variant="h6" sx={{ px: 2, pt: 2, pb: 1 }}>
                    Notificaciones
                </Typography>
                <List dense disablePadding sx={{ overflowY: 'auto', maxHeight: 520 }}>
                    {notifications.length > 0 ? (
                        notifications.map((val: AppNotification, idx) => (
                            <React.Fragment key={`notification_${val.NotifId}`}>
                                <ListItemButton
                                    onClick={() => selectNotification(idx)}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        bgcolor: val.Read ? 'transparent' : 'rgba(203, 242, 249, 0.1)',
                                    }}
                                >
                                    <ListItemText primary={val.Message} />
                                    <Typography variant="caption" color="text.secondary">
                                        {getRelativeTime(val.NotificationDate)}
                                    </Typography>
                                </ListItemButton>
                                <Divider />
                            </React.Fragment>
                        ))
                    ) : (
                        <ListItemButton disabled sx={{ flexDirection: 'row', gap: 1 }}>
                            <ListItemText primary="No hay notificaciones" />
                            <InboxIcon fontSize="small" aria-hidden />
                        </ListItemButton>
                    )}
                </List>
            </Popover>
        </>
    );
}
