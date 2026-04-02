import {useEffect, useState, ReactNode} from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector, useAppDispatch } from "../../lib/hooks";
import { updateLegislation, updatePagination, updateIsFiltering,
    updateRecentLegislation, updateLegislationSource } from "../../lib/slices/legislationList";

import "./LegislationList.css"
import LegislationConfig from "./LegislationConfig";
import Loading from "./LoadLegislation";
import LegislationFilter from "./LegislationFilter";
import { LegislationSourceType } from "../../lib/models";
import { selectCommittees } from "../../lib/slices/appConfig";
import LegislationItem from "./LegislationItem";
import RecentLegislationItem from "./RecentLegislationItem";

export default function LegislationList() {

    const legislation = useAppSelector((state) => state.legislation.Legislation);
    const recentLegislation = useAppSelector((state) => state.legislation.RecentLegislation);
    const isFiltering = useAppSelector((state) => state.legislation.IsFiltering);
    const legislationSourceType = useAppSelector((state) => state.legislation.LegislationSourceType);
    const committees = useAppSelector(selectCommittees);
    const pages = useAppSelector((state) => state.legislation.Pages);
    const page = useAppSelector((state) => state.legislation.Page);

    const dispatch = useAppDispatch();

    const [showRecentSummary, setShowRecentSummary] = useState<boolean[]>([]);

    useEffect(() => {
        (async () => {
            dispatch(updateIsFiltering(true));
            if (committees && committees.length > 0) {
                const legislationResult = await window.imparcialAPI.getLegislations();
                if(!legislationResult.Error) {
                    const _legislation = legislationResult.Data;
                    if(_legislation) {
                        dispatch(updateLegislation(_legislation.Legislation));
                        dispatch(updatePagination(_legislation.Pagination));
                        dispatch(updateLegislationSource(LegislationSourceType.Legislation));
                    }
                }
            }
            else {
                const recentLegislationResult = await window.imparcialAPI.getRecentLegislations();
                if(!recentLegislationResult.Error) {
                    const _legislation = recentLegislationResult.Data;
                    if(_legislation) {
                        dispatch(updateRecentLegislation(_legislation.Legislation));
                        dispatch(updatePagination(_legislation.Pagination));
                        dispatch(updateLegislationSource(LegislationSourceType.RecentLegislation));
                    }
                }
            }
            dispatch(updateIsFiltering(false));
        })()
    }, []);

    useEffect(() => {
    
        if(recentLegislation) {
            let _showSummary = [...showRecentSummary];
            let length = _showSummary.length;
            let docs: boolean[] = [];

            for(let i=0; i < recentLegislation.length; i++) {
                if((i+1) > length) {
                    _showSummary[i] = false;
                }
            }
            setShowRecentSummary(_showSummary);
        }
    
    }, [recentLegislation])

    async function selectLegislationSource(source: LegislationSourceType) {
        dispatch(updateIsFiltering(true));
            
        switch(source) {
            case LegislationSourceType.Legislation: {
                document.getElementById("filterByCommittee")?.classList.add("legislation-source-filter-item-selected");
                document.getElementById("filterByRecent")?.classList.remove("legislation-source-filter-item-selected");
                const legislationResult = await window.imparcialAPI.getLegislations();
                if(!legislationResult.Error) {
                    const legislation = legislationResult.Data;
                    if(legislation) {
                        dispatch(updateLegislation(legislation.Legislation));
                        dispatch(updatePagination(legislation.Pagination));
                    }
                }
                break;
            }
            case LegislationSourceType.RecentLegislation: {
                document.getElementById("filterByRecent")?.classList.add("legislation-source-filter-item-selected");
                document.getElementById("filterByCommittee")?.classList.remove("legislation-source-filter-item-selected");
                const legislationResult = await window.imparcialAPI.getRecentLegislations();
                if(!legislationResult.Error) {
                    const legislation = legislationResult.Data;
                    if(legislation) {
                        dispatch(updateRecentLegislation(legislation.Legislation));
                        dispatch(updatePagination(legislation.Pagination));
                    }
                }
                break;
            }
        }
        dispatch(updateLegislationSource(source));
        dispatch(updateIsFiltering(false));
    }

    function renderLegislation() {
        let _legislation: ReactNode[] = legislation.map((legislation, legislationIndex) => {
            return (
                <LegislationItem key={`legislation_${legislation.LegislationId}_${legislation.Hash}`} legislation={legislation}  legislationIndex={legislationIndex} />
            )
        })
        
        return (
            <>
                {
                    _legislation.length > 0?
                        _legislation : <div>No hay legislaci&oacute;n para presentar <FontAwesomeIcon icon="inbox" /></div>
                }
            </>
        )
    }

    function renderRecentLegislation() {
        let _legislation: ReactNode[] = recentLegislation.map((legislation, legislationIndex) => {
            return (
                <RecentLegislationItem key={`legislation_${legislation.LegislationId}_${legislation.Hash}`} legislation={legislation} legislationIndex={legislationIndex} />
            )
        })
        
        return (
            <>
                {
                    _legislation.length > 0?
                        _legislation : <div>No hay legislaci&oacute;n para presentar <FontAwesomeIcon icon="inbox" /></div>
                }
            </>
        )
    }

    return (
        <>
            <div className="legislation-source-filter-container">
                <div id="filterByCommittee" className={legislationSourceType == LegislationSourceType.Legislation? "legislation-source-filter-item legislation-source-filter-item-selected": "legislation-source-filter-item"} onClick={async () => await selectLegislationSource(LegislationSourceType.Legislation)}>Legislaci&oacute;n por Comisi&oacute;n</div>
                <div id="filterByRecent" className={legislationSourceType == LegislationSourceType.RecentLegislation? "legislation-source-filter-item legislation-source-filter-item-selected": "legislation-source-filter-item"} onClick={async () => await selectLegislationSource(LegislationSourceType.RecentLegislation)}>Legislaci&oacute;n Reciente</div>
            </div>
            <LegislationConfig />
            <LegislationFilter />
            {
                isFiltering?
                    <div className="more-container">
                        <div className="more-item">
                            <div className="more-button">
                                <FontAwesomeIcon icon="bolt" className="more-button-icon" id="more-button-icon" />
                            </div>
                        </div>
                    </div>
                    : <div className="legislation-container">
                        {
                            legislationSourceType == LegislationSourceType.Legislation? renderLegislation() : renderRecentLegislation()
                        }
                    </div>
            }
            {
                // (legislation.length > 0 && legislationSourceType == LegislationSourceType.Legislation) || (recentLegislation.length > 0 && legislationSourceType == LegislationSourceType.RecentLegislation)?
                legislation.length > 0 && pages > 1 && page < pages?
                <Loading /> : <></>
            }
        </>
    )
}