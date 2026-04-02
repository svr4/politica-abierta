import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell as farBell } from "@fortawesome/free-regular-svg-icons";
import { useAppSelector, useAppDispatch } from "../../../lib/hooks";
import { faBell as fasBell, faFileWord, faFilePdf } from "@fortawesome/free-solid-svg-icons";

import NavBar from "../../NavBar";
import { Legislation, RecentLegislation } from '../../../lib/models';
import data from '../../../lib/data';

import '../LegislationList.css';

interface LegislationDetailProps
{
    showNav?: boolean,
    hash?: string,
    legislationId?: number
}

export default function LegislationDetail({showNav = true, hash, legislationId}: LegislationDetailProps) {

    let params = useParams();
    const dispatch = useAppDispatch();

    const [legislation, setLegislation] = useState<Legislation|undefined>();
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showSummary, setShowSummary] = useState<boolean[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingToWatchlist, setIsAddingToWatchList] = useState(false);
    const [showEvents, setShowEvents] = useState(false);

    useEffect(() => {
        (async () => {
            if(legislationId && legislationId > 0) {
                const legislationResult = await window.imparcialAPI.getLegislationById(legislationId);
                if(!legislationResult.Error) {
                    const _leg = legislationResult.Data;
                    if(_leg) {
                        const _showSummary = _leg.Events.map(() => false);
                        setLegislation(_leg);
                        setShowSummary(_showSummary);
                        setIsLoading(false);
                    }
                }
            }
            else {
                let _hash = "";
                if(hash && hash != "") {
                    _hash = hash
                }
                else {
                    _hash = params.hash as string;
                }
                const legislationResult = await window.imparcialAPI.getLegislationByHash(_hash);
                if(!legislationResult.Error) {
                    const _leg = legislationResult.Data;
                    if(_leg) {
                        const _showSummary = _leg.Events.map(() => false);
                        setLegislation(_leg);
                        setShowSummary(_showSummary);
                        setIsLoading(false);
                    }
                }
            }
        })()
        setIsLoading(true);
    }, []);

    async function setProjectWatchList(projectId: number = -1) {
        setIsAddingToWatchList(true);
        if(projectId > 0) {
            await window.imparcialAPI.updateSubscribedProjects(projectId);
        }
        setIsAddingToWatchList(false);
    }

    async function summarizeLegislation(docIndex: number) {
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
                    const summaryResult = await window.imparcialAPI.summarizeLegislationDoc(doc.LegEventId);
                    if(!summaryResult.Error) {
                        const summary = summaryResult.Data;
                        if(summary) {
                            let _legislation = Object.assign({}, legislation);
                            _legislation.Events[docIndex].DocSummary = summary.Body;
                            let _showSummary = [...showSummary];
                            _showSummary[docIndex] = true;
                            setLegislation(_legislation);
                            setShowSummary(_showSummary);
                        }
                    }
                }
            }
        }
        setIsSummarizing(false);
    }

    async function summarizeRecentLegislation(legislationId: number, docIndex: number) {
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
                    const summaryResult = await window.imparcialAPI.summarizeRecentLegislationDoc(legislationId);
                    if(!summaryResult.Error) {
                        const summary = summaryResult.Data;
                        if(summary) {
                            let _legislation = Object.assign({}, legislation);
                            _legislation.Events[docIndex].DocSummary = summary.Body;
                            let _showSummary = [...showSummary];
                            _showSummary[docIndex] = true;
                            setLegislation(_legislation);
                            setShowSummary(_showSummary);
                        }
                    }
                }
            }
        }
        setIsSummarizing(false);
    }

    function decodeSummary(summary: string) {
        // Like Link from The Matrix: Reloaded said: "It's the Hammer!".
        const text = JSON.parse(`{"parsed": ${summary}}`);
        return text.parsed;
    }

    return (
        <>
            {
                showNav? <NavBar /> : <></>
            }
            <br />
            <div className="legislation-container">
                <div className="legislation-item" key={legislation?.LegislationId}>
                    <div className="legislation-item-title">
                        <div>
                            {isLoading? <div className='skeleton-text-line short'></div> : <label>{legislation?.Number}</label>}
                        </div>
                    </div>
                    <div className="legislation-controls-container">
                        {
                            legislation?.Committe?
                            <>
                                {isLoading? <div className='skeleton-text-line short'></div>:
                                    <div onClick={async () => await setProjectWatchList(legislation?.LegislationId)} className="button">
                                        {
                                            isAddingToWatchlist? <div className='spinner'></div> :
                                            legislation.IsSubscribed? <span><FontAwesomeIcon icon={fasBell} />&nbsp; Remover Notificaciones</span> :
                                            <span><FontAwesomeIcon icon={farBell} />&nbsp; Notificame sobre Eventos</span>
                                        }
                                    </div>
                                }
                            </>: <></>
                        }
                        {isLoading? <div className='skeleton-text-line short'></div> : <a href={legislation?.Uri} target="_blank" className="button">Ver Proyecto</a>}
                    </div>
                    <div className="legislation-data-container">
                        <div className="legislation-data-item">
                            {isLoading? <div className='skeleton-text-line short'></div> : <label><strong>Radicado:</strong> {legislation?.FiledDate}</label>}
                            <br />
                            {isLoading? <div className='skeleton-text-line'></div> : legislation?.Committe? <><label><strong>Comisi&oacute;n:</strong> {(data.comisions.find((elem) => elem.id == legislation?.Committe))?.name}</label><br /></> : <></>}
                            {isLoading? <div className='skeleton-text-line medium'></div> : <>
                                <label><strong>Autor(es):</strong> {legislation?.Author}</label>
                                {legislation?.CoAuthor != ""? <><br /><label><strong>Co-Autor(es):</strong> {legislation?.CoAuthor}</label></> : <></>}
                            </>}
                            <br />
                            {isLoading? <div className='skeleton-block'></div> : <>
                                <p>{legislation?.Title}</p>
                                <label><strong>&Uacute;ltimo Evento:</strong> <span id="lastEvent">{legislation?.LastEvent}</span></label>
                            </>}
                        </div>
                    </div>
                    <br />
                    {
                        legislation && legislation.Events.length > 0?
                        <div className="legislation-doc-container">
                            <label>Eventos:</label>
                            &nbsp;
                            <a onClick={() => setShowEvents(!showEvents)} className="button">Mostrar Eventos</a>
                            <br />
                            <br />
                            {
                                showEvents && legislation?.Events.length > 0?
                                <div className="legislation-doc-item-container">
                                {
                                    legislation?.Events.map((doc, i) => {
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
                                                                    <div onClick={async () => legislation.Committe == -1? await summarizeRecentLegislation(legislation.LegislationId, i) : await summarizeLegislation(i)}
                                                                    className="button legislation-doc-item-action">{isSummarizing? <div className='spinner'></div> : <>Resumir con I.A. &#129302;</>}</div>
                                                                </>
                                                                : <></>
                                                            }
                                                        </div>
                                                    </div>
                                                    {doc.Description && doc.Description != ""? <div className="legislation-doc-desc">{doc.Description}</div> : <></>}
                                                </div>
                                                {
                                                    showSummary[i]? <><div className='story-ai-summary-container'><label>Resumen hecho por I.A.:</label><br /><br /><div>{decodeSummary(doc.DocSummary)}</div></div></>
                                                    : <></>
                                                }
                                            </div>
                                        )
                                    })
                                }
                                </div>: <></>
                            }
                        </div>: <><br /></>
                    }
                </div>
            </div>
        </>
    )
}