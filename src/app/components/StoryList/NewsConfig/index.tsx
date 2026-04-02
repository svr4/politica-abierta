import React, {useState, useEffect} from "react";
import { useAppDispatch, useAppSelector } from "../../../lib/hooks";
import { selectNews, updateConfig } from "../../../lib/slices/appConfig";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";

// import "./NewsConfig.css";
import { EventScraperData, NewsScraperData, ScrapingJobState, SourceType } from "../../../lib/models";

export default function NewsConfig() {

    const [showConfig, setShowConfig] = useState(false);
    const [loadStories, setLoadStories] = useState(false);
    const [defaultFilter, setDefaultFilter] = useState("");
    const [filters, setFilters] = useState<string[]>([]);
    // const [notifyOnNew, setNotifyOnNew] = useState(false);
    const [selectedSource, setSelectedSource] = useState(-1);

    const [sourceError, setSourceError] = useState("");
    const [defaultFilterError, setDefaultFilterError] = useState("");

    const news = useAppSelector(selectNews);

    const dispatch = useAppDispatch();

    const ENDI_URLS = ["https://www.elnuevodia.com/noticias/politica/", "https://www.elnuevodia.com/noticias/legislatura/", "https://www.elnuevodia.com/noticias/gobierno/", "https://www.elnuevodia.com/corresponsalias/washington-dc/"];
    const VOCERO_URLS = ["https://www.elvocero.com/gobierno/"];
    const NOTICEL_URLS = ["https://www.noticel.com/category/gobierno"];

    const SCRAPE_URLS = [ENDI_URLS, VOCERO_URLS, NOTICEL_URLS];

    useEffect(() => {
        
        (async () => {
            const isFetchingNewsResponse = await window.imparcialAPI.getPendingScrapingJob("NEWS_SCRAPER");
            // TODO: Handle errors.
            if (isFetchingNewsResponse && !isFetchingNewsResponse.Error) {
                const isFetchingStories= isFetchingNewsResponse.Data;
                setLoadStories(isFetchingStories);
            }
        })();

    }, []);

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

    function loadNewsConfig(id: number) {
        setSelectedSource(news[id].SourceType);
        setDefaultFilter(news[id].DefaultFilter);
        setFilters(news[id].NotificationFilters);
    }

    function unloadNewsConfig() {
        setSelectedSource(-1);
        setDefaultFilter("");
        setFilters([]);
    }

    
    async function saveConfig() {
        // let select= (document.getElementById("committee-select") as HTMLInputElement);
        // let id = parseInt(select.value);

        let hasError = false;
        const id = selectedSource;
        console.log(id);
        if (id == -1) {
            setSourceError("La fuente de noticia es requerida.");
            hasError = true;
        }
        else {
            setSourceError("");
        }
        
        let _news = [...news];
        let _filters = [...filters];
        let _defaultFilter = defaultFilter;

        if(defaultFilter == "") {
            setDefaultFilterError("Por lo menos 1 filtro es requerido.");
            hasError = true;
        }
        else {
            setDefaultFilterError("");
        }

        if(hasError)
            return;

        let foundNewsConfig: any;
        let foundIndex = -1;
        news.forEach((elem, i) => {
            if (elem.SourceType == id) {
                foundNewsConfig = elem;
                foundIndex = i;
                return
            }
        });

        const save = async () => {
            if(foundNewsConfig && foundIndex != -1) {
                let updatedNewsConfig = {
                    SourceType: selectedSource,
                    DefaultFilter: _defaultFilter,
                    NotifyOnNewNews: true,
                    NotificationFilters: _filters
                }
                _news[foundIndex] = updatedNewsConfig;
                const configResult = await window.imparcialAPI.updateNewsConfig(_news);
                if(!configResult.Error) {
                    const config = configResult.Data;
                    if(config) {
                        dispatch(updateConfig(config));
                    }
                }

                setSourceError("");
                setDefaultFilterError("");
                setDefaultFilter("");
                setSelectedSource(-1);
                setFilters([]);
            }
            else {
                const _newsConfig = {
                    SourceType: selectedSource,
                    DefaultFilter: _defaultFilter,
                    NotifyOnNewNews: true,
                    NotificationFilters: _filters
                }
                _news.push(_newsConfig);
                const configResult = await window.imparcialAPI.updateNewsConfig(_news);
                if(!configResult.Error) {
                    const config = configResult.Data;
                    if(config) {
                        dispatch(updateConfig(config));
                    }
                }
                
                setSourceError("");
                setDefaultFilterError("");
                setDefaultFilter("");
                setSelectedSource(-1);
                setFilters([]);
            }
        };

        await save();
    }

    async function removeNewsConfig(i: number) {
        const _news = [...news];
        _news.splice(i,1);
        const configResult = await window.imparcialAPI.updateNewsConfig(_news);
        if(!configResult.Error) {
            const config = configResult.Data;
            if(config) {
                dispatch(updateConfig(config));
            }
        }
    }

    function getSourceName(sourceId: SourceType) {
        switch(sourceId) {
            case SourceType.ENDI:
                return "El Nuevo Día";
            case SourceType.Vocero:
                return "El Vocero";
            case SourceType.Noticel:
                return "Noticel";
        }
    }

    async function scrapeNews() {
        setLoadStories(true);
        const electronAPI = (window as any).electronAPI;
        
        const scrapingMetadata: ScrapingJobState = await electronAPI.startScrapingJob("NEWS_SCRAPER");

        let newsScraperData: NewsScraperData = {
            EndiPages: [],
            VoceroPages: [],
            NoticelPages: [],
            ScrapingDate: scrapingMetadata.ScrapingDate
        }
        
        let results = [];
        for(let i=0; i < SCRAPE_URLS.length; i++) {
            for(let ii=0; ii < SCRAPE_URLS[i].length; ii++) {
                if(i == 2) {
                    results.push(await electronAPI.fetchPagePlaywright(SCRAPE_URLS[i][ii]));
                }
                else {
                    results.push(await electronAPI.fetchPage(SCRAPE_URLS[i][ii]));
                }
            }
            switch(i) {
                case 0:
                    // endi
                    newsScraperData.EndiPages = [...results];
                    break;
                case 1:
                    // vocero
                    newsScraperData.VoceroPages = [...results];
                    break;
                case 2:
                    // noticel
                    newsScraperData.NoticelPages = [...results];
                    break;
            }
            results = [];
        }
        
        const newsScraper = new Worker(new URL('../../../lib/workers/news_scraper/index.ts', import.meta.url));
        
        if(newsScraper) {
            console.log("Starting worker");
            newsScraper.onmessage = async (e) => {
                // console.log(`News Config onmessage: ${e.data}`);
                const result = await electronAPI.saveScrapedStories(e.data, scrapingMetadata);
                console.log(`Saved stories succesfully: ${result}`);
                window.location.reload();
                setLoadStories(false);
            }
            newsScraper.onerror = (e) => {
                console.log("err", e.message);
                setLoadStories(false);
            }
            console.log(newsScraperData);
            newsScraper.postMessage(newsScraperData);
        }
        else {
            console.log("Error starting worker");
        }
    }

    return (
        <>
            <div style={{display: "flex", flexDirection: "row", justifyContent: "center", width: "100vw"}}>
                <div>
                    {loadStories? <><span style={{display: "flex"}}><div className='spinner'></div>&nbsp;Cargando Noticias</span></> : <div className="button" onClick={async () => await scrapeNews()}><FontAwesomeIcon icon="bolt" />&nbsp;Cargar Noticias Ahora</div>}
                </div>
            </div>
            <div className='legislation-settings-header-container'>
                <div className='legislation-settings-header-item'  onClick={() => { setShowConfig(!showConfig); unloadNewsConfig(); }}>
                    <div>Configurar Alertas de Noticias <FontAwesomeIcon icon="gear" /></div>
                </div>
            </div>
            {
                showConfig?                    
                    <div className="legislation-settings-container">
                        <div className="legislation-settings-items-container">
                            <div>
                                <select id="committee-select" value={selectedSource} onChange={(e) => {
                                    setSelectedSource(parseInt(e.target.value));
                                    if(e.target.value != "-1")
                                        setSourceError("");
                                }} className="committee-select">
                                    <option value="-1">Seleccione una Fuente Noticiosa</option>
                                    <option value="1">El Nuevo D&iacute;a</option>
                                    <option value="2">El Vocero</option>
                                    <option value="3">Noticel</option>
                                </select>
                            </div>
                            {sourceError && <div style={{ color: 'red' }}>{sourceError}</div>}
                        </div>
                        <div className="legislation-settings-items-container">
                            <input type="checkbox" disabled checked={true} id="notifyOnNew" />
                            <label htmlFor="notifyOnNew">Recibirás notificaciones sobre noticias nuevas filtradas.</label>
                        </div>
                        <div className="legislation-settings-items-container">
                            <div>
                                <label>Establezca los filtros aplicables a las noticias</label>
                            </div>
                            <div className="sm-form-button" onClick={(e) => addFilter(e)}>
                                A&ntilde;adir Filtro
                            </div>
                        </div>
                        <div className="legislation-settings-items-container">
                            <input type="text" onChange={(e) =>  {
                                setDefaultFilter(e.target.value);
                                if(e.target.value != "")
                                    setDefaultFilterError("");
                            }} className="textbox" value={defaultFilter} name="filters" placeholder="Filtro" />
                        </div>
                        {defaultFilterError && <div style={{ color: 'red' }}>{defaultFilterError}</div>}
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
                                news.map((elem, i) => {
                                    return (
                                        <div key={`selected_committee_${i}`} className="selected-committee-item">
                                            <div className={selectedSource == elem.SourceType? "committee-button committee-selected selected-committee-item-active" : "committee-button committee-selected"} onClick={() => loadNewsConfig(i)}>{getSourceName(elem.SourceType)}</div>
                                            <FontAwesomeIcon style={{cursor: "pointer"}} onClick={() => removeNewsConfig(i)} icon={faCircleXmark} />
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