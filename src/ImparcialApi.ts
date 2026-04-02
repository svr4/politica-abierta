import { BrowserWindow, session } from 'electron';
import { ImparcialDb } from "./db";
import { Notification, ArticleSummary, CommitteeConfig, Configuration, Legislation, LegislationFilter, LegislationList,
    LegislationSummary, NewsConfig, RecentLegislationList, Story, StoryList, ApiResult, SubscribedLegislationList, SourceType, 
    LegislationEvent} from "./app/lib/models";
import * as cheerio from 'cheerio';
import { fromBuffer } from 'pdf2pic';
import WordExtractor from 'word-extractor';
import { chromium } from 'playwright';
import https from 'node:https';
import fs from "node:fs";
import moment from 'moment-timezone';

export default class ImparcialApi {
    public static getStories(page?: number, limit?: number, source?: number): Promise<ApiResult<StoryList|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                // Extract pagination parameters with defaults
                page = page || 1;
                limit = limit || 10;
                source = source || 1; // ENDI
                const offset = (page - 1) * limit;

                // Get total count for pagination info
                const totalCount = await db.get('SELECT COUNT(*) as count FROM Story');

                // Fetch paginated stories
                const stories = await db.all(
                'SELECT StoryId, Title, Story.Description, Uri, StoryType.Description as "Source", Media, ScrapedDate, Hash, SummaryText, CanSummarize FROM Story INNER JOIN StoryType on StoryTypeId = SourceTypeId WHERE SourceTypeId = ? ORDER BY ScrapedDate DESC LIMIT ? OFFSET ?', 
                [source, limit, offset]
                );

                // Calculate pagination info
                const totalPages = Math.ceil(totalCount.count / limit);
                
                resolve({
                    Data: {
                        Stories: stories,
                        Pagination: {
                            Source: source,
                            Page: page,
                            Limit: limit,
                            Total: totalCount.count,
                            Pages: totalPages
                        }
                    },
                    Error: null
                });

            } catch (error) {
                console.error('Error fetching stories:', error);
                resolve({
                    Data: null,
                    Error: `Error fetching stories: ${error}`
                })
            } finally {
                db.close();
            }
        });
    }

    public static getStory(hash: string): Promise<ApiResult<Story|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                const story = await db.get('SELECT StoryId, Title, Story.Description, Uri, StoryType.Description as "Source", Media, ScrapedDate, Hash, SummaryText, CanSummarize FROM Story INNER JOIN StoryType on StoryTypeId = SourceTypeId WHERE Hash = ?;', hash);

                if (!story) {
                    resolve({
                        Data: null,
                        Error: 'Story not found'
                    });
                }
                
                resolve ({
                    Data: story,
                    Error: null
                });
                
            } catch (error) {
                console.error('Error fetching story:', error);
                resolve({
                    Data: null,
                    Error: `Error fetching story: ${error}`
                })
            } finally {
                db.close();
            }
        });
    }

    public static getLegislations(page?: number, limit?: number, filter?: LegislationFilter): Promise<ApiResult<LegislationList|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                
                page = page|| 1;
                limit = limit || 10;
                const offset = (page - 1) * limit;
                const filterCommittee = filter?.committee || -1;
                const searchText = filter?.searchText;

                // get the config
                let legislation: any = [];
                let totalCount;
                let totalPages = 0;
                    
                let config = await db.get("SELECT * FROM Configuration WHERE ConfigId = ?;", [1]);

                if(!config) {
                // No legislation configuration, return empty and UI will let them know they need to configure.
                    totalCount = { count: 0 };
                    legislation = [];
                    totalPages = 0;
                }
                else {
                    config.Config = JSON.parse(config.Config);

                    let committees = []

                    if(filterCommittee == -1) {
                        committees = config.Config.Committees.map((e: any) => e.CommitteeId);
                    }
                    else {
                        committees.push(filterCommittee);
                    }

                    totalCount = await db.get('SELECT COUNT(*) as count FROM Legislation WHERE Committe in (SELECT value from json_each(?));', [JSON.stringify(committees)]);
                    
                    legislation = await db.all(`SELECT l.*, IFNULL(sub.SubProjectId, 0) as IsSubscribed FROM Legislation l LEFT JOIN SubscribedProject sub ON l.LegislationId = sub.LegislationIdFk WHERE Committe in (SELECT value from json_each(?)) ORDER BY SUBSTR(FiledDate, 7, 4) || '-' || SUBSTR(FiledDate, 1, 2) || '-' || SUBSTR(FiledDate, 4, 2) DESC LIMIT ? OFFSET ?;`, [JSON.stringify(committees), limit, offset]);

                    for(let i=0; i < legislation.length; i++) {
                        const events = await db.all('SELECT LegEventId, Title, Description, DocType, Uri, DocSummary, LENGTH(IFNULL(Document,\'\')) as HasDocument FROM LegislationEvent WHERE LegislationIdFk = ? ORDER BY CreatedDate desc;', legislation[i].LegislationId);
                        legislation[i].Events = events;
                    }

                    // Calculate pagination info
                    totalPages = Math.ceil(totalCount.count / limit);
                }
                
                resolve({
                    Data: {
                        Legislation: legislation,
                        Pagination: {
                            Page: page,
                            Limit: limit,
                            Total: totalCount.count,
                            Pages: totalPages
                        },
                        Filter: {
                            searchText,
                            committee: filterCommittee
                        }
                    },
                    Error: null
                });
            } catch (error) {
                console.error('Error fetching legislation:', error);
                resolve({
                    Data: null,
                    Error: `Error fetching legislation: ${error}`
                })
            } finally {
                db.close();
            }
        })
    }

    public static getLegislationByHash(hash: string): Promise<ApiResult<Legislation|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {

                let legislation: any = null;
                let isRecentLegislation = false;
                let config = await db.get("SELECT * FROM Configuration WHERE ConfigId = ?;", [1]);
            
                if(!config) {
                    resolve ({
                        Data: null,
                        Error: "Internal server error. No configuration for user."
                    })
                }
                else {
                    config.Config = JSON.parse(config.Config);

                    const committees = config.Config.Committees.map((e: any) => e.CommitteeId);

                    legislation = await db.get('SELECT l.*, IFNULL(sub.SubProjectId, 0) as IsSubscribed FROM Legislation as l LEFT JOIN SubscribedProject as sub ON l.LegislationId = sub.LegislationIdFk WHERE Hash = ? and Committe in (SELECT value from json_each(?));', [hash, JSON.stringify(committees)]);

                    if (!legislation) {
                        // check for recently filed legislation
                        const _recentLegislation = await db.get('SELECT LegislationId, Number, FiledDate, Title, Author, CoAuthor, Uri, AdministrationId, LastEvent, ScrapedDate, Hash, DocDesc, DocUri, DocType, DocText, DocSummary, LENGTH(IFNULL(Document,\'\')) as HasDocument, EventDescription FROM RecentlyFiledLegislation WHERE Hash = ?;', [hash]);
                        if(!_recentLegislation) {
                            resolve ({
                                Data: null,
                                Error:  'Legislation not found'
                            });
                        }
                        else {
                            legislation = _recentLegislation;
                            isRecentLegislation = true;
                        }
                    }

                    if(!isRecentLegislation) {
                        const events = await db.all('SELECT LegEventId, Title, Description, DocType, Uri, DocSummary,  LENGTH(IFNULL(Document,\'\')) as HasDocument FROM LegislationEvent WHERE LegislationIdFk = ? ORDER BY CreatedDate desc;', legislation.LegislationId);
                        legislation.Events = events;
                    }
                    else {
                        // SELECT -1 as LegDocId, DocDesc as Description, DocType, DocUri as Uri, DocSummary, LegislationId
                        if(legislation.HasDocument) {
                        legislation.Events = [{
                            LegEventId: -1,
                            Title: legislation.DocDesc,
                            Description: legislation.EventDescription,
                            DocType: legislation.DocType,
                            Uri: legislation.DocUri,
                            DocSummary: legislation.DocSummary,
                            LegislationId: legislation.LegislationId,
                            HasDocument: legislation.HasDocument
                        }];
                        }
                        else {
                        legislation.Events = [];
                        }
                    }
                }
                
                resolve({
                    Data: legislation,
                    Error: null
                });

            } catch (error) {
                console.error('Error fetching legislation:', error);
                resolve({
                    Data: null,
                    Error: `Error fetching legislation: ${error}`
                })
            } finally {
                db.close();
            }
        })
    }

    public static getLegislationById(id: number): Promise<ApiResult<Legislation|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                
                const legislationId = id;
                let legislation: any = null;
                let isRecentLegislation = false;
                let config = await db.get("SELECT * FROM Configuration WHERE ConfigId = ?;", [1]);
            
                if(!config) {
                    resolve({
                        Data: null,
                        Error: "Internal server error. No configuration for user."
                    })
                }
                else {
                    config.Config = JSON.parse(config.Config);

                    const committees = config.Config.Committees.map((e: any) => e.CommitteeId);

                    legislation = await db.get('SELECT l.*, IFNULL(sub.SubProjectId, 0) as IsSubscribed FROM Legislation as l LEFT JOIN SubscribedProject as sub ON l.LegislationId = sub.LegislationIdFk WHERE LegislationId = ? and Committe in (SELECT value from json_each(?));', [legislationId, JSON.stringify(committees)]);

                    if (!legislation) {
                        // check for recently filed legislation
                        const _recentLegislation = await db.get('SELECT LegislationId, Number, FiledDate, Title, Author, CoAuthor, Uri, AdministrationId, LastEvent, ScrapedDate, Hash, DocDesc, DocUri, DocType, DocText, DocSummary, LENGTH(IFNULL(Document,\'\')) as HasDocument, EventDescription FROM RecentlyFiledLegislation WHERE LegislationId = ?;', [legislationId]);
                        if(!_recentLegislation) {
                            resolve({
                                Data: null,
                                Error: 'Legislation not found'
                            });
                        }
                        else {
                            legislation = _recentLegislation;
                            isRecentLegislation = true;
                        }
                    }

                    if(!isRecentLegislation) {
                        const events = await db.all('SELECT LegEventId, Title, Description, DocType, Uri, DocSummary,  LENGTH(IFNULL(Document,\'\')) as HasDocument FROM LegislationEvent WHERE LegislationIdFk = ? ORDER BY CreatedDate desc;', legislation.LegislationId);
                        legislation.Events = events;
                    }
                    else {
                        // SELECT -1 as LegDocId, DocDesc as Description, DocType, DocUri as Uri, DocSummary, LegislationId
                        if(legislation.HasDocument) {
                        legislation.Events = [{
                            LegEventId: -1,
                            Title: legislation.DocDesc,
                            Description: legislation.EventDescription,
                            DocType: legislation.DocType,
                            Uri: legislation.DocUri,
                            DocSummary: legislation.DocSummary,
                            LegislationId: legislation.LegislationId,
                            HasDocument: legislation.HasDocument
                        }];
                        }
                        else {
                        legislation.Events = [];
                        }
                    }
                }
                
                resolve({
                    Data: legislation,
                    Error: null
                });
            } catch (error) {
                console.error('Error fetching legislation:', error);
                resolve({
                    Data: null,
                    Error: `Error fetching legislation: ${error}`
                })
            } finally {
                db.close();
            }
        })
    }

    public static getMyProjects(page?: number, limit?: number, category?: string): Promise<ApiResult<SubscribedLegislationList|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {

                page = page || 1;
                limit = limit || 10;
                const offset = (page - 1) * limit;
                let searchText = category;

                if(searchText == "undefined")
                    searchText = "";

                // get the config
                let legislation: any = [];
                let totalCount;
                let totalPages = 0;

                if(searchText && searchText != "") {
                    totalCount = await db.get('SELECT COUNT(SubProjectId) as count FROM SubscribedProject, json_each(Tags) AND value = ?;', [searchText]);
                    legislation = await db.all(`SELECT l.*, IFNULL(sub.SubProjectId, 0) as IsSubscribed, sub.Tags FROM Legislation as l, json_each(sub.Tags) INNER JOIN SubscribedProject as sub ON l.LegislationId = sub.LegislationIdFk WHERE value = ? ORDER BY SUBSTR(FiledDate, 7, 4) || '-' || SUBSTR(FiledDate, 1, 2) || '-' || SUBSTR(FiledDate, 4, 2) DESC LIMIT ? OFFSET ?;`, [searchText, limit, offset]);
                }
                else {
                    totalCount = await db.get('SELECT COUNT(*) as count FROM SubscribedProject;');
                    legislation = await db.all(`SELECT l.*, IFNULL(sub.SubProjectId, 0) as IsSubscribed, sub.Tags FROM Legislation as l INNER JOIN SubscribedProject as sub ON l.LegislationId = sub.LegislationIdFk ORDER BY SUBSTR(FiledDate, 7, 4) || '-' || SUBSTR(FiledDate, 1, 2) || '-' || SUBSTR(FiledDate, 4, 2) DESC LIMIT ? OFFSET ?;`, [limit, offset]);
                }

                for(let i=0; i < legislation.length; i++) {
                    const events = await db.all('SELECT LegEventId, Title, Description, DocType, Uri, DocSummary, LENGTH(IFNULL(Document,\'\')) as HasDocument FROM LegislationEvent WHERE LegislationIdFk = ? ORDER BY CreatedDate desc;', legislation[i].LegislationId);
                    legislation[i].Events = events;
                    if(legislation[i].Tags && legislation[i].Tags != "") {
                        legislation[i].Tags = JSON.parse(legislation[i].Tags);
                    }
                }

                // Calculate pagination info
                totalPages = Math.ceil(totalCount.count / limit);
                
                resolve({
                    Data: {
                        Legislation: legislation,
                        Pagination: {
                            Page: page,
                            Limit: limit,
                            Total: totalCount.count,
                            Pages: totalPages
                        }
                    },
                    Error: null
                })
            } catch (error) {
                console.error('Error fetching legislation:', error);
                resolve({
                    Data: null,
                    Error: `Error fetching legislation: ${error}`
                })
            } finally {
                db.close();
            }
        })
    }

    public static updateSubscribedProjectTags(legislationId: number, tags: string[]): Promise<ApiResult<boolean|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                
                let subscribedProject = await db.get("SELECT * FROM SubscribedProject WHERE LegislationIdFk = ?;", [legislationId]);
                if(subscribedProject) {
                    await db.run("UPDATE SubscribedProject SET Tags = ? WHERE SubProjectId = ?;", [JSON.stringify(tags), subscribedProject.SubProjectId]);
                    resolve({
                        Data: true,
                        Error: null
                    })
                }
                else {
                    resolve({
                        Data: null,
                        Error: 'Project not found.'
                    })
                }

            } catch (error) {
                console.error('Error updating tags:', error);
                resolve({
                    Data: null,
                    Error: `Error updating tags: ${error}`
                })
            } finally {
                db.close();
            }
        })
    }

    public static getRecentLegislations(page?: number, limit?: number, filter?: LegislationFilter): Promise<ApiResult<RecentLegislationList|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                
                // TODO: Get a users configuration to retrieve the committees they are scraping.
                page = page || 1;
                limit = limit || 10;
                const offset = (page - 1) * limit;
                const filterSearchText = filter?.searchText;

                const totalCount = await db.get('SELECT COUNT(*) as count FROM RecentlyFiledLegislation;');
                const legislation = await db.all(`SELECT LegislationId, Number, FiledDate, Title, Author, CoAuthor, Uri, AdministrationId, LastEvent, ScrapedDate, Hash, DocDesc, DocUri, DocType, DocSummary, LENGTH(Document) as HasDocument, EventDescription FROM RecentlyFiledLegislation ORDER BY SUBSTR(FiledDate, 7, 4) || '-' || SUBSTR(FiledDate, 1, 2) || '-' || SUBSTR(FiledDate, 4, 2) DESC LIMIT ? OFFSET ?;`, [limit, offset]);

                // Calculate pagination info
                const totalPages = Math.ceil(totalCount.count / limit);
                
                resolve({
                    Data: {
                        Legislation: legislation,
                        Pagination: {
                            Page: page,
                            Limit: limit,
                            Total: totalCount.count,
                            Pages: totalPages
                        },
                        Filter: {
                            searchText: filterSearchText,
                            committee: -1
                        }
                    },
                    Error: null
                });
            } catch (error) {
                console.error('Error fetching legislation:', error);
                resolve({
                    Data: null,
                    Error: `Error fetching legislation: ${error}`
                });
            } finally {
                db.close();
            }
        })
    }

    public static searchLegislation(searchText: string, page?: number, limit?: number): Promise<ApiResult<LegislationList|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {

                page = page || 1;
                limit = limit || 10;
                const offset = (page - 1) * limit;

                if(searchText == "undefined")
                    searchText = "";

                let legislation: any = [];
                let totalCount = { count: 0 };
                let totalPages = 0;

                if(searchText && searchText != "") {
                    
                    // If just number, attach PS, PC, RC, RCC, RCS, RS, RK NM with OR syntax on query
                    // else do what's already done.
                    const projectNumber = parseInt(searchText);
                    if(!Number.isNaN(projectNumber)) {
                        // find leading amount of 0
                        let leadingZeros = "";
                        for(let i=0; i < searchText.length; i++) {
                            if(searchText[i] == "0")
                            leadingZeros += "0";
                        }
                        searchText = `PS${leadingZeros}${projectNumber} OR PC${leadingZeros}${projectNumber} OR RC${leadingZeros}${projectNumber} OR RCC${leadingZeros}${projectNumber} OR RCS${leadingZeros}${projectNumber} OR RS${leadingZeros}${projectNumber} OR RK${leadingZeros}${projectNumber} OR RKS${leadingZeros}${projectNumber} OR RKC${leadingZeros}${projectNumber} OR NM${leadingZeros}${projectNumber}`;
                    }

                    if(searchText != "")
                        totalCount = await db.get('SELECT COUNT(*) as count FROM LegislationLookup(?);', [searchText]);
                    else
                        totalCount = await db.get('SELECT COUNT(*) as count FROM LegislationLookup();');
                
                    // legislation = await db.all('SELECT * FROM LegislationLookup(?) ORDER BY FiledDate DESC LIMIT ? OFFSET ?', [searchText, limit, offset]);
                    const hashes = await db.all(`SELECT Hash FROM LegislationLookup(?) ORDER BY SUBSTR(FiledDate, 7, 4) || '-' || SUBSTR(FiledDate, 1, 2) || '-' || SUBSTR(FiledDate, 4, 2) DESC LIMIT ? OFFSET ?;`, [searchText, limit, offset]);
                    const _hashes = hashes.map((e:any) => e.Hash);

                    legislation = await db.all('SELECT A.*, IFNULL(sub.SubProjectId, 0) as IsSubscribed from (select LegislationId, Number, Title, FiledDate, Author, CoAuthor, Uri, Committe, AdministrationId, LastEvent, Hash from Legislation UNION select LegislationId, Number, Title, FiledDate, Author, CoAuthor, Uri, -1, AdministrationId, LastEvent, Hash from RecentlyFiledLegislation) as A LEFT JOIN SubscribedProject sub ON A.LegislationId = sub.LegislationIdFk WHERE Hash in (SELECT value from json_each(?))',
                        [JSON.stringify(_hashes)]
                    )

                    for(let i=0; i < legislation.length; i++) {
                        if(legislation[i].Committe > -1) {
                            const events = await db.all('SELECT LegEventId, Title, Description, DocType, Uri, DocSummary, LENGTH(IFNULL(Document,\'\')) as HasDocument FROM LegislationEvent WHERE LegislationIdFk = ? ORDER BY CreatedDate desc;', legislation[i].LegislationId);
                            legislation[i].Events = events;
                        }
                        else {
                            const recentLegEvent = await db.get('SELECT -1 as LegEventId, DocDesc as Title, DocType, DocUri as Uri, DocSummary, LegislationId, 1 as HasDocument FROM RecentlyFiledLegislation WHERE LENGTH(Document) > 0 and LegislationId = ?;', legislation[i].LegislationId);
                            if(recentLegEvent)
                                legislation[i].Events = [recentLegEvent];
                            else
                                legislation[i].Events = [];
                        }
                    }
                    // Calculate pagination info
                    totalPages = Math.ceil(totalCount.count / limit);
                }

                resolve({
                    Data: {
                        Legislation: legislation,
                        Pagination: {
                            Page: page,
                            Limit: limit,
                            Total: totalCount.count,
                            Pages: totalPages
                        },
                        Filter: {
                            searchText,
                            committee: -1
                        }
                    },
                    Error: null
                });

            } catch (error) {
                console.error('Error fetching legislation:', error);
                resolve({
                    Data: null,
                    Error: `Error fetching legislation: ${error}`
                });
            } finally {
                db?.close();
            }
        })
    }

    // TODO: Integrate local AI to summarize article.
    public static summarizeArticle(storyId: number): Promise<ApiResult<ArticleSummary|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {

                const id = storyId
                const story = await db.get('SELECT * FROM Story WHERE StoryId = ?', id);
                

                if (!story) {
                    resolve({
                        Data: null,
                        Error: 'Story not found'
                    });
                }

                let html = "";
                if(!story.ArticleText || story.ArticleText == "") {
                    const page = await fetch(story.Uri);
                
                    if(page.status != 200) {
                        resolve({
                            Data: null,
                            Error: `Requested Story URI returned with code ${page.status}-${page.statusText}.`
                        })
                    }

                    const html = await page.text();
                }
                else {
                    html = story.ArticleText;
                }
                
                const $ = cheerio.load(html);

                let summary = "";

                if(story.SummaryText && story.SummaryText != "") {
                    summary = story.SummaryText;
                }
                else {
                    let articleText = story.ArticleText;
                    if(!story.ArticleText || story.ArticleText == "") {
                        // parse article
                        articleText = "";
                        switch(story.SourceTypeId) {
                            case SourceType.ENDI:
                                $(".content-element").each((i, element) => {
                                    articleText += $(element).text();
                                });
                                break;
                            case SourceType.Vocero:
                                $('#article-body').find("p").each((i, element) => {
                                    articleText += $(element).text();
                                });
                                break;
                            case SourceType.Noticel:
                                $('p.article__body').each((i, element) => {
                                    articleText += $(element).text();
                                });
                                break;
                        }

                        await db.run("UPDATE Story SET ArticleText = ? WHERE StoryId = ?;", [articleText, id]);
                    }

                    const _response = {
                        body: ""
                    }

                    if(_response.body != "") {
                        await db.run("UPDATE Story SET SummaryText = ? WHERE StoryId = ?;", [_response.body, id]);
                    }

                    summary = _response.body;
                }

                resolve({
                    Data: {
                        Body: summary
                    },
                    Error: null
                });
            } catch (error) {
                console.error('Error summarizing article:', error);
                resolve({
                    Data: null,
                    Error: `Error summarizing article: ${error}`
                });
            } finally {
                db.close();
            }
        })
    }

    // TODO: Fix AI locally.
    public static summarizeLegislationDoc(docId: number): Promise<ApiResult<LegislationSummary|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {

                const id = docId;

                const event = await db.get('SELECT LegEventId, Title, Description, Uri, Document, DocType, DocText, DocSummary FROM LegislationEvent WHERE LegEventId = ?', id);

                let legislationBody = "";
                let backupLegislationBody = "";
                let hasSummary = false;
                let summary = "";


                const extract_and_save_doc = async (docId: number, document: Buffer) => {
                    const extractor = new WordExtractor();
                    const extracted = await extractor.extract(document);
                    const text = extracted.getBody();
                    await db?.run("UPDATE LegislationEvent SET DocText = ? WHERE LegEventId = ?;", [text, docId]);
                    return text;
                }

                // if the legislation doesn't have a summary.
                if(!event.DocSummary || event.DocSummary == "") {
                    switch(true) {
                        case event.DocType.includes("doc"): {
                            legislationBody = await extract_and_save_doc(event.LegEventId, event.Document);
                            break;
                        }
                        case event.DocType == "pdf": {
                            const enrollado = await db.get('SELECT LegEventId, Title, Description, Uri, Document, DocType, DocText, DocSummary FROM LegislationEvent WHERE LegislationIdFk = ? AND Description = "Se dispone que sea enrolado"', id);

                            if(enrollado) {
                                if(!enrollado.DocText || enrollado.DocText == "") {
                                    backupLegislationBody = await extract_and_save_doc(enrollado.LegEventId, enrollado.Document);
                                }
                                else {
                                    backupLegislationBody = enrollado.DocText;
                                }
                            }

                            let ocrd_text = "";

                            await db.run("UPDATE LegislationEvent SET DocText = ? WHERE LegEventId = ?;", [ocrd_text, event.LegEventId]);
                            break;
                        }
                        default:
                            console.error('Error summarizing legislation doc: Document format not supported.');
                            resolve({
                                Data: null,
                                Error: 'Document format not supported.'
                            })
                    }
                }
                else {
                    hasSummary = true;
                    summary = event.DocSummary;
                }

                if(!hasSummary) {

                    let _response = {
                        body: ""
                    }

                    await db.run("UPDATE LegislationEvent SET DocSummary = ? WHERE LegEventId = ?;", [_response.body, event.LegEventId]);

                    resolve({
                        Data: {
                            Body: _response.body
                        },
                        Error: null
                    })
                }
                else {
                    resolve({
                        Data: {
                            Body: summary
                        },
                        Error: null
                    });
                }
            } catch (error) {
                console.error('Error summarizing legislation doc:', error);
                resolve({
                    Data: null,
                    Error: `Error summarizing legislation doc: ${error}`
                })
            } finally {
                db?.close();
            }
        })
    }

    // TODO: Fix AI locally.
    public static summarizeRecentLegislationDoc(legislationId: number): Promise<ApiResult<LegislationSummary|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                
                const id = legislationId;

                const doc = await db.get('SELECT LegislationId, Document, DocType, DocText, DocSummary, LENGTH(Document) HasDocument FROM RecentlyFiledLegislation WHERE LegislationId = ?', id);

                let legislationBody = "";
                let backupLegislationBody = "";
                let hasSummary = false;
                let summary = "";


                const extract_and_save_doc = async (docId: number, document: Buffer) => {
                    const extractor = new WordExtractor();
                    const extracted = await extractor.extract(document);
                    const text = extracted.getBody();
                    await db?.run("UPDATE RecentlyFiledLegislation SET DocText = ? WHERE LegislationId = ?;", [text, docId]);
                    return text;
                }

                // if the legislation doesn't have a summary.
                if(!doc.DocSummary || doc.DocSummary == "") {
                    switch(true) {
                        case doc.DocType.includes("doc"): {
                            legislationBody = await extract_and_save_doc(doc.LegislationId, doc.Document);
                            break;
                        }
                        case doc.DocType == "pdf": {
                            if(!doc.DocText) {

                                let ocrd_text = "";

                                await db.run("UPDATE RecentlyFiledLegislation SET DocText = ? WHERE LegislationId = ?;", [ocrd_text, doc.LegislationId]);
                            }
                            else {
                                legislationBody = doc.DocText;
                            }

                            break;
                        }
                        default:
                            console.error('Error summarizing legislation doc: Document format not supported.');
                            resolve({
                                Data: null,
                                Error: 'Document format not supported.'
                            });
                    }
                }
                else {
                    hasSummary = true;
                    summary = doc.DocSummary;
                }

                if(!hasSummary) {

                    let _response = {
                        body: ""
                    }

                    await db.run("UPDATE RecentlyFiledLegislation SET DocSummary = ? WHERE LegislationId = ?;", [_response.body, doc.LegislationId]);
                    
                    resolve({
                        Data: {
                            Body: _response.body
                        },
                        Error: null
                    })
                }
                else {
                    resolve({
                        Data: {
                            Body: summary
                        },
                        Error: null
                    });
                }
            } catch (error) {
                console.error('Error summarizing legislation doc:', error);
                resolve({
                    Data: null,
                    Error: `Error summarizing legislation doc: ${error}`
                });
            } finally {
                db.close();
            }
        })
    }

    public static getConfig(): Promise<ApiResult<Configuration|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {

                let config = await db.get("SELECT * FROM Configuration WHERE ConfigId = ?;", [1]);

                if(!config) {
                    console.error('Config not found.');
                    // return res.status(404).json({ error: 'Config not found.' });
                    resolve({
                        Data: {
                            ConfigId: -1,
                            Config: {
                                Committees: [],
                                News: []
                            }
                        },
                        Error: null
                    });
                }

                config.Config = JSON.parse(config.Config);
                resolve({
                    Data: config,
                    Error: null
                });

            } catch (error) {
                console.error('Error getting config:', error);
                resolve({
                    Data: null,
                    Error: `Error getting config: ${error}`
                })
            } finally {
                db.close();
            }
        })
    }

    public static updateCommitteeConfig(committees: CommitteeConfig[]): Promise<ApiResult<Configuration|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                const newCommittees = committees;

                // get config by userId in AWS
                let config = await db.get("SELECT * FROM Configuration WHERE ConfigId = ?;", [1]);

                if(!config) {
                    // insert config
                    let _config: any = {
                        Committees: newCommittees,
                        News: []
                    }
                    
                    const result: any = await db.run("INSERT INTO Configuration (Config) VALUES (?);", [JSON.stringify(_config)]);
                    
                    if(!result) {
                        resolve({
                            Data: null,
                            Error: "Internal server error."
                        });
                    }
                    let config = await db.get("SELECT * FROM Configuration WHERE ConfigId = ?;", [result.lastId]);
                    config.Config = JSON.parse(config.Config);
                    resolve({
                        Data: config,
                        Error: null
                    });
                }
                else {
                    // update config
                    config.Config = JSON.parse(config.Config);
                    config.Config.Committees = newCommittees;
                    await db.run("UPDATE Configuration SET Config = ? WHERE ConfigId = ?;", [JSON.stringify(config.Config), config.ConfigId]);
                    resolve({
                        Data: config,
                        Error: null
                    });
                }

            } catch (error) {
                console.error('Error updating committees:', error);
                resolve({
                    Data: null,
                    Error: `Error updating committees: ${error}`
                })
            } finally {
                db.close();
            }
        })
    }

    public static updateNewsConfig(news: NewsConfig[]): Promise<ApiResult<Configuration|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                
                const newNewsConfig = news;
                // get config by userId in AWS
                let config = await db.get("SELECT * FROM Configuration WHERE ConfigId = ?;", [1]);
                
                if(!config) {
                    // insert config
                    let _config: any = {
                        Committees: [],
                        News: newNewsConfig
                    }

                    const result: any = await db.run("INSERT INTO Configuration (Config) VALUES (?);", [JSON.stringify(_config)]);
                    if(!result) {
                        resolve({
                            Data: null,
                            Error: "Internal server error."
                        });
                    }
                    let config = await db.get("SELECT * FROM Configuration WHERE ConfigId = ?;", [result.lastId]);
                    config.Config = JSON.parse(config.Config);
                    resolve({
                        Data: config,
                        Error: null
                    });
                }
                else {
                    // update config
                    config.Config = JSON.parse(config.Config);
                    config.Config.News = newNewsConfig;
                    await db.run("UPDATE Configuration SET Config = ? WHERE ConfigId = ?;", [JSON.stringify(config.Config), config.ConfigId]);
                    resolve({
                        Data: config,
                        Error: null
                    });
                }
            } catch (error) {
                console.error('Error updating news config:', error);
                resolve({
                    Data: null,
                    Error: `Error updating news config: ${error}`
                })
            } finally {
                db?.close();
            }
        })
    }

    public static updateSubscribedProjects(legislationId: number): Promise<ApiResult<boolean|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {

                let subscribedProject = await db.get("SELECT * FROM SubscribedProject WHERE LegislationIdFk = ?;", [legislationId]);
                if(subscribedProject) {
                    await db.run("DELETE FROM SubscribedProject WHERE LegislationIdFk = ?;", [legislationId]);
                }
                else {
                    await db.run("INSERT INTO SubscribedProject (LegislationIdFk) VALUES (?);", [legislationId]);
                }

                resolve({
                    Data: true,
                    Error: null
                });

            } catch (error) {
                console.error('Error subscribing projects:', error);
                resolve({
                    Data: null,
                    Error: `Error subscribing projects: ${error}`
                });
            } finally {
                db.close();
            }
        })
    }

    public static getNotifications(): Promise<ApiResult<Notification[]|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {

                const notifications = await db.all("SELECT * FROM Notification ORDER BY NotificationDate DESC LIMIT 20;");

                for(let i=0; i < notifications.length; i++) {
                    notifications[i].MatchedLegislation = (JSON.parse(notifications[i].MatchedLegislation || "[]")).flat();
                    notifications[i].MatchedNews = (JSON.parse(notifications[i].MatchedNews || "[]")).flat();
                    notifications[i].MatchedProjectsForEvents = JSON.parse(notifications[i].MatchedProjectsForEvents || "[]");
                }

                resolve({
                    Data: notifications,
                    Error: null
                });

            } catch (error) {
                console.error('Error fetching notifications:', error);
                resolve({
                    Data: null,
                    Error: `Error fetching notifications: ${error}`
                })
            } finally {
                db.close();
            }
        });
    }

    public static markNotificationAsRead(notifId: number): Promise<ApiResult<boolean|null>> {
        return new Promise(async (resolve,) => {
            const db = new ImparcialDb();
            try {

                if (!notifId) {
                    resolve({
                        Data: null,
                        Error: 'Notif ID is required'
                    })
                }

                await db.run("UPDATE Notification SET Read = 1 WHERE NotifId = ?;", [notifId]);

                resolve({
                    Data: true,
                    Error: null
                });

            } catch (error) {
                console.error('Error marking notifications as read:', error);
                resolve({
                    Data: null,
                    Error: `Error marking notifications as read: ${error}`
                });
            } finally {
                db.close();
            }
        });
    }

    public static getPendingScrapingJob(jobType: "NEWS_SCRAPER" | "LAW_SCRAPER" | "RECENT_LAW_SCRAPER" | "EVENT_SCRAPER"): Promise<ApiResult<boolean|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                const q = "SELECT * from ScrapingJob WHERE JobType=? AND Processed = 0 AND Status = 'NOT_PROCESSED' AND JobEndDate is null ORDER BY JobStartDate DESC LIMIT 1;";

                const scrapingJob = await db.get(q, jobType);

                let hasPendingScrapingJob = false;

                if(scrapingJob) {
                    hasPendingScrapingJob = true;
                }

                resolve({
                    Data: hasPendingScrapingJob,
                    Error: null
                });

            } catch (error) {
                console.error('Error fetching pending scraping job:', error);
                resolve({
                    Data: null,
                    Error: `Error fetching pending scraping job: ${error}`
                });
            } finally {
                db.close();
            }
        });
    }

    public static getEventFile(uri: string): Promise<ApiResult<Buffer|null>> {
        return new Promise(async (resolve) => {
            try {
                
                const downloadHelper = (uri: string): Promise<any> => {
                    return new Promise(async (resolve, reject) => {
                        const win = BrowserWindow.getFocusedWindow();
                        if(win) {
                            console.log("win is good");
                            win.webContents.downloadURL(uri);
                            session.defaultSession.once('will-download', async (e, item, webContents) => {
                                e.preventDefault();
                                console.log('will-download called');
                                let chunks: any = [];
                            
                                // setting up certificates for download
                                const httpsOptions = {ca: fs.readFileSync(process.env.PA_GO_DADDY_CA_PEM_PATH),cert: fs.readFileSync(process.env.PA_SUTRA_PEM_PATH)};
                                https.get(item.getURL(), httpsOptions, (response) => {
                                    
                                    response.on('data', (chunk) => {
                                        console.log(`got chunk`);
                                        chunks.push(chunk);
                                    });
                
                                    response.on('end', () => {
                                        const totalBytes = Buffer.concat(chunks); // Combine all chunks into a single Buffer
                                        // Now 'totalBytes' is a Buffer containing the complete file data
                                        console.log(`Downloaded ${totalBytes.length} bytes in memory.`);
                                        // const buffer = Buffer.from(chunks);
                                        resolve(totalBytes);
                                    // You can then use this buffer as needed, e.g., save it to a specific path
                                    // fs.writeFileSync('/path/to/save/file.ext', totalBytes);
                                    });
                                }).on('error', (error) => {
                                    console.error('Download error:', error);
                                    reject(error);
                                });
            
                            });
                        }
                        else {
                            reject("Focused Browser window not found.");
                        }
                    });
                }

                const data = await downloadHelper(uri);
                resolve({
                    Data: data,
                    Error: null
                });

            } catch (error) {
                console.log(`Error getting filed project: ${error}`);
                resolve({
                    Data: null,
                    Error: `Error getting filed project: ${error}`
                });
            }
        });
    }

    public static getFiledProject(administrationId: number, legislationId: number, uri: string): Promise<ApiResult<LegislationEvent[]|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                let results: LegislationEvent[] = [];
                const insertEventsQuery = "INSERT OR IGNORE INTO LegislationEvent(Title, Description, Uri, Document, DocType, ScrapedDate, Hash, LegislationIdFk, CreatedDate) VALUES (?,?,?,?,?,?,?,?,?);";
                const scrapedDate = moment().tz("America/Puerto_Rico").format();
                // find
                const url = uri;
                const browser = await chromium.launch();  // Or 'firefox' or 'webkit'.
                const page = await browser.newPage();
                await page.goto(url, {timeout: 24000, waitUntil: 'load'});
                const html = await page.content();
                
                const $ = cheerio.load(html);
                // divide-y divide-gray-100
            
                const listItems = $('ul.divide-y.divide-gray-100').find('li');
                let body = "";
                let workingBody = "";
                let eventTitle = "";
                // let paragraphs = [];
                let hash = "";
                let events = [];
                for(let i=0; i < listItems.length; i++) {
                    eventTitle = $(listItems[i]).find('h2').text().trim();
                    if(eventTitle = "Radicado") {
                        const paragraphs = $(listItems[i]).find('p');
                        for(let ii=0; ii < paragraphs.length; ii++) {
                            workingBody = $(paragraphs[ii]).text().trim();
                            if(!workingBody.includes("doc") && !workingBody.includes("docx") && !workingBody.includes("pdf")) {
                            body += workingBody;
                            body += "\n";
                            }
                        }
                
                        const msgBuffer = new TextEncoder().encode(administrationId.toString() + eventTitle + body + legislationId.toString());
                        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                        // Title, Description, Uri, Document, DocType, ScrapedDate, Hash, LegislationIdFk, CreatedDate
                        const event: any = {
                            LegEventId: -1,
                            Title: eventTitle,
                            Description: body,
                            Uri: '',
                            Document: undefined,
                            DocType: '',
                            ScrapedDate: scrapedDate,
                            Hash: hash,
                            LegislationIdFk: -1,
                            CreatedDate: ''
                        };

                        const downloadHelper = (uri: string): Promise<any> => {
                            return new Promise(async (resolve, reject) => {
                                const win = BrowserWindow.getFocusedWindow();
                                if(win) {
                                    console.log("win is good");
                                    win.webContents.downloadURL(uri);
                                    session.defaultSession.once('will-download', async (e, item, webContents) => {
                                        e.preventDefault();
                                        console.log('will-download called');
                                        let chunks: any = [];
                                    
                                        // setting up certificates for download
                                        const httpsOptions = {ca: fs.readFileSync(process.env.PA_GO_DADDY_CA_PEM_PATH),cert: fs.readFileSync(process.env.PA_SUTRA_PEM_PATH)};
                                        https.get(item.getURL(), httpsOptions, (response) => {
                                            
                                            response.on('data', (chunk) => {
                                                console.log(`got chunk`);
                                                chunks.push(chunk);
                                            });
                        
                                            response.on('end', () => {
                                                const totalBytes = Buffer.concat(chunks); // Combine all chunks into a single Buffer
                                                // Now 'totalBytes' is a Buffer containing the complete file data
                                                console.log(`Downloaded ${totalBytes.length} bytes in memory.`);
                                                // const buffer = Buffer.from(chunks);
                                                resolve(totalBytes);
                                            // You can then use this buffer as needed, e.g., save it to a specific path
                                            // fs.writeFileSync('/path/to/save/file.ext', totalBytes);
                                            });
                                        }).on('error', (error) => {
                                            console.error('Download error:', error);
                                            reject(error);
                                        });
                    
                                    });
                                }
                                else {
                                    reject("Focused Browser window not found.");
                                }
                            });
                        }

                
                        if($(listItems[i]).find('a').length > 0) {
                            const uri = "https://sutra.oslpr.org" + $(listItems[i]).find('a').attr('href');
                            const docType = $(listItems[i]).find('a').attr('href').split('.').at(-1);
                            // download doc
                            try {
                                console.log("Starting download for Radicado...");
                                const buffer = await downloadHelper(uri);
                                event.Document = buffer;
                                event.Uri = uri;
                                event.DocType = docType;
                            } catch (error) {
                                console.log(`Error downloading project: ${error}`);
                            }
                        }

                        events.push(event);
                        break;
                    }
                }

                // insert events into database
                for(let ii=0; ii < events.length; ii++) {
                    // save to db
                    console.log(`Document Length: ${events[ii].Document.length}`);
                    events[ii].CreatedDate = moment().tz("America/Puerto_Rico").format();
                    await db.run(insertEventsQuery, [events[ii].Title, events[ii].Description, events[ii].Uri, events[ii].Document, events[ii].DocType, events[ii].ScrapedDate, events[ii].Hash, legislationId, events[ii].CreatedDate]);
                    // add to result list
                    events[ii].LegEventId = db.getLastId();

                    results.push({
                        LegEventId: events[ii].LegEventId,
                        Title: events[ii].Title,
                        Description: events[ii].Description,
                        Uri: events[ii].Uri,
                        DocType: events[ii].DocType,
                        DocSummary: '',
                        LegislationIdFk: events[ii].LegisaltionIdFk,
                        HasDocument: events[ii].Document.length > 0? true : false
                    });
                }

                resolve({
                    Data: results,
                    Error: null
                });

            } catch (error) {
                console.log(`Error getting filed project: ${error}`);
                resolve({
                    Data: null,
                    Error: `Error getting filed project: ${error}`
                });
            }
        })
    }

    public static getFiledProjectForRecentLegislation(administrationId: number, legislationId: number, uri: string): Promise<ApiResult<LegislationEvent[]|null>> {
        return new Promise(async (resolve) => {
            const db = new ImparcialDb();
            try {
                let results: LegislationEvent[] = [];
                const insertEventsQuery = "UPDATE RecentlyFiledLegislation SET Document = ?, DocDesc = ?, DocUri = ?, DocType = ?, EventDescription = ? WHERE LegislationId = ?;";
                const scrapedDate = moment().tz("America/Puerto_Rico").format();
                // find
                const url = uri;
                const browser = await chromium.launch();  // Or 'firefox' or 'webkit'.
                const page = await browser.newPage();
                await page.goto(url, {timeout: 24000, waitUntil: 'load'});
                const html = await page.content();
                
                const $ = cheerio.load(html);
                // divide-y divide-gray-100
            
                const listItems = $('ul.divide-y.divide-gray-100').find('li');
                let body = "";
                let workingBody = "";
                let eventTitle = "";
                // let paragraphs = [];
                let hash = "";
                let events = [];
                for(let i=0; i < listItems.length; i++) {
                    eventTitle = $(listItems[i]).find('h2').text().trim();
                    if(eventTitle = "Radicado") {
                        const paragraphs = $(listItems[i]).find('p');
                        for(let ii=0; ii < paragraphs.length; ii++) {
                            workingBody = $(paragraphs[ii]).text().trim();
                            if(!workingBody.includes("doc") && !workingBody.includes("docx") && !workingBody.includes("pdf")) {
                                body += workingBody;
                                body += "\n";
                            }
                        }
                
                        const msgBuffer = new TextEncoder().encode(administrationId.toString() + eventTitle + body + legislationId.toString());
                        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                        const event: any = {
                            LegEventId: -1,
                            Document: undefined,
                            DocDesc: eventTitle,
                            DocUri: '',
                            DocType: '',
                            ScrapedDate: scrapedDate,
                            Hash: hash,
                            EventDescription: body
                        };

                        const downloadHelper = (uri: string): Promise<any> => {
                            return new Promise(async (resolve, reject) => {
                                const win = BrowserWindow.getFocusedWindow();
                                if(win) {
                                    console.log("win is good");
                                    win.webContents.downloadURL(uri);
                                    session.defaultSession.once('will-download', async (e, item, webContents) => {
                                        e.preventDefault();
                                        console.log('will-download called');
                                        let chunks: any = [];
                                    
                                        // setting up certificates for download
                                        const httpsOptions = {ca: fs.readFileSync(process.env.PA_GO_DADDY_CA_PEM_PATH),cert: fs.readFileSync(process.env.PA_SUTRA_PEM_PATH)};
                                        https.get(item.getURL(), httpsOptions, (response) => {
                                            
                                            response.on('data', (chunk) => {
                                                console.log(`got chunk`);
                                                chunks.push(chunk);
                                            });
                        
                                            response.on('end', () => {
                                                const totalBytes = Buffer.concat(chunks); // Combine all chunks into a single Buffer
                                                // Now 'totalBytes' is a Buffer containing the complete file data
                                                console.log(`Downloaded ${totalBytes.length} bytes in memory.`);
                                                // const buffer = Buffer.from(chunks);
                                                resolve(totalBytes);
                                            // You can then use this buffer as needed, e.g., save it to a specific path
                                            // fs.writeFileSync('/path/to/save/file.ext', totalBytes);
                                            });
                                        }).on('error', (error) => {
                                            console.error('Download error:', error);
                                            reject(error);
                                        });
                    
                                    });
                                }
                                else {
                                    reject("Focused Browser window not found.");
                                }
                            });
                        }

                
                        if($(listItems[i]).find('a').length > 0) {
                            const uri = "https://sutra.oslpr.org" + $(listItems[i]).find('a').attr('href');
                            const docType = $(listItems[i]).find('a').attr('href').split('.').at(-1);
                            // download doc
                            try {
                                console.log("Starting download for Radicado...");
                                const buffer = await downloadHelper(uri);
                                event.Document = buffer;
                                event.DocUri = uri;
                                event.DocType = docType;
                            } catch (error) {
                                console.log(`Error downloading project: ${error}`);
                            }
                        }

                        events.push(event);
                        break;
                    }
                }

                // insert events into database
                for(let ii=0; ii < events.length; ii++) {
                    // save to db
                    console.log(`Document Length: ${events[ii].Document.length}`);
                    // UPDATE RecentlyFiledLegsilation SET Document = ?, DocDesc = ?, DocUri = ?, DocType = ?, EventDescription = ? WHERE LegislationId = ?;
                    await db.run(insertEventsQuery, [events[ii].Document, events[ii].DocDesc, events[ii].DocUri, events[ii].DocType, events[ii].EventDescription, legislationId]);
                    // add to result list
                    events[ii].LegEventId = db.getLastId();

                    results.push({
                        LegEventId: -1,
                        Title: events[ii].DocDesc,
                        Description: events[ii].EventDescription,
                        Uri: events[ii].DocUri,
                        DocType: events[ii].DocType,
                        DocSummary: undefined,
                        LegislationIdFk: legislationId,
                        HasDocument: events[ii].Document.length > 0? true : false
                    });
                }

                resolve({
                    Data: results,
                    Error: null
                });

            } catch (error) {
                console.log(`Error getting filed project: ${error}`);
                resolve({
                    Data: null,
                    Error: `Error getting filed project: ${error}`
                });
            }
        })
    }
}