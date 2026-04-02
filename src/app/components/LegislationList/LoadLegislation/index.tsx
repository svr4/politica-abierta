import React from 'react';
import './LoadingComponent.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAppSelector, useAppDispatch } from '../../../lib/hooks';
import { appendLegislation, updateIsFetching, updatePagination, appendRecentLegislation, appendSubscribedLegislation} from "../../../lib/slices/legislationList";
import { updateLegislationFilter } from '../../../lib/slices/appConfig';
import { LegislationSourceType } from '../../../lib/models';

export default function Loading() {

  const isFetching = useAppSelector((state) => state.legislation.IsFetching);
  const currentPage = useAppSelector((state) => state.legislation.Page);
  const currentLimit = useAppSelector((state) => state.legislation.Limit);
  const currentFilter = useAppSelector((state) => state.appConfig.legislationFilters);
  const source = useAppSelector((state) => state.legislation.LegislationSourceType);

  const dispatch = useAppDispatch();

  async function getAdditionalLegislation() {
    dispatch(updateIsFetching(true));
    switch (source) {
      case LegislationSourceType.Legislation: {
        const legislationResult = await window.imparcialAPI.getLegislations((currentPage+1), currentLimit, currentFilter);
        if(!legislationResult.Error) {
          const legislation = legislationResult.Data;
          if(legislation) {
            dispatch(updateLegislationFilter(legislation.Filter));
            dispatch(appendLegislation(legislation.Legislation));
            dispatch(updatePagination({
              Page: legislation.Pagination.Page,
              Limit: legislation.Pagination.Limit,
              Pages: legislation.Pagination.Pages,
              Total: legislation.Pagination.Total
            }));
          }
        }
        break;
      }
      case LegislationSourceType.RecentLegislation: {
        const legislationResult = await window.imparcialAPI.getRecentLegislations((currentPage+1), currentLimit, currentFilter);
        if(!legislationResult.Error) {
          const legislation = legislationResult.Data;
          if(legislation) {
            dispatch(updateLegislationFilter(legislation.Filter));
            dispatch(appendRecentLegislation(legislation.Legislation));
            dispatch(updatePagination({
              Page: legislation.Pagination.Page,
              Limit: legislation.Pagination.Limit,
              Pages: legislation.Pagination.Pages,
              Total: legislation.Pagination.Total
            }));
          }
        }
        break;
      }
      case LegislationSourceType.SubscribedLegislation: {
        const legislationResult = await window.imparcialAPI.getMyProjects((currentPage+1), currentLimit, currentFilter.searchText);
        if(!legislationResult.Error) {
          const legislation = legislationResult.Data;
          if(legislation) {
            dispatch(appendSubscribedLegislation(legislation.Legislation));
            dispatch(updatePagination({
              Page: legislation.Pagination.Page,
              Limit: legislation.Pagination.Limit,
              Pages: legislation.Pagination.Pages,
              Total: legislation.Pagination.Total
            }));
          }
        }
        break;
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
              <div className="more-button" onClick={async () => { await getAdditionalLegislation()}}>
                <span className="more-button-label" id="more-button-label">Más Legislación</span>
              </div>
            </div>
          </div>
      )
  }
}