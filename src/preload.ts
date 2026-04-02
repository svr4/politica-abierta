// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import { CommitteeConfig, LegislationFilter, NewsConfig, ScrapingJobState } from "./app/lib/models";

contextBridge.exposeInMainWorld('electronAPI', {
    process: process,
    isProd: process.env.REACT_APP_ENV == "PROD",
    fetchPage: (url: string) => ipcRenderer.invoke('fetch-page', [url]),
    fetchPagePlaywright: (url: string) => ipcRenderer.invoke('fetch-page-playwright', [url]),
    startScrapingJob: (jobType: string) => ipcRenderer.invoke('start-scraping-job', [jobType]),
    saveScrapedStories: (stories: any[], newsScrapingState: ScrapingJobState) => ipcRenderer.invoke('save-scraped-stories', [stories, newsScrapingState]),
    fetchPagesForLaws: (administrationId: number, committiees: number[]) => ipcRenderer.invoke('fetch-pages-for-laws', [administrationId, committiees]),
    fetchPagesForRecentLaws: (administrationId: number) => ipcRenderer.invoke('fetch-pages-for-recent-laws', [administrationId]),
    saveScrapedLaws: (laws: any[], administrationId: number, lawScrapingState: ScrapingJobState) => ipcRenderer.invoke('save-scraped-laws', [laws, administrationId, lawScrapingState]),
    saveScrapedRecentLaws: (laws: any[], lawScrapingState: ScrapingJobState) => ipcRenderer.invoke('save-scraped-recent-laws', [laws, lawScrapingState]),
    fetchPagesForEvents: (administrationId: number) => ipcRenderer.invoke('fetch-pages-for-events', [administrationId]),
    saveScrapedEvents: (events: any[], eventScrapingState: ScrapingJobState) => ipcRenderer.invoke('save-scraped-events', [events, eventScrapingState]),
    testDownload: () => ipcRenderer.invoke('test-download')
});

contextBridge.exposeInMainWorld('imparcialAPI', {
    getStories: (page?: number, limit?: number, source?: number) => ipcRenderer.invoke('get-stories', [page, limit, source]),
    getStory: (hash: string) => ipcRenderer.invoke('get-story', [hash]),
    getLegislations: (page?: number, limit?: number, filter?: LegislationFilter) => ipcRenderer.invoke('get-legislations', [page, limit, filter]),
    getLegislationByHash: (hash: string) => ipcRenderer.invoke('get-legislation-by-hash', [hash]),
    getLegislationById: (id: number) => ipcRenderer.invoke('get-legislation-by-id', [id]),
    getMyProjects: (page?: number, limit?: number, category?: string) => ipcRenderer.invoke('get-my-projects', [page, limit, category]),
    updateSubscribedProjectTags: (legislationId: number, tags: string[]) => ipcRenderer.invoke('update-subscribed-project-tags', [legislationId, tags]),
    getRecentLegislations: (page?: number, limit?: number, filter?: LegislationFilter) => ipcRenderer.invoke('get-recent-legislations', [page, limit, filter]),
    searchLegislation: (searchText: string, page?: number, limit?: number) => ipcRenderer.invoke('search-legislation', [searchText, page, limit]),
    summarizeArticle: (storyId: number) => ipcRenderer.invoke('summarize-article', [storyId]),
    summarizeLegislationDoc: (docId: number) => ipcRenderer.invoke('summarize-legislation-doc', [docId]),
    summarizeRecentLegislationDoc: (legislationId: number) => ipcRenderer.invoke('summarize-recent-legislation-doc', [legislationId]),
    getConfig: () => ipcRenderer.invoke('get-config'),
    updateCommitteeConfig: (committees: CommitteeConfig[]) => ipcRenderer.invoke('update-committee-config', [committees]),
    updateNewsConfig: (news: NewsConfig[]) => ipcRenderer.invoke('update-news-config', [news]),
    updateSubscribedProjects: (legislationId: number) => ipcRenderer.invoke('update-subscribed-projects', [legislationId]),
    getNotifications: () => ipcRenderer.invoke('get-notifications'),
    markNotificationAsRead: (notifId: number) => ipcRenderer.invoke('mark-notifications-as-read', [notifId]),
    getPendingScrapingJob: (jobType: "NEWS_SCRAPER" | "LAW_SCRAPER" | "RECENT_LAW_SCRAPER" | "EVENT_SCRAPER") => ipcRenderer.invoke('get-pending-scraping-job', [jobType]),
    getFiledProject: (administrationId: number, legislationId: number, uri: string) => ipcRenderer.invoke('get-filed-project', [administrationId, legislationId, uri]),
    getFiledProjectForRecentLegislation: (administrationId: number, legislationId: number, uri: string) => ipcRenderer.invoke('get-filed-project-for-recent-legislation', [administrationId, legislationId, uri])
});