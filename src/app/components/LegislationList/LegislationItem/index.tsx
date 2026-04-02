import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell as farBell } from "@fortawesome/free-regular-svg-icons";
import { faBell as fasBell, faFileWord, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { UnknownAction } from "@reduxjs/toolkit";

import { useAppDispatch } from "../../../lib/hooks";
import data from "../../../lib/data";
import { updateLegislationSummary, updateLegislationSubscription, updateLegislationEvents } from './hooks';
import { Legislation, LegislationEvent } from "../../../lib/models";

interface LegislationItemProps {
    legislationIndex: number,
    legislation: Legislation,
    updateSummary?: (legislationIndex: number, docIndex: number, summary: string) => UnknownAction,
    updateSubscription?: (legislationId: number, IsSubscribed: boolean) => UnknownAction,
    updateEvents?: (legislationId: number, events: LegislationEvent[]) => UnknownAction
}


export default function LegislationItem({legislationIndex, legislation, updateSummary = updateLegislationSummary, updateSubscription = updateLegislationSubscription, updateEvents = updateLegislationEvents}: LegislationItemProps) {

    const [showSummary, setShowSummary] = useState<boolean[]>([]);
    const [showEvents, setShowEvents] = useState<boolean>(false);
    const [downloadRadicado, setDownloadRadicado] = useState(false);
    // const isSummarizing = useAppSelector((state) => state.legislation.IsSummarizing);
    const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

    const [isAddingToWatchlist, setIsAddingToWatchList] = useState(false);

    const dispatch = useAppDispatch();


    async function setProjectWatchList(projectId: number) {
        setIsAddingToWatchList(true);
        const result = await window.imparcialAPI.updateSubscribedProjects(projectId);
        if(!result.Error && result.Data) {
            // dispatch(updateIsSubscribedToProject({LegislationId: projectId, IsSubscribed: !legislation.IsSubscribed}));
            dispatch(updateSubscription(projectId, !legislation.IsSubscribed));
        }
        setIsAddingToWatchList(false);
    }

    function decodeSummary(summary: string) {
        // Like Link from The Matrix: Reloaded said: "It's the Hammer!".
        const text = JSON.parse(`{"parsed": ${summary}}`);
        return text.parsed;
    }

    async function summarizeLegislation(docIndex: number) {
        // dispatch(updateIsSummarizing(true));
        setIsSummarizing(true);

        if(legislation && (legislation.Events && legislation.Events.length > 0)) {
            const doc = legislation.Events[docIndex];
            if(doc) {
                if(doc.DocSummary && doc.DocSummary != "") {
                    let _showSummary = [...showSummary];
                    _showSummary[docIndex] = true;
                    setShowSummary(_showSummary);
                }
                else {
                    const summaryResult = await window.imparcialAPI.summarizeLegislationDoc(doc.LegEventId);
                    if(!summaryResult.Error) {
                        const summary = summaryResult.Data;
                        if(summary) {
                            let _showSummary = [...showSummary];
                            _showSummary[docIndex] = true;
                            dispatch(updateSummary(legislationIndex, docIndex, summary.Body));
                            setShowSummary(_showSummary);
                        }
                    }
                }
            }
        }

        setIsSummarizing(false);
        // dispatch(updateIsSummarizing(false));
    }

    async function summarizeRecentLegislation(docIndex: number) {
        // dispatch(updateIsSummarizing(true));
        setIsSummarizing(true);
        if(legislation && (legislation.Events && legislation.Events.length > 0)) {
            let doc = legislation.Events[docIndex];
            if(doc) {
                if(doc.DocSummary && doc.DocSummary != "") {
                    let _showSummary = [...showSummary];
                    _showSummary[docIndex] = true;
                    setShowSummary(_showSummary);
                }
                else {
                    const summaryResult = await window.imparcialAPI.summarizeRecentLegislationDoc(legislation.LegislationId);
                    if(!summaryResult.Error) {
                        const summary = summaryResult.Data;
                        if(summary) {
                            // let _legislation = Object.assign({}, legislation);
                            // legislation.Events[docIndex].DocSummary = summary.Body;
                            // dispatch(updateLegDocSummary({Id: legislationIndex, docIndex, Summary: summary.Body}))
                            dispatch(updateSummary(legislationIndex, docIndex, summary.Body));
                            let _showSummary = [...showSummary];
                            _showSummary[docIndex] = true;
                            setShowSummary(_showSummary);
                        }
                    }
                }
            }
        }
        setIsSummarizing(false);
        // dispatch(updateIsSummarizing(false));
    }

    async function downloadFiledProject() {
        setDownloadRadicado(true);
        const eventResult = await window.imparcialAPI.getFiledProject(legislation.AdministrationId, legislation.LegislationId, legislation.Uri);
        if(!eventResult.Error && eventResult.Data) {
            dispatch(updateEvents(legislation.LegislationId, eventResult.Data));
        }
        setDownloadRadicado(false);
    }

    return (
        <div className="legislation-item" key={`legislation_${legislation.LegislationId}_${legislation.Hash}`}>
            <div className="legislation-item-title">
                <div>
                    <label>{legislation.Number}</label>
                </div>
            </div>
            <div className="legislation-controls-container">
                {
                    legislation.Committe != -1?
                    <div onClick={async () => await setProjectWatchList(legislation.LegislationId)} className="button">
                    {
                        isAddingToWatchlist? <div className='spinner'></div> :
                        legislation.IsSubscribed? <span><FontAwesomeIcon icon={fasBell} />&nbsp; Remover Notificaciones</span> :
                        <span><FontAwesomeIcon icon={farBell} />&nbsp; Notificame sobre Eventos</span>
                    }
                    </div> : <></>
                }
                <a href={legislation.Uri} target="_blank" className="button">Ver Proyecto</a>
            </div>
            <div className="legislation-data-container">
                <div className="legislation-data-item">
                    <label><strong>Radicado:</strong> {legislation.FiledDate}</label>
                    <br />
                    {
                        legislation.Committe != -1?
                        <>
                            <label><strong>Comisi&oacute;n:</strong> {(data.comisions.find((elem) => elem.id == legislation.Committe))?.name}</label>
                            <br />
                        </> : <></>
                    }
                    <label><strong>Autor(es):</strong> {legislation.Author}</label>
                    {legislation.CoAuthor != ""? <><br /><label><strong>Co-Autor(es):</strong> {legislation.CoAuthor}</label></> : <></>}
                    <br />
                    <p>{legislation.Title}</p>
                    <label><strong>&Uacute;ltimo Evento:</strong> <span id="lastEvent">{legislation.LastEvent}</span></label>
                </div>
            </div>
            <br />
            {
                legislation.Events.length > 0?
                    <div className="legislation-doc-container">
                    <label>Eventos:</label>
                    &nbsp;
                    <a onClick={() => setShowEvents(!showEvents)} className="button">Mostrar Eventos</a>
                    <br />
                    <br />
                    {
                        showEvents && legislation?.Events.length > 0?
                        <>
                            <div className="legislation-doc-item-container">
                                {
                                    legislation.Events.map((doc, i) => {
                                        return (
                                            <div className="legislation-doc-item-row-container" key={`${legislation.LegislationId}_${doc.LegEventId}`}>
                                                <div className="legislation-doc-item-row">
                                                    <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", columnGap: 10}}>
                                                        <div className="legislation-doc-item legislation-doc-title ">{doc.Title}</div>
                                                        <div className="legislation-doc-item-row-controls">
                                                            {
                                                                doc.HasDocument?
                                                                <>
                                                                    <a href={doc.Uri} target="_blank" className="button legislation-doc-item-action">Ver Documento&nbsp;
                                                                        <span>{!doc.DocType? <></> : doc.DocType.includes("doc")? <FontAwesomeIcon icon={faFileWord} className='doc' /> : <FontAwesomeIcon className='pdf' icon={faFilePdf} />}</span></a>
                                                                        {
                                                                            doc.LegEventId == -1?
                                                                            <div onClick={async () => await summarizeRecentLegislation(i)} className="button legislation-doc-item-action">{isSummarizing? <div className='spinner'></div> : <>Resumir con I.A. &#129302;</>}</div>:
                                                                            <div onClick={async () => await summarizeLegislation(i)} className="button legislation-doc-item-action">{isSummarizing? <div className='spinner'></div> : <>Resumir con I.A. &#129302;</>}</div>
                                                                        }
                                                                </>
                                                                : <></>
                                                            }
                                                        </div>
                                                    </div>
                                                    {doc.Description && doc.Description != ""? <div className="legislation-doc-desc">{doc.Description}</div> : <></>}
                                                </div>
                                                {
                                                    showSummary && showSummary[i]? <><div className='story-ai-summary-container'><label>Resumen hecho por I.A.:</label><br /><br /><div>{decodeSummary(doc.DocSummary)}</div></div></>
                                                    : <></>
                                                }
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </>: <></>
                    }
                </div> :
                // No events to render. Show button to download Radicado.
                <>
                    <div className="legislation-doc-container">
                        { downloadRadicado? <><span style={{display: "flex"}}><div className='spinner'></div>&nbsp;Cargando Proyecto Radicado</span></>: <a onClick={async () => await downloadFiledProject()} className="button"><FontAwesomeIcon icon="bolt" />&nbsp;Descargar Proyecto Radicado</a>}
                        <br />
                        <br />
                    </div>
                </>
            }
        </div>
    );
}