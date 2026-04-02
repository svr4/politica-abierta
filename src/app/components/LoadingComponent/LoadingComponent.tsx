import React from 'react';
import './LoadingComponent.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAppSelector, useAppDispatch } from '../../lib/hooks';
import { appendStories, updateIsFetching, updatePagination} from "../../lib/slices/storyList";

export default function Loading() {

  const isFetching = useAppSelector((state) => state.story.IsFetching);
  const currentPage = useAppSelector((state) => state.story.Page);
  const currentLimit = useAppSelector((state) => state.story.Limit);
  const currentSource = useAppSelector((state) => state.story.Source);

  const dispatch = useAppDispatch();

  async function getAdditionalStories() {
    dispatch(updateIsFetching(true));
    const storyResult = await window.imparcialAPI.getStories((currentPage+1), currentLimit, currentSource);
    if(!storyResult.Error) {
      const stories = storyResult.Data;
      if(stories) {
        dispatch(appendStories(stories.Stories));
        dispatch(updatePagination({
          Source: stories.Pagination.Source,
          Page: stories.Pagination.Page,
          Limit: stories.Pagination.Limit,
          Pages: stories.Pagination.Pages,
          Total: stories.Pagination.Total
        }));
      }
    }
    dispatch(updateIsFetching(false));
  }

  if(isFetching){
      return (
          <div className="more-container">
            <div className="more-item">
              <div className="more-button">
                <FontAwesomeIcon icon="bolt" className="more-button-icon" id="more-button-icon" />
              </div>
            </div>
          </div>
      )
  }
  else{
      return (
          <div className="more-container">
            <div className="more-item">
              <div className="more-button" onClick={async () => { await getAdditionalStories()}}>
                <span className="more-button-label" id="more-button-label">Más Noticias</span>
              </div>
            </div>
          </div>
      )
  }
}