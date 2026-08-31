import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileWord, faFilePdf } from '@fortawesome/free-solid-svg-icons';

import { useAppDispatch } from '../../../lib/hooks';
import { updateRecentLegDocSummary } from '../../../lib/slices/legislationList';
import { RecentLegislation } from '../../../lib/models';
import AppButton from '../../Misc/AppButton';
import SummarizeLabel from '../../../lib/SummarizeLabel';

interface RecentLegislationItemProps {
    legislationIndex: number;
    legislation: RecentLegislation;
}

export default function RecentLegislationItem({ legislationIndex, legislation }: RecentLegislationItemProps) {
    const [showSummary, setShowSummary] = useState<boolean>(false);
    const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

    const dispatch = useAppDispatch();

    function decodeSummary(summary: string) {
        const text = JSON.parse(`{"parsed": ${summary}}`);
        return text.parsed;
    }

    async function summarizeRecentLegislation() {
        setIsSummarizing(true);

        if (legislation && legislation.HasDocument) {
            if (legislation.DocSummary && legislation.DocSummary !== '') {
                setShowSummary(true);
            } else {
                const summaryResult = await window.imparcialAPI.summarizeRecentLegislationDoc(legislation.LegislationId);
                if (!summaryResult.Error) {
                    const summary = summaryResult.Data;
                    if (summary) {
                        dispatch(updateRecentLegDocSummary({ Id: legislationIndex, Summary: summary.Body }));
                        setShowSummary(true);
                    }
                }
            }
        }
        setIsSummarizing(false);
    }

    return (
        <Card
            component="article"
            className="legislation-item"
            key={`recent_legislation_${legislation.LegislationId}_${legislation.Hash}`}
            sx={{ width: '100%', maxWidth: 800, mb: 1.5, boxShadow: '0px 1px 7px gray' }}
        >
            <CardContent>
            <div className="legislation-item-title">
                <Typography component="h2" variant="h6">{legislation.Number}</Typography>
            </div>
            <div className="legislation-controls-container">
                <AppButton component="a" href={legislation.Uri} target="_blank" rel="noopener noreferrer" className="content-link">
                    Ver Proyecto
                </AppButton>
            </div>
            <div className="legislation-data-container">
                <div className="legislation-data-item">
                    <Typography component="p"><Typography component="span" sx={{ fontWeight: 'bold' }}>Radicado:</Typography> {legislation.FiledDate}</Typography>
                    {legislation.Author !== '' ? (
                        <Typography component="p"><Typography component="span" sx={{ fontWeight: 'bold' }}>Autor(es):</Typography> {legislation.Author}</Typography>
                    ) : null}
                    {legislation.CoAuthor !== '' ? (
                        <Typography component="p"><Typography component="span" sx={{ fontWeight: 'bold' }}>Co-Autor(es):</Typography> {legislation.CoAuthor}</Typography>
                    ) : null}
                    <p>{legislation.Title}</p>
                    <Typography component="p"><Typography component="span" sx={{ fontWeight: 'bold' }}>Último Evento:</Typography> {legislation.LastEvent}</Typography>
                </div>
            </div>
            {legislation.HasDocument ? (
                <div className="legislation-doc-container">
                    <div className="legislation-doc-item-container">
                        <div className="legislation-doc-item-row-container" key={`${legislation.LegislationId}_${legislation.LegislationId}`}>
                            <div className="legislation-doc-item-row">
                                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', columnGap: 10 }}>
                                    <div className="legislation-doc-item legislation-doc-title">{legislation.DocDesc}</div>
                                    <div className="legislation-doc-item-row-controls">
                                        <AppButton
                                            component="a"
                                            href={legislation.DocUri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="content-link legislation-doc-item-action"
                                        >
                                            Ver Documento
                                            <span aria-hidden>{!legislation.DocType ? null : legislation.DocType.includes('doc') ? <FontAwesomeIcon icon={faFileWord} className="doc" /> : <FontAwesomeIcon className="pdf" icon={faFilePdf} />}</span>
                                        </AppButton>
                                        <AppButton
                                            loading={isSummarizing}
                                            className="legislation-doc-item-action"
                                            onClick={() => void summarizeRecentLegislation()}
                                            aria-label="Resumir con I.A."
                                        >
                                            <SummarizeLabel />
                                        </AppButton>
                                    </div>
                                </div>
                                {legislation.EventDescription && legislation.EventDescription !== '' ? (
                                    <div className="legislation-doc-desc">{legislation.EventDescription}</div>
                                ) : null}
                            </div>
                            {showSummary ? (
                                <div className="story-ai-summary-container">
                                    <Typography component="p" sx={{ fontWeight: 'bold' }}>Resumen hecho por I.A.:</Typography>
                                    <br />
                                    <br />
                                    <div>{decodeSummary(legislation.DocSummary)}</div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
            <br />
            </CardContent>
        </Card>
    );
}
