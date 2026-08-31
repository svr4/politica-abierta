import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell as farBell } from '@fortawesome/free-regular-svg-icons';
import { faBell as fasBell, faFileWord, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { UnknownAction } from '@reduxjs/toolkit';

import { useAppDispatch } from '../../../lib/hooks';
import data from '../../../lib/data';
import { updateLegislationSummary, updateLegislationSubscription, updateLegislationEvents } from './hooks';
import { Legislation, LegislationEvent } from '../../../lib/models';
import AppButton from '../../Misc/AppButton';
import LiveRegion from '../../Misc/LiveRegion';
import SummarizeLabel from '../../../lib/SummarizeLabel';

interface LegislationItemProps {
    legislationIndex: number;
    legislation: Legislation;
    updateSummary?: (legislationIndex: number, docIndex: number, summary: string) => UnknownAction;
    updateSubscription?: (legislationId: number, IsSubscribed: boolean) => UnknownAction;
    updateEvents?: (legislationId: number, events: LegislationEvent[]) => UnknownAction;
}

export default function LegislationItem({
    legislationIndex,
    legislation,
    updateSummary = updateLegislationSummary,
    updateSubscription = updateLegislationSubscription,
    updateEvents = updateLegislationEvents,
}: LegislationItemProps) {
    const [showSummary, setShowSummary] = useState<boolean[]>([]);
    const [showEvents, setShowEvents] = useState<boolean>(false);
    const [downloadRadicado, setDownloadRadicado] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
    const [isAddingToWatchlist, setIsAddingToWatchList] = useState(false);

    const dispatch = useAppDispatch();

    async function setProjectWatchList(projectId: number) {
        setIsAddingToWatchList(true);
        const result = await window.imparcialAPI.updateSubscribedProjects(projectId);
        if (!result.Error && result.Data) {
            dispatch(updateSubscription(projectId, !legislation.IsSubscribed));
        }
        setIsAddingToWatchList(false);
    }

    function decodeSummary(summary: string) {
        const text = JSON.parse(`{"parsed": ${summary}}`);
        return text.parsed;
    }

    async function summarizeLegislation(docIndex: number) {
        setIsSummarizing(true);
        if (legislation && legislation.Events && legislation.Events.length > 0) {
            const doc = legislation.Events[docIndex];
            if (doc) {
                if (doc.DocSummary && doc.DocSummary !== '') {
                    const _showSummary = [...showSummary];
                    _showSummary[docIndex] = true;
                    setShowSummary(_showSummary);
                } else {
                    const summaryResult = await window.imparcialAPI.summarizeLegislationDoc(doc.LegEventId);
                    if (!summaryResult.Error) {
                        const summary = summaryResult.Data;
                        if (summary) {
                            const _showSummary = [...showSummary];
                            _showSummary[docIndex] = true;
                            dispatch(updateSummary(legislationIndex, docIndex, summary.Body));
                            setShowSummary(_showSummary);
                        }
                    }
                }
            }
        }
        setIsSummarizing(false);
    }

    async function summarizeRecentLegislation(docIndex: number) {
        setIsSummarizing(true);
        if (legislation && legislation.Events && legislation.Events.length > 0) {
            const doc = legislation.Events[docIndex];
            if (doc) {
                if (doc.DocSummary && doc.DocSummary !== '') {
                    const _showSummary = [...showSummary];
                    _showSummary[docIndex] = true;
                    setShowSummary(_showSummary);
                } else {
                    const summaryResult = await window.imparcialAPI.summarizeRecentLegislationDoc(legislation.LegislationId);
                    if (!summaryResult.Error) {
                        const summary = summaryResult.Data;
                        if (summary) {
                            dispatch(updateSummary(legislationIndex, docIndex, summary.Body));
                            const _showSummary = [...showSummary];
                            _showSummary[docIndex] = true;
                            setShowSummary(_showSummary);
                        }
                    }
                }
            }
        }
        setIsSummarizing(false);
    }

    async function downloadFiledProject() {
        setDownloadRadicado(true);
        const eventResult = await window.imparcialAPI.getFiledProject(legislation.AdministrationId, legislation.LegislationId, legislation.Uri);
        if (!eventResult.Error && eventResult.Data) {
            dispatch(updateEvents(legislation.LegislationId, eventResult.Data));
        }
        setDownloadRadicado(false);
    }

    return (
        <Card
            component="article"
            className="legislation-item"
            key={`legislation_${legislation.LegislationId}_${legislation.Hash}`}
            sx={{ width: '100%', maxWidth: 800, mb: 1.5, boxShadow: '0px 1px 7px gray' }}
        >
            <CardContent>
            <div className="legislation-item-title">
                <Typography component="h2" variant="h6">{legislation.Number}</Typography>
            </div>
            <div className="legislation-controls-container">
                {legislation.Committe !== -1 ? (
                    <AppButton
                        loading={isAddingToWatchlist}
                        onClick={() => void setProjectWatchList(legislation.LegislationId)}
                        aria-label={legislation.IsSubscribed ? 'Remover notificaciones' : 'Notificarme sobre eventos'}
                    >
                        {legislation.IsSubscribed ? (
                            <span><FontAwesomeIcon icon={fasBell} aria-hidden /> Remover Notificaciones</span>
                        ) : (
                            <span><FontAwesomeIcon icon={farBell} aria-hidden /> Notificame sobre Eventos</span>
                        )}
                    </AppButton>
                ) : null}
                <AppButton component="a" href={legislation.Uri} target="_blank" rel="noopener noreferrer" className="content-link">
                    Ver Proyecto
                </AppButton>
            </div>
            <div className="legislation-data-container">
                <div className="legislation-data-item">
                    <Typography component="p"><Typography component="span" sx={{ fontWeight: 'bold' }}>Radicado:</Typography> {legislation.FiledDate}</Typography>
                    {legislation.Committe !== -1 ? (
                        <Typography component="p"><Typography component="span" sx={{ fontWeight: 'bold' }}>Comisión:</Typography> {(data.comisions.find((elem) => elem.id === legislation.Committe))?.name}</Typography>
                    ) : null}
                    <Typography component="p"><Typography component="span" sx={{ fontWeight: 'bold' }}>Autor(es):</Typography> {legislation.Author}</Typography>
                    {legislation.CoAuthor !== '' ? (
                        <Typography component="p"><Typography component="span" sx={{ fontWeight: 'bold' }}>Co-Autor(es):</Typography> {legislation.CoAuthor}</Typography>
                    ) : null}
                    <p>{legislation.Title}</p>
                    <Typography component="p"><Typography component="span" sx={{ fontWeight: 'bold' }}>Último Evento:</Typography> {legislation.LastEvent}</Typography>
                </div>
            </div>
            <br />
            {legislation.Events.length > 0 ? (
                <div className="legislation-doc-container">
                    <Typography component="span" sx={{ fontWeight: 'bold' }}>Eventos:</Typography>
                    &nbsp;
                    <AppButton onClick={() => setShowEvents(!showEvents)} aria-expanded={showEvents}>
                        {showEvents ? 'Ocultar Eventos' : 'Mostrar Eventos'}
                    </AppButton>
                    <br />
                    <br />
                    {showEvents && legislation?.Events.length > 0 ? (
                        <div className="legislation-doc-item-container">
                            {legislation.Events.map((doc, i) => (
                                <div className="legislation-doc-item-row-container" key={`${legislation.LegislationId}_${doc.LegEventId}`}>
                                    <div className="legislation-doc-item-row">
                                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', columnGap: 10 }}>
                                            <div className="legislation-doc-item legislation-doc-title">{doc.Title}</div>
                                            <div className="legislation-doc-item-row-controls">
                                                {doc.HasDocument ? (
                                                    <>
                                                        <AppButton
                                                            component="a"
                                                            href={doc.Uri}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="content-link legislation-doc-item-action"
                                                        >
                                                            Ver Documento&nbsp;
                                                            <span aria-hidden>{!doc.DocType ? null : doc.DocType.includes('doc') ? <FontAwesomeIcon icon={faFileWord} className="doc" /> : <FontAwesomeIcon className="pdf" icon={faFilePdf} />}</span>
                                                        </AppButton>
                                                        <AppButton
                                                            loading={isSummarizing}
                                                            className="legislation-doc-item-action"
                                                            onClick={() => void (doc.LegEventId === -1 ? summarizeRecentLegislation(i) : summarizeLegislation(i))}
                                                            aria-label="Resumir con I.A."
                                                        >
                                                            <SummarizeLabel />
                                                        </AppButton>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>
                                        {doc.Description && doc.Description !== '' ? <div className="legislation-doc-desc">{doc.Description}</div> : null}
                                    </div>
                                    {showSummary && showSummary[i] ? (
                                        <div className="story-ai-summary-container">
                                            <Typography component="p" sx={{ fontWeight: 'bold' }}>Resumen hecho por I.A.:</Typography>
                                            <br />
                                            <br />
                                            <div>{decodeSummary(doc.DocSummary)}</div>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="legislation-doc-container">
                    {downloadRadicado ? (
                        <>
                            <LiveRegion message="Cargando proyecto radicado…" />
                            <span style={{ display: 'flex' }}>Cargando Proyecto Radicado</span>
                        </>
                    ) : (
                        <AppButton onClick={() => void downloadFiledProject()} startIcon={<FontAwesomeIcon icon="bolt" aria-hidden />}>
                            Descargar Proyecto Radicado
                        </AppButton>
                    )}
                    <br />
                    <br />
                </div>
            )}
            </CardContent>
        </Card>
    );
}
