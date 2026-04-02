import {useEffect} from "react";

import { useAppSelector, useAppDispatch } from '../../lib/hooks';
import { updateSource, updateStories, updatePagination, updateIsFetching, updateIsFiltering } from '../../lib/slices/storyList';
import { SourceType } from '../../lib/models'

import './FilterBar.css';
import { updateCurrentComponent, selectCurrentComponent } from "../../lib/slices/imparcialApp";

export default function FilterBar() {

    const currentLimit = useAppSelector((state) => state.story.Limit);
    const currentComponent = useAppSelector(selectCurrentComponent);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if(currentComponent) {
            switch(currentComponent) {
                case SourceType.ENDI:
                    document.getElementById("endi")?.classList.add("filter-bar-item-selected")
                    document.getElementById("vocero")?.classList.remove("filter-bar-item-selected")
                    document.getElementById("noticel")?.classList.remove("filter-bar-item-selected")
                    document.getElementById("legislacion")?.classList.remove("filter-bar-item-selected")
                    break;
                case SourceType.Vocero:
                    document.getElementById("endi")?.classList.remove("filter-bar-item-selected")
                    document.getElementById("vocero")?.classList.add("filter-bar-item-selected")
                    document.getElementById("noticel")?.classList.remove("filter-bar-item-selected")
                    document.getElementById("legislacion")?.classList.remove("filter-bar-item-selected")
                    break;
                case SourceType.Noticel:
                    document.getElementById("endi")?.classList.remove("filter-bar-item-selected")
                    document.getElementById("vocero")?.classList.remove("filter-bar-item-selected")
                    document.getElementById("noticel")?.classList.add("filter-bar-item-selected")
                    document.getElementById("legislacion")?.classList.remove("filter-bar-item-selected")
                    break;
                case SourceType.Legislacion:
                    document.getElementById("endi")?.classList.remove("filter-bar-item-selected")
                    document.getElementById("vocero")?.classList.remove("filter-bar-item-selected")
                    document.getElementById("noticel")?.classList.remove("filter-bar-item-selected")
                    document.getElementById("legislacion")?.classList.add("filter-bar-item-selected")
                    break;
            }
        }
    }, [currentComponent]);

    async function filterStories(source: number) {
        dispatch(updateIsFiltering(true));
        const storyResult = await window.imparcialAPI.getStories(1, currentLimit, source);
        if(!storyResult.Error) {
            const stories = storyResult.Data;
            if(stories) {
                dispatch(updateStories(stories.Stories));
                dispatch(updatePagination({
                    Source: stories.Pagination.Source,
                    Page: stories.Pagination.Page,
                    Limit: stories.Pagination.Limit,
                    Pages: stories.Pagination.Pages,
                    Total: stories.Pagination.Total
                }));       
            }
        }
        dispatch(updateIsFiltering(false));

        switch(source) {
            case SourceType.ENDI:
                document.getElementById("endi")?.classList.add("filter-bar-item-selected")
                document.getElementById("vocero")?.classList.remove("filter-bar-item-selected")
                document.getElementById("noticel")?.classList.remove("filter-bar-item-selected")
                document.getElementById("legislacion")?.classList.remove("filter-bar-item-selected")
                break;
            case SourceType.Vocero:
                document.getElementById("endi")?.classList.remove("filter-bar-item-selected")
                document.getElementById("vocero")?.classList.add("filter-bar-item-selected")
                document.getElementById("noticel")?.classList.remove("filter-bar-item-selected")
                document.getElementById("legislacion")?.classList.remove("filter-bar-item-selected")
                break;
            case SourceType.Noticel:
                document.getElementById("endi")?.classList.remove("filter-bar-item-selected")
                document.getElementById("vocero")?.classList.remove("filter-bar-item-selected")
                document.getElementById("noticel")?.classList.add("filter-bar-item-selected")
                document.getElementById("legislacion")?.classList.remove("filter-bar-item-selected")
                break;
        }

        dispatch(updateCurrentComponent(source))
        
    }

    function loadLegislation () {
        document.getElementById("endi")?.classList.remove("filter-bar-item-selected")
        document.getElementById("vocero")?.classList.remove("filter-bar-item-selected")
        document.getElementById("noticel")?.classList.remove("filter-bar-item-selected")
        document.getElementById("legislacion")?.classList.add("filter-bar-item-selected")
        dispatch(updateCurrentComponent(SourceType.Legislacion))
    }


    return (
        <div className="filter-bar-container">
            <div id="endi" onClick={async () => await filterStories(SourceType.ENDI)} className="filter-bar-item button">El Nuevo D&iacute;a</div>
            <div id="vocero" onClick={async () => await filterStories(SourceType.Vocero)} className="filter-bar-item button">El Vocero</div>
            <div id="noticel" onClick={async () => await filterStories(SourceType.Noticel)} className="filter-bar-item button">Noticel</div>
            <div id="legislacion" onClick={() => loadLegislation()} className="filter-bar-item button">Legislaci&oacute;n</div>
        </div>
    );
}