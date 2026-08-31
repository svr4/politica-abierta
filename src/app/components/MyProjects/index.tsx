import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell as farBell, faCircleLeft, faPenToSquare, faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { faBell as fasBell } from '@fortawesome/free-solid-svg-icons';

import './myProjects.css';
import { useAppSelector, useAppDispatch } from '../../lib/hooks';
import { updatePagination, updateIsFiltering, updateSubscribedLegislationTags, updateSubscribedLegislation, updateLegislationSource } from '../../lib/slices/legislationList';
import { updateSubscribedLegislationSummary, updateSubscribedLegislationSubscription } from '../LegislationList/LegislationItem/hooks';
import LegislationItem from '../LegislationList/LegislationItem';
import { Legislation, SubscribedLegislation, LegislationSourceType, ScrapingJobState, EventScraperData } from '../../lib/models';
import Loading from '../LegislationList/LoadLegislation';
import ModalWindow from '../Misc/ModalWindow';
import AppButton from '../Misc/AppButton';
import LiveRegion from '../Misc/LiveRegion';
import { ROUTE_TITLES, setDocumentTitle } from '../../lib/pageTitles';

interface MyProjectsProps {
    embedded?: boolean;
}

export default function MyProjects({ embedded = false }: MyProjectsProps) {

    const administrationId = 2025;

    const [loadEvents, setLoadEvents] = useState(false);
    const [selectedLegislation, setSelectedLegislation] = useState<{legislation: Legislation, legislationIndex: number}>();
    const [isAddingToWatchlist, setIsAddingToWatchList] = useState(false);
    const [selectedProjectForTagUpdate, setSelectedProjectForTagUpdate] = useState<SubscribedLegislation>();
    const [listedCategories, setListedCategories] = useState<string[]>([]);
    const [savingTags, setSavingTags] = useState(false);
    const [categoryFormMessage, setCategoryFormMessage] = useState("");
    const [categoryMessageColor, setCategoryMessageColor] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [filterCategories, setFilterCategories] = useState<string[]>([]);

    const isFiltering = useAppSelector((state) => state.legislation.IsFiltering);
    const legislation = useAppSelector((state) => state.legislation.SubscribedLegislation);
    const pages = useAppSelector((state) => state.legislation.Pages);
    const page = useAppSelector((state) => state.legislation.Page);
    const currentLimit = useAppSelector((state) => state.story.Limit);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!embedded) {
            setDocumentTitle(ROUTE_TITLES.myProjects);
        }
    }, [embedded]);

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
                const foundLeg = legislation.find((val) => val.LegislationId == selectedLegislation.legislation.LegislationId);
                const foundIndex = legislation.findIndex((val) => val.LegislationId == selectedLegislation.legislation.LegislationId);
                if(foundLeg) {
                    setSelectedLegislation({legislation: foundLeg, legislationIndex: foundIndex});
                }
            }

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

    async function setProjectWatchList(projectId: number) {
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
        setModalOpen(false);
        setListedCategories([]);
        setCategoryFormMessage("");
        setCategoryMessageColor("");
    }

    async function returnToSubscribedList() {

        if(!selectedLegislation?.legislation.IsSubscribed) {
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
                const result = await electronAPI.saveScrapedEvents(e.data, scrapingMetadata);
                console.log(`Saved events succesfully: ${result}`);
                
                setLoadEvents(false);
            }

            eventsScraper.onerror = (e) => {
                console.log("err", e.message);
                setLoadEvents(false);
            }

            console.log(eventScraperData);
            eventsScraper.postMessage(eventScraperData);
        }
        else {
            console.log("Error starting worker");
        }
    }

    function render() {

        if(selectedLegislation) {
            return (
                <>
                    <AppButton onClick={() => void returnToSubscribedList()} startIcon={<FontAwesomeIcon icon={faCircleLeft} aria-hidden />}>
                        Volver a Lista de Proyectos
                    </AppButton>
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
                                                _subscribedLegislation.Tags?.map((item, idx) => (
                                                    <Chip key={`legislation_${legislation.LegislationId}_tag_${idx}`} label={item} size="small" />
                                                ))
                                            }
                                            </div>
                                            <div>
                                                <AppButton onClick={() => {
                                                    setModalOpen(true);
                                                    setSelectedProjectForTagUpdate(legislation as SubscribedLegislation);
                                                    if (_subscribedLegislation.Tags) {
                                                        setListedCategories(_subscribedLegislation.Tags);
                                                    }
                                                }} startIcon={<FontAwesomeIcon icon={faPenToSquare} aria-hidden />}>
                                                    Actualizar Categorías
                                                </AppButton>
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
                                        <AppButton onClick={() => setSelectedLegislation({ legislation, legislationIndex })}>
                                            Ver Detalles
                                        </AppButton>
                                        <AppButton
                                            loading={isAddingToWatchlist}
                                            onClick={() => void setProjectWatchList(legislation.LegislationId)}
                                            aria-label="Remover notificaciones"
                                        >
                                            <span><FontAwesomeIcon icon={fasBell} aria-hidden /> Remover Notificaciones</span>
                                        </AppButton>
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
            {!embedded ? (
                <Typography component="h1" variant="h5" sx={{ textAlign: 'center', py: 1 }}>
                    {ROUTE_TITLES.myProjects}
                </Typography>
            ) : null}
            {
                legislation.length > 0?
                <>
                    <div style={{display: "flex", flexDirection: "row", justifyContent: "center", width: "100%"}}>
                        <div>
                            {loadEvents ? (
                                <>
                                    <LiveRegion message="Cargando eventos…" />
                                    <span style={{ display: 'flex' }}>Cargando Eventos</span>
                                </>
                            ) : (
                                <AppButton onClick={() => void scrapeEvents()} startIcon={<FontAwesomeIcon icon="bolt" aria-hidden />}>
                                    Cargar Eventos Ahora
                                </AppButton>
                            )}
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
                isFiltering ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <LiveRegion message="Cargando proyectos…" />
                        <span>Cargando…</span>
                    </Box>
                ) : (
                    <div className="legislation-container">
                        {render()}
                    </div>
                )
            }
            <br />
            {
                legislation.length > 0 && pages > 1 && page < pages? <Loading /> : <></>
            }
            <ModalWindow
                open={modalOpen}
                onClose={closeModal}
                title={`Actualizar categorías: ${selectedProjectForTagUpdate?.Number ?? ''}`}
            >
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <AppButton onClick={() => addCategory()}>Añadir Categoría</AppButton>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        {listedCategories.map((category, index) => (
                            <Box key={`listed_category_${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                    onChange={(e) => updateCategory(index, e.target.value)}
                                    value={category}
                                    placeholder="Categoría..."
                                    label={`Categoría ${index + 1}`}
                                    size="small"
                                    sx={{ width: 300 }}
                                />
                                <IconButton aria-label={`Eliminar categoría ${index + 1}`} onClick={() => removeCategory(index)}>
                                    <FontAwesomeIcon icon={faCircleXmark} />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                        <Typography sx={{ color: categoryMessageColor }}>{categoryFormMessage}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                        <AppButton loading={savingTags} onClick={() => void save()}>Guardar</AppButton>
                        <AppButton onClick={() => closeModal()}>Cerrar</AppButton>
                    </Box>
                </>
            </ModalWindow>
        </>
    );
}