import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Navigate } from 'react-router';

import NavBar from "../../NavBar";
import { Story } from '../../../lib/models';

interface StoryDetailProps {
    showNav?: boolean,
    hash?: string
}

export default function StoryDetail({showNav = true, hash}: StoryDetailProps) {

    let params = useParams();
    const [story, setStory] = useState<Story|undefined>();
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        (async () => {
            let _hash = "";
            if(hash && hash != "") {
                _hash = hash
            }
            else {
                _hash = params.hash as string;
            }
            const _storyResult = await window.imparcialAPI.getStory(_hash);
            if(!_storyResult.Error) {
                const _story = _storyResult.Data;
                if(_story) {
                    setStory(_story);
                    setIsLoading(false);
                }
                    
            }
        })()
        setIsLoading(true);
    }, []);

    async function summarizeStory() {
        setIsSummarizing(true);
        if(story) {
            if(story.SummaryText && story.SummaryText != "") {
                setShowSummary(true);
            }
            else {
                const summaryResult = await window.imparcialAPI.summarizeArticle(story.StoryId);
                if(!summaryResult.Error) {
                    const summary = summaryResult.Data;
                    if(summary) {
                        let _story = Object.assign({}, story, {SummaryText: summary.Body})
                        setStory(_story);
                        setShowSummary(true);
                    }
                }
            }
        }
        setIsSummarizing(false);
    }

    return (
        <>
            {
                showNav? <NavBar /> : <></>
            }
            <div className="story-container">
                <div className="story-item" key={story?.StoryId}> 
                    <div className="story-item-title">
                        {isLoading? <div className='skeleton-text-line' style={{width: 200}}></div>: <div><label>{story?.Source}</label></div>}
                    </div>
                    {
                        story?.CanSummarize?
                        <div className='story-controls-container'>
                            {isLoading? <div className='skeleton-text-line short'></div> : <div className='button' onClick={async () => await summarizeStory()}>{isSummarizing? <div className='spinner'></div> : <>Resumir con I.A. &#129302;</>}</div> }
                        </div> : <></>
                    }
                    <a href={story?.Uri} target="_blank" rel="noopener noreferrer">
                        <div className="story-data-container">
                            <div className="story-data-item">
                                {isLoading? <div className='skeleton-block'></div> : <img src={story?.Media} alt="story media" />}
                            </div>
                            <div className="story-data-item">
                                {isLoading? <div className='skeleton-text-line'></div> : <label>{story?.Title}</label>}
                                {isLoading? <div className='skeleton-block'></div> : <p>{story?.Description}</p>}
                            </div>
                        </div>
                    </a>
                    {
                        showSummary? <><div className='story-ai-summary-container'><label>Resumen hecho por I.A.:</label><br /><br /><div>{story?.SummaryText}</div></div></>
                        : <></>
                    }
                </div>
            </div>
        </>
    )
}