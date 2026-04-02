import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../lib/hooks";
import { selectCommittees, updateLegislationFilter } from "../../../lib/slices/appConfig";
import { updateIsFiltering, updateLegislation, updatePagination, updateLegislationSource } from "../../../lib/slices/legislationList";

import './LegislationFilter.css';
import data from "../../../lib/data";
import { LegislationSourceType } from "../../../lib/models";

export default function LegislationFilter() {

    const [searchText, setSearchText] = useState("");
    const [selectedCommittee, setSelectedCommittee] = useState(-1);

    const committees = useAppSelector(selectCommittees);

    const dispatch = useAppDispatch();

    useEffect(() => {
        (async () => {
            setSearchText("");
            if(selectedCommittee > -1) {
                dispatch(updateIsFiltering(true));
                // filter
                const filter = {
                    searchText,
                    committee: selectedCommittee
                };

                const legilsationResult = await window.imparcialAPI.getLegislations(undefined, undefined, filter);
                dispatch(updateLegislationFilter(filter));
                if(!legilsationResult.Error) {
                    const legislation = legilsationResult.Data;
                    if(legislation) {
                        dispatch(updateLegislation(legislation.Legislation));
                        dispatch(updatePagination(legislation.Pagination));
                    }
                }
                dispatch(updateIsFiltering(false));
            }
        })()
    }, [selectedCommittee])

    // useEffect(() => {
    //     console.log("UseEffect", committees);
    // }, [committees])

    async function searchLegislation() {
        if(searchText != "") {
            dispatch(updateIsFiltering(true));
            // filter
            const filter = {
                searchText,
                committee: selectedCommittee
            };

            const legislationResult = await window.imparcialAPI.searchLegislation(searchText);
            dispatch(updateLegislationFilter(filter))
            if(!legislationResult.Error) {
                const legislation = legislationResult.Data;
                if(legislation) {
                    dispatch(updateLegislation(legislation.Legislation));
                    dispatch(updatePagination(legislation.Pagination));
                    dispatch(updateLegislationSource(LegislationSourceType.Legislation));
                }
            }

            dispatch(updateIsFiltering(false));
        }
    }

    return (
        <>
            <div className="legislation-filter-container">
                <div className="legislation-filter-controls-container">
                    <div>
                        <div style={{display: "flex", flexDirection: "row"}}>
                            <input type="text" onChange={(e) => setSearchText(e.target.value)} className="textbox-w-button" placeholder="Búsqueda..." />
                            <div className="textbox-button" onClick={async () => await searchLegislation()}>Buscar</div>
                        </div>
                    </div>
                    <div>
                        <select onChange={(e) => setSelectedCommittee(parseInt(e.target.value))} className="committee-select">
                            <option value="-1">Seleccione una Comisión</option>
                            {
                                committees?.map((elem, i) => {
                                    const found = data.comisions.find((e) => e.id == elem.CommitteeId);
                                    return (
                                        <option key={`filtered_committees_${i}`} value={found?.id}>{found?.name}</option>
                                    )
                                })
                            }
                        </select>
                    </div>
                </div>
            </div>
        </>
    )
}