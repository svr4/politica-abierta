export interface Story {
    StoryId: number,
    Title: string,
    Description: string,
    Uri: string,
    Source: string,
    Media: string,
    ScrapedDate: string,
    Hash: string,
    SummaryText: string | null,
    CanSummarize: boolean
}

export interface Pagination {
    Page: number,
    Limit: number,
    Total: number,
    Pages: number
}

export interface StoryPagination extends Pagination {
    Source: number
}

export interface StoryList {
    Stories: [Story],
    Pagination: StoryPagination
}

export enum SourceType {
    ENDI = 1,
    Vocero,
    Noticel,
    Legislacion
}

export enum LegislationSourceType {
    Legislation = 1,
    RecentLegislation,
    SubscribedLegislation
}

export interface ApiResult<T> {
    Data: T,
    Error: any|null
}

export interface Legislation {
    LegislationId: number,
    Number: number,
    FiledDate: string,
    Title: string,
    Author: string,
    CoAuthor: string,
    Uri: string,
    Committe: number,
    AdministrationId: number,
    LastEvent: string,
    ScrapedDate: string,
    Hash: string,
    Docs: LegislationDoc[],
    Events: LegislationEvent[],
    IsSubscribed: boolean
}

export interface RecentLegislation {
    LegislationId: number,
    Number: number,
    FiledDate: string,
    Title: string,
    Author: string,
    CoAuthor: string,
    Uri: string,
    AdministrationId: number,
    LastEvent: string,
    ScrapedDate: string,
    Hash: string,
    DocDesc: string,
    DocUri: string,
    DocType: string,
    DocSummary: string,
    HasDocument: boolean,
    EventDescription: string
}

export interface SubscribedLegislation extends Legislation {
    Tags: string[]|undefined
}

export interface LegislationList {
    Legislation: [Legislation]
    Pagination: Pagination,
    Filter: LegislationFilter
}

export interface RecentLegislationList {
    Legislation: [RecentLegislation]
    Pagination: Pagination,
    Filter: LegislationFilter
}

export interface SubscribedLegislationList {
    Legislation: [SubscribedLegislation]
    Pagination: Pagination
}

export interface ArticleSummary {
    Body: string
}

export interface LegislationSummary {
    Body: string
}

export interface UpdateStorySummary {
    Id: number,
    Summary: string
}

export interface UpdateLegDocSummary {
    Id: number,
    docIndex: number,
    Summary: string
}

export interface UpdateRecentLegDocSummary {
    Id: number,
    Summary: string
}

export interface UpdateCommitteeConfig {
    Config: CommitteeConfig
}

export interface UpdateSubscribedLegislationTags {
    LegislationId: number,
    Tags: string[]
}

export interface UpdateIsSubscribedToProject {
    LegislationId: number,
    IsSubscribed: boolean
}

export interface UpdateLegislationEvents {
    LegislationId: number,
    Events: LegislationEvent[]
}

export interface RemoveCommitteeConfig {
    AdministrationId: number,
    CommitteeId: number
}

export interface LegislationDoc {
    LegDocId: number,
    Description: string,
    DocType: string,
    Uri: string,
    DocSummary: string,
    LegislationIdFk: number
}

export interface LegislationEvent {
    LegEventId: number,
    Title: string,
    Description: string,
    Uri: string,
    DocType: string,
    DocSummary: string,
    LegislationIdFk: number,
    HasDocument: boolean
}

export interface CommitteeConfig {
    AdministrationId: number,
    CommitteeId: number,
    NotifyOnNewLegislation: boolean,
    NotificationFilters: string[]
}

export interface NewsConfig {
    SourceType: SourceType,
    NotifyOnNewNews: boolean,
    DefaultFilter: string,
    NotificationFilters: string[]
}

export interface ConfigurationOptions {
    Committees: CommitteeConfig[],
    News: NewsConfig[]
}

export interface Configuration {
    ConfigId: number,
    Config: ConfigurationOptions
}

export interface LegislationFilter {
    searchText: string,
    committee: number
}

export interface LegislationConfig {
    WatchedLegislation: number[]
}

export interface LoginResponse {
    CodeId: string,
    IsConfirmed: boolean
}

export interface VerifyLoginCodeResponse {
    SessionToken: string,
    Channel: string
}

export interface RefreshResponse extends VerifyLoginCodeResponse {
    IsConfirmed: boolean
}

export interface Notification {
    NotifId: number,
    MatchedLegislation: string[],
    MatchedNews: string[],
    Message: string,
    Payload: string,
    NotificationDate: string,
    Read: boolean
    MatchedProjectsForEvents: number[]
}

export interface NewsScraperData {
    EndiPages: string[],
    VoceroPages: string[],
    NoticelPages: string[],
    ScrapingDate: string
}

export interface LawScraperData {
    Pages: LawScraperPage[],
    ScrapingDate: string
}

export interface EventScraperData {
    Pages: EventScraperPage[],
    ScrapingDate: string
}

export interface EventScraperPage {
    LegislationId: number,
    Page: string,
    AdministrationId: number
}

export interface LawScraperPage {
    Page: string,
    Committiee: number,
    AdministrationId: number
}

export interface ScrapingJobState {
    ScrapingJobId: number,
    ScrapingDate: string
}


export interface ImparcialApi {
    getStories: (page?: number, limit?: number, source?: number) => Promise<ApiResult<StoryList|null>>,
    getStory: (hash: string) => Promise<ApiResult<Story|null>>,
    getLegislations: (page?: number, limit?: number, filter?: LegislationFilter) => Promise<ApiResult<LegislationList|null>>,
    getLegislationByHash: (hash: string) => Promise<ApiResult<Legislation|null>>,
    getLegislationById: (id: number) => Promise<ApiResult<Legislation|null>>,
    getMyProjects: (page?: number, limit?: number, category?: string) => Promise<ApiResult<SubscribedLegislationList|null>>,
    updateSubscribedProjectTags: (legislationId: number, tags: string[]) => Promise<ApiResult<boolean|null>>,
    getRecentLegislations: (page?: number, limit?: number, filter?: LegislationFilter) => Promise<ApiResult<RecentLegislationList|null>>,
    searchLegislation: (searchText: string, page?: number, limit?: number) => Promise<ApiResult<LegislationList|null>>,
    summarizeArticle: (storyId: number) => Promise<ApiResult<ArticleSummary|null>>,
    summarizeLegislationDoc: (docId: number) => Promise<ApiResult<LegislationSummary|null>>,
    summarizeRecentLegislationDoc: (legislationId: number) => Promise<ApiResult<LegislationSummary|null>>,
    getConfig: () => Promise<ApiResult<Configuration|null>>,
    updateCommitteeConfig: (committees: CommitteeConfig[]) => Promise<ApiResult<Configuration|null>>,
    updateNewsConfig: (news: NewsConfig[]) => Promise<ApiResult<Configuration|null>>,
    updateSubscribedProjects: (legislationId: number) => Promise<ApiResult<boolean|null>>,
    getNotifications: () => Promise<ApiResult<Notification[]|null>>,
    markNotificationAsRead: (notifId: number) => Promise<ApiResult<boolean|null>>,
    getPendingScrapingJob: (jobType: "NEWS_SCRAPER" | "LAW_SCRAPER" | "RECENT_LAW_SCRAPER" | "EVENT_SCRAPER") => Promise<ApiResult<boolean|null>>,
    getFiledProject: (administrationId: number, legislationId: number, uri: string) => Promise<ApiResult<LegislationEvent[]|null>>,
    getFiledProjectForRecentLegislation: (administrationId: number, legislationId: number, uri: string) => Promise<ApiResult<LegislationEvent[]|null>>
}


declare global {
  export interface Window {
    electronAPI: any,
    imparcialAPI: ImparcialApi
  }
}