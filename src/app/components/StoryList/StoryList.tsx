import React, {ReactNode, useEffect, useState} from 'react'

import { useAppSelector, useAppDispatch } from '../../lib/hooks';
import { updateStories, appendStories, updateIsFiltering, updateIsSummarizing, updateStorySummary, updatePagination } from "../../lib/slices/storyList";
import '../../App.css'
import { Story } from '../../lib/models';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Loading from '../LoadingComponent/LoadingComponent';
import NewsConfig from './NewsConfig';

export default function StoryList() {

    const currentPage = useAppSelector((state) => state.story.Page);
    const currentLimit = useAppSelector((state) => state.story.Limit);
    const currentSource = useAppSelector((state) => state.story.Source);
    const isFiltering = useAppSelector((state) => state.story.IsFiltering);
    const isSummarizing = useAppSelector((state) => state.story.IsSummarizing);
    const _stories = useAppSelector((state) => state.story.Stories);
    const pages = useAppSelector((state) => state.story.Pages);
    
    const dispatch = useAppDispatch();

    const [showSummary, setShowSummary] = useState<boolean[]>([]);

    useEffect(() => {

        (async () => {
            dispatch(updateIsFiltering(true));
            const storyResult =  await window.imparcialAPI.getStories(currentPage, currentLimit, currentSource);
            if(!storyResult.Error) {
                const stories = storyResult.Data;
                if(stories) {
                    dispatch(updateStories(stories.Stories));
                    dispatch(updatePagination(stories.Pagination));
                }
            }
            dispatch(updateIsFiltering(false));
        })()

    }, []);

    useEffect(() => {

        let _showSummary = [...showSummary];
        let length = _showSummary.length;
        _stories.forEach((_, i) => {
            if((i+1) > length) {
                _showSummary.push(false);
            }
        });

        setShowSummary(_showSummary)

    }, [_stories])

    useEffect(() => {

        // clean selections
        setShowSummary([])

    }, [isFiltering])

    async function summarizeStory(storyId: number, i: number) {
        dispatch(updateIsSummarizing(true))
        const story = _stories.find((e) => e.StoryId == storyId);
        if(story) {
            let _showSummary = [...showSummary];
            if(story.SummaryText && story.SummaryText != "") {
                _showSummary[i] = true;
                setShowSummary(_showSummary);
            }
            else {
                const summaryResult = await window.imparcialAPI.summarizeArticle(storyId);
                if(!summaryResult.Error) {
                    const summary = summaryResult.Data;
                    if(summary) {
                        _showSummary[i] = true;
                        dispatch(updateStorySummary({Id: i, Summary: summary.Body}));
                        setShowSummary(_showSummary);
                    }
                }
            }
        }
        dispatch(updateIsSummarizing(false))
    }

    function renderStories() {
        if(isFiltering){
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
            let stories: ReactNode[] = [];
            _stories.forEach((story: Story, i) => {
            stories.push(
                    <div className="story-item" key={story.StoryId}>
                        <div className="story-item-title">
                            <div>
                                <label>{story.Source}</label>
                            </div>
                        </div>
                        {
                            story.CanSummarize?
                            <div className='story-controls-container'>
                                <div className='button' onClick={async () => await summarizeStory(story.StoryId, i)}>{isSummarizing? <div className='spinner'></div> : <>Resumir con I.A. &#129302;</>}</div>
                            </div> : <></>
                        }
                        <a href={story.Uri} target="_blank" rel="noopener noreferrer">
                            <div className="story-data-container">
                                <div className="story-data-item">
                                    <img src={story.Media} alt="story media" />
                                </div>
                                <div className="story-data-item">
                                    <label>{story.Title}</label>
                                    <p>{story.Description}</p>
                                </div>
                            </div>
                        </a>
                        {
                            showSummary[i]? <><div className='story-ai-summary-container'><label>Resumen hecho por I.A.:</label><br /><br /><div>{story.SummaryText}</div></div></>
                            : <></>
                        }
                    </div>
                )
            });
            return (
                <>
                    <NewsConfig />
                    <div className="story-container">{stories}</div>
                    {
                        _stories.length > 0 && pages > 1 && currentPage < pages? <Loading /> : <></>
                    }
                </>
            )
          }
    }

    return (
        <>{renderStories()}</>
    );
}