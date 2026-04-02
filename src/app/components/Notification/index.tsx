import { useEffect, useState } from "react";
import { useAppSelector } from "../../lib/hooks";

import NavBar from "../NavBar";
import StoryDetail from "../StoryList/StoryDetail";
import LegislationDetail from "../LegislationList/LegislationDetail";


export default function Notification() {

    const matched_legislation: string[] = useAppSelector((state) => state.imparcial.selectedNotification?.MatchedLegislation || []);
    const matched_news: string[] = useAppSelector((state) => state.imparcial.selectedNotification?.MatchedNews || []);
    const matched_projects: number[] = useAppSelector((state) => state.imparcial.selectedNotification?.MatchedProjectsForEvents || []);
    const notifId = useAppSelector((state) => state.imparcial.selectedNotification?.NotifId);

    

    useEffect(() => {
        if(notifId) {
            (async () => {
                await window.imparcialAPI.markNotificationAsRead(notifId);
            })()
        }
    }, [notifId])

    return (
        <>
            <NavBar />
            {
                matched_news.length > 0?
                <>
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                        <h1>Noticias Filtradas</h1>
                    </div>
                    {
                        matched_news.map((val, idx) => {
                            return <StoryDetail key={`matched_news_${val}`} showNav={false} hash={val} />
                        })
                    }
                </>:<></>
            }
            {
                matched_legislation.length > 0?
                <>
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                        <h1>Legislaci&oacute;n Filtrada</h1>
                    </div>
                    {
                        matched_legislation.map((val, idx) => {
                            return <LegislationDetail key={`matched_legislation_${val}`} showNav={false} hash={val} />
                        })
                    }
                </>: <></>
            }
            {
                matched_projects.length > 0?
                <>
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                        <h1>Proyectos con Eventos Nuevos</h1>
                    </div>
                    {
                        matched_projects.map((val, idx) => {
                            return <LegislationDetail key={`matched_legislation_${val}`} showNav={false} legislationId={val} />
                        })
                    }
                </>: <></>
            }
        </>
    );
}