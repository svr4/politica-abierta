import React, {useState, useEffect, ReactElement} from "react";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { selectCommittees, updateConfig } from "../../../lib/slices/appConfig";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import data from "../../../lib/data";

import "./LegislationConfig.css";
import { ScrapingJobState } from "../../../lib/models";

export default function LegislationConfig() {

    const administrationId = 2025;
	const committiees = [
		1018, 1019, 1014, 1017, 1015, 1020, 969, 965, 994, 968, 967, 983, 992,
		966, 995, 971, 996, 979, 997, 981, 972, 998, 974, 999, 1021, 1000, 962,
		1001, 963, 1002, 1013, 1004, 989, 988, 986, 984, 987, 985, 964, 1003,
		973, 1005, 975, 976, 1006, 993, 977, 1007, 990, 1008, 991, 1009, 978,
		1010, 980, 1011, 1012, 982, 970, 1016
	];

    const [showConfig, setShowConfig] = useState(false);
    const [isFetchingLaws, setIsFetchingLaws] = useState(true);
    const [loadLegislation, setLoadLegislation] = useState(true);
    const [loadRecentLegislation, setLoadRecentLegislation] = useState(true);
    const [filters, setFilters] = useState<string[]>([]);
    const [notifyOnNew, setNotifyOnNew] = useState(false);
    const [selectedCommitteeId, setSelectedCommitteeId] = useState(-1);

    const committees = useAppSelector(selectCommittees);

    const dispatch = useAppDispatch();

    useEffect(() => {
        
        (async () => {
            const isFetchingLawResponse = await window.imparcialAPI.getPendingScrapingJob("LAW_SCRAPER");
            const isFetchingRecentLawResponse = await window.imparcialAPI.getPendingScrapingJob("RECENT_LAW_SCRAPER");
            if (isFetchingLawResponse) {
                // TODO: Handle errors.
                if(!isFetchingLawResponse.Error) {
                    const isFetchingLaw = isFetchingLawResponse.Data;                    
                    setLoadLegislation(isFetchingLaw);
                }
            }

            if (isFetchingRecentLawResponse ) {
                // TODO: Handle errors.
                if(!isFetchingRecentLawResponse.Error) {
                    const isFetchingRecentLaw = isFetchingRecentLawResponse.Data;
                    setLoadRecentLegislation(isFetchingRecentLaw);
                }
            }
        })();

    }, []);

    useEffect(() => {
        setIsFetchingLaws(loadLegislation || loadRecentLegislation);
    }, [loadLegislation, loadRecentLegislation])

    function addFilter(event: any) {
        let _filters = [...filters];
        _filters.push("");
        setFilters(_filters);
    }

    function updateFilter(id: number, text: string) {
        let _filters = [...filters];
        _filters[id] = text;
        setFilters(_filters);
    }

    function removeFilter(id: number) {
        let _filters = [...filters];
        _filters.splice(id, 1);
        setFilters(_filters);
    }

    function loadCommittee(id: number) {
        if(committees && committees.length > 0) {
            setSelectedCommitteeId(committees[id].CommitteeId);
            setNotifyOnNew(committees[id].NotifyOnNewLegislation);
            setFilters(committees[id].NotificationFilters);
        }
    }

    function unloadCommittee() {
        setSelectedCommitteeId(-1);
        setNotifyOnNew(false);
        setFilters([]);
    }
    
    async function saveConfig() {
        // let select= (document.getElementById("committee-select") as HTMLInputElement);
        // let id = parseInt(select.value);
        const id = selectedCommitteeId;
        if (id == -1)
            return
        let committee: {id: number, name: string} = {id: -1, name: ""};
        data.comisions.forEach((elem) => {
            if (elem.id == id) {
                committee = elem
                return
            }
        });

        if(committee.id == -1)
            return
        
        let _committees = [...committees];
        let _filters = [...filters];
        let _notifyOnNew = notifyOnNew;

        const save = async () => {
            const found = _committees.find((e) => e.CommitteeId == committee.id);

            if(found) {
                for(let i=0; i < _committees.length; i++) {
                    if(_committees[i].CommitteeId == found.CommitteeId) {
                        const _committee = {
                            AdministrationId: 2025,
                            CommitteeId: committee.id,
                            NotifyOnNewLegislation: _notifyOnNew,
                            NotificationFilters: _filters
                        }
                        _committees[i] = _committee;
                    }
                }
                _committees = [..._committees]
            }
            else {
                const _committee = {
                    AdministrationId: 2025,
                    CommitteeId: committee.id,
                    NotifyOnNewLegislation: _notifyOnNew,
                    NotificationFilters: _filters
                }
                _committees.push(_committee);
            }
            
            const configResult = await window.imparcialAPI.updateCommitteeConfig(_committees);
            if(!configResult.Error) {
                const config = configResult.Data;
                if(config) {
                    dispatch(updateConfig(config));
                }
            }

            setSelectedCommitteeId(-1);
            setFilters([]);
            setNotifyOnNew(false);
        }

        await save();

    }

    async function removeCommittee(adminId: number, committeeId: number) {
        
        const _committees = [...committees];
        for(let i=0; i < _committees.length; i++) {
            if(_committees[i].AdministrationId == adminId &&
                _committees[i].CommitteeId == committeeId) {
                    _committees.splice(i,1);
                    break;
            }
        }

        const configResult = await window.imparcialAPI.updateCommitteeConfig(_committees);
        if(!configResult.Error) {
            const config = configResult.Data;
            if(config) {
                dispatch(updateConfig(config));
            }
        }
    }

    function getCommitteeName(committeeId: number) {
        const found = data.comisions.find((e) => e.id == committeeId);
        if(found)
            return found.name;
        return ""
    }

    async function scrapeLegislation() {
        setLoadLegislation(true);
        setLoadRecentLegislation(true);

        const electronAPI = (window as any).electronAPI;
        const scrapingMetadata: ScrapingJobState = await electronAPI.startScrapingJob("LAW_SCRAPER");
        const scrapingMetadata2: ScrapingJobState = await electronAPI.startScrapingJob("RECENT_LAW_SCRAPER");

        const scrapedData = await electronAPI.fetchPagesForLaws(administrationId, committiees);
        const scrapedData2 = await electronAPI.fetchPagesForRecentLaws(administrationId);
        console.log({scrapedData2});

        const lawScraper = new Worker(new URL('../../../lib/workers/law_scraper/index.ts', import.meta.url));
        const recentLawScraper = new Worker(new URL('../../../lib/workers/recent_law_scraper/index.ts', import.meta.url));
        
        if(lawScraper) {
            console.log("Starting law worker");
            lawScraper.onmessage = async (e) => {
                // console.log(`Law Scraper onmessage: ${e.data.length}`);
                const result = await electronAPI.saveScrapedLaws(e.data, administrationId, scrapingMetadata);
                // console.log(`Saved laws succesfully: ${result}`);
                //window.location.reload();
                setLoadLegislation(false);
            }
            lawScraper.onerror = (e) => {
                console.log("laws err", e.message);
                setLoadLegislation(false);
            }
            // console.log(newsScraperData);
            lawScraper.postMessage(scrapedData);
        }
        else {
            console.log("Error starting law worker");
        }

        if(recentLawScraper) {
            console.log("Starting recent law worker");
            recentLawScraper.onmessage = async (e) => {
                // console.log(`Recent Law Scraper onmessage: ${e.data.length}`);
                const result = await electronAPI.saveScrapedRecentLaws(e.data, scrapingMetadata2);
                // console.log(`Saved recent laws succesfully: ${result}`);
                //window.location.reload();
                setLoadRecentLegislation(false);
            }
            recentLawScraper.onerror = (e) => {
                console.log("recent err", e.message);
                setLoadRecentLegislation(false);
            }
            // console.log(newsScraperData);
            recentLawScraper.postMessage(scrapedData2);
        }
        else {
            console.log("Error starting recent worker");
        }
    }

    return (
        <>
            <div style={{display: "flex", flexDirection: "row", justifyContent: "center", width: "100vw"}}>
                <div>
                    {isFetchingLaws? <><span style={{display: "flex"}}><div className='spinner'></div>&nbsp;Cargando Legislaci&oacute;n</span></> : <div className="button" onClick={async () => await scrapeLegislation()}><FontAwesomeIcon icon="bolt" />&nbsp;Cargar Legislaci&oacute;n</div>}
                </div>
            </div>
            <div className='legislation-settings-header-container'>
                <div className='legislation-settings-header-item'  onClick={() => {setShowConfig(!showConfig); unloadCommittee(); }}>
                    <div>Configurar Alertas de Legislaci&oacute;n <FontAwesomeIcon icon="gear" /></div>
                </div>
            </div>
            {
                committees && committees.length == 0?
                <div className="legislation-settings-container">
                    <div>
                        Configure las comisiones legislativas para las cuales que desea ver legislación presionando el icono de engranaje (<FontAwesomeIcon icon="gear" />)
                    </div>
                </div> : <></>
            }
            {
                showConfig?                    
                    <div className="legislation-settings-container">
                        <br />
                        <div className="legislation-settings-items-container">
                            <div>
                                <select className="committee-select" disabled={true}>
                                    <option value="2025">2025-2028</option>
                                </select>
                            </div>
                        </div>
                        <div className="legislation-settings-items-container">
                            <div>
                                <select id="committee-select" value={selectedCommitteeId} onChange={(e) => setSelectedCommitteeId(parseInt(e.target.value))} className="committee-select">
                                    <option value="-1">Seleccione una Comisi&oacute;n</option>
                                    {data.comisions.map(element => {
                                        return (
                                            <option key={element.id} value={element.id}>{element.name}</option>
                                        )
                                    })}
                                </select>
                            </div>
                        </div>
                        <div className="legislation-settings-items-container">
                            <input type="checkbox" checked={notifyOnNew} onChange={(e) => setNotifyOnNew(e.target.checked)}  id="notifyOnNew" />
                            <label htmlFor="notifyOnNew">Marca para notificar sobre legislaci&oacute;n nueva.</label>
                        </div>
                        <div className="legislation-settings-items-container">
                            <div>
                                <label>Establezca los filtros aplicables a la legislaci&oacute;n</label>
                            </div>
                            <div className="sm-form-button" onClick={(e) => addFilter(e)}>
                                A&ntilde;adir Filtro
                            </div>
                        </div>
                        {
                            filters.map((val, i) => {
                                return (
                                    <div key={`filter_${i}`} className="legislation-settings-items-container">
                                        <input type="text" onChange={(e) => updateFilter(i, e.target.value)} className="textbox" value={val} name="filters" placeholder="Filtro" />
                                        <FontAwesomeIcon icon={faCircleXmark} onClick={() => removeFilter(i)} />
                                    </div>
                                )
                            })
                        }
                        <div className="legislation-settings-items-container">
                            <div className="form-button" onClick={async () => await saveConfig()}>
                                Guardar
                            </div>
                        </div>
                        <br />
                        <div className="selected-committee-container">
                            {
                                committees.map((elem, i) => {
                                    return (
                                        <div key={elem.CommitteeId} className="selected-committee-item">
                                            <div className={selectedCommitteeId == elem.CommitteeId? "committee-button committee-selected selected-committee-item-active" : "committee-button committee-selected"} onClick={() => loadCommittee(i)}>{getCommitteeName(elem.CommitteeId)}</div>
                                            <FontAwesomeIcon style={{cursor: "pointer"}} onClick={() => removeCommittee(elem.AdministrationId, elem.CommitteeId)} icon={faCircleXmark} />
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                    : <></>
            }
        </>
    )
}