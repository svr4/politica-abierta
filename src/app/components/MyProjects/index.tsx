import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell as farBell, faCircleLeft, faPenToSquare, faCircleXmark} from "@fortawesome/free-regular-svg-icons";
import { faBell as fasBell } from "@fortawesome/free-solid-svg-icons";

import NavBar from "../NavBar";
import "./myProjects.css"
import { useAppSelector, useAppDispatch } from "../../lib/hooks";
import {updatePagination, updateIsFiltering, updateSubscribedLegislationTags, updateSubscribedLegislation, updateLegislationSource,
    // removeSubscribedLegislation
} from "../../lib/slices/legislationList";
import {updateSubscribedLegislationSummary, updateSubscribedLegislationSubscription} from '../LegislationList/LegislationItem/hooks';
import LegislationItem from "../LegislationList/LegislationItem";
import { Legislation, SubscribedLegislation, LegislationSourceType, ScrapingJobState, EventScraperData } from "../../lib/models";
import Loading from "../LegislationList/LoadLegislation";
import ModalWindow from "../Misc/ModalWindow";


export default function MyProjects() {

    const administrationId = 2025;

    const [loadEvents, setLoadEvents] = useState(false);
    const [selectedLegislation, setSelectedLegislation] = useState<{legislation: Legislation, legislationIndex: number}>();
    const [isAddingToWatchlist, setIsAddingToWatchList] = useState(false);
    const [selectedProjectForTagUpdate, setSelectedProjectForTagUpdate] = useState<SubscribedLegislation>();
    const [listedCategories, setListedCategories] = useState<string[]>([]);
    const [savingTags, setSavingTags] = useState(false);
    const [categoryFormMessage, setCategoryFormMessage] = useState("");
    const [categoryMessageColor, setCategoryMessageColor] = useState("");
    const [filterCategories, setFilterCategories] = useState<string[]>([]);

    const isFiltering = useAppSelector((state) => state.legislation.IsFiltering);
    const legislation = useAppSelector((state) => state.legislation.SubscribedLegislation);
    const pages = useAppSelector((state) => state.legislation.Pages);
    const page = useAppSelector((state) => state.legislation.Page);
    const currentLimit = useAppSelector((state) => state.story.Limit);

    const dispatch = useAppDispatch();

    useEffect(() => {
        (async () => {

            dispatch(updateIsFiltering(true));
            
            const legislationResult = await window.imparcialAPI.getMyProjects();

            if(!legislationResult.Error) {
                const _legislation = legislationResult.Data;
                if(_legislation) {
                    dispatch(updateSubscribedLegislation(_legislation.Legislation));
                    dispatch(updatePagination(_legislation.Pagination));
                    dispatch(updateLegislationSource(LegislationSourceType.SubscribedLegislation));
                }
            }
            dispatch(updateIsFiltering(false));

        })();
    }, []);

    useEffect(() => {

        if(legislation && legislation.length > 0) {
            if(selectedLegislation != undefined) {
                // update the selected legislation
                const foundLeg = legislation.find((val) => val.LegislationId == selectedLegislation.legislation.LegislationId);
                const foundIndex = legislation.findIndex((val) => val.LegislationId == selectedLegislation.legislation.LegislationId);
                if(foundLeg) {
                    setSelectedLegislation({legislation: foundLeg, legislationIndex: foundIndex});
                }
            }

            // Get the categories, if any, for filtering
            let _cats: string[] = [];
            legislation.forEach((l) => {
                let sub = l as SubscribedLegislation;
                sub.Tags?.forEach((tag) => {
                    if(!_cats.includes(tag))
                        _cats.push(tag);
                })
            });

            setFilterCategories(_cats);
        }

    }, [legislation])

    async function setProjectWatchList(projectId: number, index: number) {
        setIsAddingToWatchList(true);
        const result = await window.imparcialAPI.updateSubscribedProjects(projectId);
        
        if(!result.Error && result.Data) {
            dispatch(updateIsFiltering(true));
            const legislationResult = await window.imparcialAPI.getMyProjects();
            if(!legislationResult.Error) {
                const _legislation = legislationResult.Data;
                if(_legislation) {
                    dispatch(updateSubscribedLegislation(_legislation.Legislation));
                    dispatch(updatePagination(_legislation.Pagination));
                    dispatch(updateLegislationSource(LegislationSourceType.SubscribedLegislation));
                }
            }
            // dispatch(removeSubscribedLegislation(index));
            dispatch(updateIsFiltering(false));
        }

        setIsAddingToWatchList(false);
    }

    async function save() {
        setSavingTags(true);
        let _listedCategories = [...listedCategories];
        const containsEmptyCategory = _listedCategories.find((val) => val == "");
        
        if(containsEmptyCategory != undefined) {
            setCategoryMessageColor("red");
            setCategoryFormMessage("Categorías en blanco son inválidas. Entre un texto en la categoría.");
        }
        else {
            setCategoryFormMessage("");
            if (selectedProjectForTagUpdate) {
                const result = await window.imparcialAPI.updateSubscribedProjectTags(selectedProjectForTagUpdate.LegislationId, _listedCategories);
                if(!result.Error && result.Data) {
                    dispatch(updateSubscribedLegislationTags({LegislationId: selectedProjectForTagUpdate.LegislationId, Tags: _listedCategories}));
                    setCategoryMessageColor("");
                    setCategoryFormMessage("Se guardaron las categorías exitosamente.");
                    setTimeout(() => setCategoryFormMessage(""), 3000);
                }
            }
        }

        setSavingTags(false);
            
    }

    function updateCategory(index: number, value: string) {
        let _listedCategories = [...listedCategories];
        _listedCategories[index] = value;        
        setListedCategories(_listedCategories);
    }

    function addCategory() {
        let _listedCategories = [...listedCategories];
        _listedCategories.push("");
        setListedCategories(_listedCategories);
    }

    function removeCategory(index: number) {
        let _listedCategories = [...listedCategories];
        _listedCategories.splice(index, 1);
        setListedCategories(_listedCategories);
    }

    function closeModal() {
        var modal = document.getElementById("myModal");
        if(modal)
            modal.style.display = "none";
        setListedCategories([]);
        setCategoryFormMessage("");
        setCategoryMessageColor("");
    }

    async function returnToSubscribedList() {

        if(!selectedLegislation?.legislation.IsSubscribed) {
            // not subscribed anymore, refresh the list.
            dispatch(updateIsFiltering(true));
            const legislationResult = await window.imparcialAPI.getMyProjects();
            if(!legislationResult.Error) {
                const _legislation = legislationResult.Data;
                if(_legislation) {
                    dispatch(updateSubscribedLegislation(_legislation.Legislation));
                    dispatch(updatePagination(_legislation.Pagination));
                    dispatch(updateLegislationSource(LegislationSourceType.SubscribedLegislation));
                }
            }
            dispatch(updateIsFiltering(false));
        }

        setSelectedLegislation(undefined)
    }

    async function filterByCategory(category: string) {
        dispatch(updateIsFiltering(true));
            let legislationResult = undefined;
            if(category == "-1") {
                legislationResult = await window.imparcialAPI.getMyProjects();
            }
            else {
                legislationResult = await window.imparcialAPI.getMyProjects(1, currentLimit, category);
            }
            
            if(legislationResult && !legislationResult.Error) {
                const _legislation = legislationResult.Data;
                if(_legislation) {
                    dispatch(updateSubscribedLegislation(_legislation.Legislation));
                    dispatch(updatePagination(_legislation.Pagination));
                    dispatch(updateLegislationSource(LegislationSourceType.SubscribedLegislation));
                }
            }
        dispatch(updateIsFiltering(false));
    }

    async function scrapeEvents() {
        setLoadEvents(true);
        const electronAPI = (window as any).electronAPI;
        const scrapingMetadata: ScrapingJobState = await electronAPI.startScrapingJob("EVENT_SCRAPER");
        const eventScraperData: EventScraperData = await electronAPI.fetchPagesForEvents(administrationId);

        const eventsScraper = new Worker(new URL('../../lib/workers/events_scraper/index.ts', import.meta.url));
        
        if(eventsScraper) {
            console.log("Starting worker");

            eventsScraper.onmessage = async (e) => {
                // console.log(`News Config onmessage: ${e.data}`);
                const result = await electronAPI.saveScrapedEvents(e.data, scrapingMetadata);
                console.log(`Saved events succesfully: ${result}`);
                
                setLoadEvents(false);
            }

            eventsScraper.onerror = (e) => {
                console.log("err", e.message);
                setLoadEvents(false);
            }

            // The call.
            console.log(eventScraperData);
            eventsScraper.postMessage(eventScraperData);
        }
        else {
            console.log("Error starting worker");
        }
    }

    function generatePastelHexColor(): string {
        // Generate random HSL values for a pastel color
        // Hue (H): 0-360 degrees (full spectrum)
        const h = Math.floor(Math.random() * 361); 
        // Saturation (S): Low to medium for pastel effect (e.g., 40-70%)
        const s = Math.floor(Math.random() * 31) + 40; 
        // Lightness (L): High for pastel effect (e.g., 70-90%)
        const l = Math.floor(Math.random() * 21) + 70; 

        // Convert HSL to RGB
        const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l / 100 - c / 2;

        let r = 0;
        let g = 0;
        let b = 0;

        if (0 <= h && h < 60) {
            r = c;
            g = x;
            b = 0;
        } else if (60 <= h && h < 120) {
            r = x;
            g = c;
            b = 0;
        } else if (120 <= h && h < 180) {
            r = 0;
            g = c;
            b = x;
        } else if (180 <= h && h < 240) {
            r = 0;
            g = x;
            b = c;
        } else if (240 <= h && h < 300) {
            r = x;
            g = 0;
            b = c;
        } else if (300 <= h && h < 360) {
            r = c;
            g = 0;
            b = x;
        }

        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        // Convert RGB to Hex
        const toHex = (c: number) => {
            const hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function render() {

        if(selectedLegislation) {
            return (
                <>
                    <div className="button" onClick={async () => await returnToSubscribedList()}><FontAwesomeIcon icon={faCircleLeft} />&nbsp;Volver a Lista de Proyectos</div>
                    <br />
                    <LegislationItem legislation={selectedLegislation.legislation} legislationIndex={selectedLegislation.legislationIndex}
                        updateSummary={updateSubscribedLegislationSummary} updateSubscription={updateSubscribedLegislationSubscription} />
                </>
            )
        }
        else {
            if (legislation.length == 0 ) {
                return (
                    <div>No hay legislaci&oacute;n para presentar. Recuerde presionar el &iacute;cono de campana (<FontAwesomeIcon icon={farBell} />)
                    en los proyectos del &aacute;rea de "Legislaci&oacute;n" para que aparezca en esta &aacute;rea.</div>
                )
            }
            else {                
                return (
                    <div className="project-container">
                        {
                            legislation.map((legislation, legislationIndex) => {
                                const _subscribedLegislation = legislation as SubscribedLegislation;
                                return (
                                    <div key={`legislation_${legislation.LegislationId}_${legislation.Hash}`} className="project-item">
                                        <div style={{textAlign: "center", fontWeight: "bold", fontSize: 35}}>{legislation.Number}</div>
                                        <br />
                                        <div style={{display: "flex", columnGap: 10, justifyContent: "space-between"}}>
                                            <div style={{display: "flex", columnGap: 5, flexWrap: "wrap", rowGap: 5}}>
                                            {
                                                _subscribedLegislation.Tags?.map((item, idx) => {
                                                    return (
                                                        <div key={`legislation_${legislation.LegislationId}_tag_${idx}`} style={{backgroundColor: generatePastelHexColor(), color: "black", borderRadius: 10, padding: 5}}>
                                                            {item}
                                                        </div>
                                                    )
                                                })
                                            }
                                            </div>
                                            <div>
                                                <div className="button" onClick={() => {
                                                    var modal = document.getElementById("myModal");
                                                    if(modal) {
                                                        modal.style.display = "block";
                                                        setSelectedProjectForTagUpdate(legislation as SubscribedLegislation);
                                                        if(_subscribedLegislation.Tags)
                                                            setListedCategories(_subscribedLegislation.Tags);
                                                    }
                                                }}><FontAwesomeIcon icon={faPenToSquare} /> Actualizar Categorías</div>
                                            </div>
                                        </div>
                                        <br />
                                        {
                                            legislation.Author != ""? <><div><span style={{fontWeight: "bold"}}>Autor(es):</span>{legislation.Author}</div><br /></> : <></>
                                        }
                                        <div style={{height: 300, overflow: "scroll"}}>
                                            {legislation.Title}
                                        </div>
                                        <br />
                                        <label><strong>&Uacute;ltimo Evento:</strong> <span style={{color: "gold"}}>{legislation.Events.length > 0? legislation.Events[0].Title : legislation.LastEvent}</span></label>
                                        <br />
                                        <br />
                                        <div className="button" onClick={() => setSelectedLegislation({legislation, legislationIndex})}>Ver Detalles</div>
                                        <div onClick={async () => await setProjectWatchList(legislation.LegislationId, legislationIndex)} className="button">
                                        {
                                            isAddingToWatchlist? <div className='spinner'></div> : <span><FontAwesomeIcon icon={fasBell} />&nbsp; Remover Notificaciones</span>
                                        }
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                )
            }
        }
    }


    return (
        <>
            <NavBar />
            <div className='legislation-settings-header-container'>
                <div className='legislation-settings-header-item'>
                    <h1>Mis Proyectos</h1>
                </div>
            </div>
            <br />
            {
                legislation.length > 0?
                <>
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "center", width: "100vw"}}>
                        <div>
                            {loadEvents? <><span style={{display: "flex"}}><div className='spinner'></div>&nbsp;Cargando Eventos</span></> : <div className="button" onClick={async () => await scrapeEvents()}><FontAwesomeIcon icon="bolt" />&nbsp;Cargar Eventos Ahora</div>}
                        </div>
                    </div>
                    <br />
                </>: <></>
            }
            <div className='project-filter-container'>
                <div className="project-filter-item">
                    Filtre por Categorias
                </div>
                <div className="project-filter-item">
                    <select className="committee-select" onChange={(e) => filterByCategory(e.target.value)}>
                        <option value="-1">Seleccione una Categoría</option>
                        {
                            filterCategories.map((elem, i) => {
                                return (
                                    <option key={`user_categories_${i}`} value={elem}>{elem}</option>
                                )
                            })
                        }
                    </select>
                </div>
            </div>
            <br />
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
                            render()
                        }
                    </div>
            }
            <br />
            {
                legislation.length > 0 && pages > 1 && page < pages? <Loading /> : <></>
            }
            <ModalWindow onClose={closeModal}>
                <>
                    <br />
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                        <p>Establezca la categor&iacute;a del proyecto: {selectedProjectForTagUpdate?.Number}</p>
                        <div className="button" onClick={() => addCategory()}>A&ntilde;adir Categor&iacute;a</div>
                    </div>
                    <br />
                    <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                        {
                            listedCategories.map((category, index) => {
                                return (
                                    <div key={`listed_category_${index}`} style={{display: "flex", flexDirection: "row", alignItems: "baseline"}}>
                                        <input onChange={(e) => updateCategory(index, e.target.value)} style={{width: 300}} type="text" value={category} placeholder="Categoría..." className="textbox" name="categories" />
                                        &nbsp;
                                        <FontAwesomeIcon icon={faCircleXmark} onClick={() => removeCategory(index)} />
                                    </div>
                                )
                            })
                        }
                    </div>
                    <br />
                    <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                        <div>
                            <p style={{color: categoryMessageColor}}>{categoryFormMessage}</p>
                        </div>
                    </div>
                    <br />
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "space-around"}}>
                        <div className="button" onClick={async () => await save()}>{savingTags? <div className='spinner'></div> : "Guardar"}</div>
                        <div className="button" onClick={() => closeModal()}>Cerrar</div>
                    </div>
                </>
            </ModalWindow>
        </>
    );
}