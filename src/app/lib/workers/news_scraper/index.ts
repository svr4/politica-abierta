import moment from 'moment-timezone';
import * as cheerio from 'cheerio';
import { NewsScraperData } from '../../models';


onmessage = async (event: MessageEvent) => {
    console.log("Starting news scraper");
    const newsScraperData = event.data as NewsScraperData;
    const scrapedDate = newsScraperData.ScrapingDate;
    
    let stories: any = [];
    const endiStories = await scrape_endi(scrapedDate, newsScraperData.EndiPages);
    const voceroStories = await scrape_vocero(scrapedDate, newsScraperData.VoceroPages);
    const noticelStories = await scrape_noticel(scrapedDate, newsScraperData.NoticelPages);
    stories = stories.concat(endiStories).concat(voceroStories).concat(noticelStories);
    postMessage(stories);
}

async function scrape_endi(scrapedDate: string, pages: string[]) {
    let stories: any[] = [];
    
    for(let i=0; i < pages.length; i++) {
        const $ = cheerio.load(pages[i]);
        $("article").each((i, element) => {
            // console.log($(element).text());
            const hasNoStoryData = $(element).attr('data-category');
            if(!hasNoStoryData) {
                const title = $(element).find("h2").text().trim();
                const subtitle = $(element).find('span.standard-teaser-subheadline').text().trim();
                const startIndex = title.indexOf(subtitle);
                // console.log({subtitle});
                // console.log({startIndex});
                // console.log({title});
                let _title = startIndex == -1 || (startIndex == 0 && subtitle == '')? title : title.substring(0, startIndex);
                // console.log(`Title: ${_title}`)
                // console.log(`Sub-Title: ${subtitle}`);
                const uri = "https://www.elnuevodia.com" + $(element).find('div.standard-teaser-media').find('a').attr('href');
                // console.log(`Uri: https://www.elnuevodia.com${uri}`);
                const media = $(element).find('div.standard-teaser-media').find('img').attr('src');
                // console.log(`Media: ${media}`);
                // console.log();
                // const _title_hash = createHash('sha256').update("ENDI" + _title).digest('hex');
                const msgBuffer = new TextEncoder().encode("ENDI" + _title);
                crypto.subtle.digest('SHA-256', msgBuffer).then((hashBuffer) => {
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const _title_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                    let canSummarize = true;
                    if(uri.includes("fotogalerias")) {
                        _title = "FOTOGALERIAS: " + _title;
                        canSummarize = false;
                    }

                    if(uri.includes("videos")) {
                        _title = "VIDEOS: " + _title;
                        canSummarize = false;
                    }

                    stories.push({
                        title: _title,
                        description: subtitle,
                        uri,
                        storyType: 1,
                        media,
                        scrapedDate,
                        hash: _title_hash,
                        articleText: null,
                        canSummarize
                    });
                })
                .catch((reason) => console.log(reason));
            }
        });
    }
    return stories;
}

async function scrape_vocero(scrapedDate: string, pages: string[]) {
	let stories: any[] = [];
    for(let i=0; i < pages.length; i++) {
		
        const $ = cheerio.load(pages[i]);

		$("[id='tncms-region-index-full']").children('div').find('article').each((i, element) => {
			const title = $(element).find('div.card-headline').text().trim();
			const description = $(element).find('.card-lead').text().trim().replace('\n', '');
			const uri = "https://www.elvocero.com" + $(element).find('.tnt-headline > a').attr('href');
			const media = $(element).find('img').attr("src");
            const msgBuffer = new TextEncoder().encode("VOCERO" + title);
            crypto.subtle.digest('SHA-256', msgBuffer)
            .then((hashBuffer) => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const _title_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                const canSummarize = true;
                stories.push({
                    title,
                    description,
                    uri,
                    storyType: 2,
                    media,
                    scrapedDate,
                    hash: _title_hash,
                    articleText: null,
                    canSummarize
                });
            })
            .catch((reason) => console.log(reason));
			
		});
	}
    return stories;
}

async function scrape_noticel(scrapedDate: string, pages: string[]) {
	let stories: any = [];

    for(let i=0; i < pages.length; i++) {
		const $ = cheerio.load(pages[i]);

		const storyColumn = $('div.col.w-66');
		const mainStory = $('div.mainNews.updatedTemplate');
		const mainStorySplitted = $('div.mainNews.splitted');
		
		const mainTitle = $(mainStory).find('.news--titles').text().trim();
		const mainDescription = "";
		const mainMedia = $(mainStory).find('img').attr('src');
		const mainUri = $(mainStory).find('a').attr('href');
		// const mainTitleHash = crypto.createHash('sha256').update("NOTICEL" + mainTitle).digest('hex');
		const canSummarize = true;

        let msgBuffer = new TextEncoder().encode("NOTICEL" + mainTitle);
        crypto.subtle.digest('SHA-256', msgBuffer).then((hashBuffer) => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const _title_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            stories.push({
                title: mainTitle,
                description: mainDescription,
                uri: mainUri,
                storyType: 3,
                media: mainMedia,
                scrapedDate,
                hash: _title_hash,
                articleText: null,
                canSummarize
            });
        })
        .catch((reason) => console.log(reason));

		const mainTitleSplitted = $(mainStorySplitted).find('.news--titles').text().trim();
		const mainDescriptionSplitted = "";
		const mainMediaSplitted = $(mainStorySplitted).find('img').attr('src');
		const mainUriSplitted = $(mainStorySplitted).find('a').attr('href');

        msgBuffer = new TextEncoder().encode("NOTICEL" + mainTitleSplitted);
        crypto.subtle.digest('SHA-256', msgBuffer).then((hashBuffer) => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const _title_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            stories.push({
                title: mainTitleSplitted,
                description: mainDescriptionSplitted,
                uri: mainUriSplitted,
                storyType: 3,
                media: mainMediaSplitted,
                scrapedDate,
                hash: _title_hash,
                articleText: null,
                canSummarize
            });
        })
        .catch((reason) => console.log(reason));
		
		$(storyColumn).find('div.newsCard').each((i, element) => {
			const title = $(element).find('.news--titles').text().trim();
			const description = "";
			const media = $(element).find('img').attr('src');
			const uri = $(element).find('a').attr('href');

            msgBuffer = new TextEncoder().encode("NOTICEL" + title);
            crypto.subtle.digest('SHA-256', msgBuffer).then((hashBuffer) => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const _title_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                stories.push({
                    title,
                    description,
                    uri,
                    storyType: 3,
                    media,
                    scrapedDate,
                    hash: _title_hash,
                    articleText: null,
                    canSummarize
                });
            })
            .catch((reason) => console.log(reason));
			
		});
	}
    
	return stories;
}

export default {}