import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { updateSelectedNotification, updateSetNotificationsVisible } from '../../lib/slices/imparcialApp';

import { Notification as AppNotification } from '../../lib/models';

import './NavBar.css';

export default function NavBar() {

    const notificationsVisible = useAppSelector((state) =>  state.imparcial.setNotificationsVisible);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // useEffect(() => {
    //     (async () => {
    //         if((sessionToken && sessionToken != "") && (channelStr && channelStr != "")) {

    //             channel = await events.connect(`/default/${channelStr}`, { authToken: sessionToken });

    //             channel.subscribe({
    //                 next: async (data) => {
    //                     const notifResult = await Api.getNotifications();
    //                     if(!notifResult.Error) {
    //                         const notifs = notifResult.Data;
    //                         if(notifs) {
    //                             const _unread = notifs.reduce((acc, notif): number => {
    //                                 if(!notif.Read) {
    //                                     return acc + 1;
    //                                 }
    //                                 else {
    //                                     return acc;
    //                                 }
    //                             }, 0);
    //                             setNotifications(notifs);
    //                             setUnreadNotifications(_unread);       
    //                         }
    //                     }
    //                     Notification.requestPermission().then((result) => {
    //                         // 'granted', 'default', or 'denied'
    //                         if(result === "granted") {
    //                             new Notification("Nueva Notificación", {
    //                                 badge: "./badge.png",
    //                                 body: "Tiene nueva legislación y/o noticias pendientes.",
    //                                 lang: "es-PR",
    //                                 icon: "./badge.png"
    //                             });
    //                         }
    //                     });
    //                 },
    //                 error: (err) => console.error('error', err),
    //             });
    //         }
    //     })()

    //     return () => {
    //         if(channel) {
    //             channel.close();
    //         }
    //     }
    // }, [sessionToken, channelStr]);

    useEffect(() => {

        (async () => {
            const notifResult = await window.imparcialAPI.getNotifications();
            if(!notifResult.Error) {
                const notifs = notifResult.Data;
                if(notifs) {
                    const _unread = notifs.reduce((acc, notif): number => {
                        if(!notif.Read) {
                            return acc + 1;
                        }
                        else {
                            return acc;
                        }
                    }, 0);
                    setNotifications(notifs);
                    setUnreadNotifications(_unread);       
                }
            }
        })();
    }, []);

    function getElapsedTime(dateStr: string) {
        const notifDate = new Date(dateStr);
        const now = new Date();
        const millisecondDiff = now.getTime() - notifDate.getTime();
        const hourDiff = (millisecondDiff / (1000*60*60));
        if(hourDiff < 1) {
            // get minutes
            const minuteDiff = ((millisecondDiff / (1000*60)) % 60);
            return `Hace ${Math.trunc(minuteDiff)} minutos.`;
        }
        else if (hourDiff > 24) {
            const dayDiff = Math.trunc((millisecondDiff / (1000*60*60*24)));
            if (dayDiff > 1)
                return `Hace ${dayDiff} días.`;
            else
                return `Hace ${dayDiff} día.`;
        }
        else if (hourDiff > 720) {
            return notifDate.toLocaleDateString('es-PR');
        }
        
        return `Hace ${Math.trunc(hourDiff)} horas.`;
    }

    function toggleNotificationPanel() {
        const nav = document.getElementById("notif_container");
        if(nav) {
            if(!notificationsVisible) {
                nav.classList.add("show-notification-container");
                nav.style.opacity = "1";
                nav.style.visibility = "visible";
                nav.classList.remove("show-notification-container");
                nav.classList.add("hide-notification-container");
            }
            else {
                nav.classList.add("hide-notification-container");
                nav.style.opacity = "0";
                nav.style.visibility = "hidden";
                nav.classList.remove("hide-notification-container");
                nav.classList.add("show-notification-container");
            }
        }
        dispatch(updateSetNotificationsVisible(!notificationsVisible));
    }

    function showMenuOnMobile () {
        const mobileEntries = document.getElementsByClassName("nav-mobile-entry");
        if(mobileEntries) {
            for(let i=0; i < mobileEntries.length; i++) {
                mobileEntries[i].classList.toggle("nav-collapse");
            }
        }
    }

    function selectNotification (index: number) {
        dispatch(updateSelectedNotification(notifications[index]))
        navigate(`/notificacion`, {
            replace: true
        });
    }

    return (
        <>
            <div className="nav-bar">
                <div className={`nav-bar-item nav-bar-title`}>
                    <div><Link to="/"><FontAwesomeIcon icon="home" />&nbsp;Inicio</Link> &nbsp; <FontAwesomeIcon onClick={() => showMenuOnMobile()} className='navburger' icon="bars" /></div>
                </div>
                <div className="nav-collapse nav-mobile-entry nav-bar-item">
                    <div>
                        <div style={{color: "var(--color-2)", cursor: "pointer"}} onClick={() => toggleNotificationPanel()}>
                            Notificaciones&nbsp;
                            <span><FontAwesomeIcon icon="bell" /><span style={{color: "red"}}>{unreadNotifications > 0? unreadNotifications : <></>}</span></span>
                        </div>
                        <div id="notif_container" className='notification-container'>
                            <div className='notification-data'>
                                    {
                                        notifications.length > 0? 
                                        notifications.map((val: AppNotification, idx) => {
                                            return (
                                                <div onClick={() => selectNotification(idx)} key={`notification_${val.NotifId}`} className={`notification-item ${val.Read? "" : "notification-item-unread"}`}>
                                                    <p>{val.Message}</p>
                                                    <span style={{fontSize: "small", color: "lightgray"}}>{getElapsedTime(val.NotificationDate)}</span>
                                                    <hr />
                                                </div>
                                            )
                                        }):
                                        <div className='notification-item'>
                                            <p>No hay notifiaciones&nbsp;<FontAwesomeIcon icon="inbox" /></p>
                                            <hr />
                                        </div>
                                    }
                            </div>
                        </div>
                    </div>
                </div>
                <div className="nav-collapse nav-mobile-entry nav-bar-item">
                    <div><Link to="/mis-proyectos">Mis Proyectos&nbsp;<FontAwesomeIcon icon="eye" /></Link></div>
                </div>
                {/* <div className="nav-collapse nav-mobile-entry nav-bar-item">
                    <div><a href='#'>Settings</a></div>
                </div> */}
            </div>
        </>
    )
}