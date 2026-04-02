import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileWord, faFilePdf } from "@fortawesome/free-solid-svg-icons";

import { useAppDispatch } from "../../../lib/hooks";
import { updateRecentLegDocSummary } from "../../../lib/slices/legislationList";
import { RecentLegislation } from "../../../lib/models";

interface RecentLegislationItemProps {
    legislationIndex: number,
    legislation: RecentLegislation
}


export default function RecentLegislationItem({legislationIndex, legislation}: RecentLegislationItemProps) {

    const [showSummary, setShowSummary] = useState<boolean>(false);
    // const isSummarizing = useAppSelector((state) => state.legislation.IsSummarizing);
    const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

    const dispatch = useAppDispatch();

    function decodeSummary(summary: string) {
        // Like Link from The Matrix: Reloaded said: "It's the Hammer!".
        const text = JSON.parse(`{"parsed": ${summary}}`);
        return text.parsed;
    }

    async function summarizeRecentLegislation() {
        setIsSummarizing(true);
        
        if(legislation && legislation.HasDocument) {
            if(legislation.DocSummary && legislation.DocSummary != "") {
                setShowSummary(true);
            }
            else {
                const summaryResult = await window.imparcialAPI.summarizeRecentLegislationDoc(legislation.LegislationId);
                if(!summaryResult.Error) {
                    const summary = summaryResult.Data;
                    if(summary) {
                        dispatch(updateRecentLegDocSummary({Id: legislationIndex, Summary: summary.Body}))
                        setShowSummary(true);
                    }
                }
            }
        }
        setIsSummarizing(false);
    }

    return (
        <div className="legislation-item" key={`recent_legislation_${legislation.LegislationId}_${legislation.Hash}`}>
            <div className="legislation-item-title">
                <div>
                    <label>{legislation.Number}</label>
                </div>
            </div>
            <div className="legislation-controls-container">
                <a href={legislation.Uri} target="_blank" className="button">Ver Proyecto</a>
                {/* <div className="button" title="Notificame de Cambios"><FontAwesomeIcon icon={farBell} /></div> */}
            </div>
            <div className="legislation-data-container">
                <div className="legislation-data-item">
                    <label><strong>Radicado:</strong> {legislation.FiledDate}</label>
                    <br />
                    {legislation.Author != ""? <><br /><label><strong>Autor(es):</strong> {legislation.Author}</label></> : <></>}
                    {legislation.CoAuthor != ""? <><br /><label><strong>Co-Autor(es):</strong> {legislation.CoAuthor}</label></> : <></>}
                    <br />
                    <p>{legislation.Title}</p>
                    <label><strong>&Uacute;ltimo Evento:</strong> <span id="lastEvent">{legislation.LastEvent}</span></label>
                </div>
            </div>
            {
                legislation.HasDocument?
                <div className="legislation-doc-container">
                    <div className="legislation-doc-item-container">
                        <div className="legislation-doc-item-row-container" key={`${legislation.LegislationId}_${legislation.LegislationId}`}>
                            <div className="legislation-doc-item-row">
                                <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", columnGap: 10}}>
                                    <div className="legislation-doc-item legislation-doc-title ">{legislation.DocDesc}</div>
                                    <div className="legislation-doc-item-row-controls">
                                        <a href={legislation.DocUri} target="_blank" className="button legislation-doc-item-action">Ver Documento
                                            <span>{!legislation.DocType? <></> : legislation.DocType.includes("doc")? <FontAwesomeIcon icon={faFileWord} className='doc' /> : <FontAwesomeIcon className='pdf' icon={faFilePdf} />}</span>
                                        </a>
                                        <div onClick={async () => await summarizeRecentLegislation()} className="button legislation-doc-item-action">{isSummarizing? <div className='spinner'></div> : <>Resumir con I.A. &#129302;</>}</div>
                                    </div>
                                </div>

                                {legislation.EventDescription && legislation.EventDescription != ""? <div className="legislation-doc-desc">{legislation.EventDescription}</div> : <></>}
                            </div>
                            {
                                showSummary? <><div className='story-ai-summary-container'><label>Resumen hecho por I.A.:</label><br /><br /><div>{decodeSummary(legislation.DocSummary)}</div></div></>
                                : <></>
                            }
                        </div>
                    </div>
                </div>: <></>
            }
            <br />
        </div>
    );
}