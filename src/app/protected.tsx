import React from "react";
import { useAppSelector, useAppDispatch } from "./lib/hooks";
import { updateSetNotificationsVisible } from './lib/slices/imparcialApp';

interface ProtectedProps {
    children: React.ReactElement
}

export default function Protected({children}: ProtectedProps) {

    const notificationsVisible = useAppSelector((state) =>  state.imparcial.setNotificationsVisible);

    const dispatch = useAppDispatch();

    function toggleNotificationPanel() {
        const nav = document.getElementById("notif_container");
        if(nav) {
            if(notificationsVisible) {
                nav.classList.add("hide-notification-container");
                nav.style.opacity = "0";
                nav.style.visibility = "hidden";
                nav.classList.remove("hide-notification-container");
                nav.classList.add("show-notification-container");
                dispatch(updateSetNotificationsVisible(!notificationsVisible));
            }
        }
    }

    return (
        <div onClick={() => toggleNotificationPanel()}>
            {children}
        </div>
    );

}