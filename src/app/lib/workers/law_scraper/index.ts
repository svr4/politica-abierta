import * as cheerio from 'cheerio';
import { LawScraperData } from '../../models';

onmessage = async (event: MessageEvent) => {
    const scraperData = event.data as LawScraperData;
    const laws = await scrape_laws(scraperData);
    postMessage(laws);
}

async function scrape_laws(scrapedData: LawScraperData) {
	let laws: any[] = [];
    
	for(let i=0; i < scrapedData.Pages.length; i++) {
		const $ = cheerio.load(scrapedData.Pages[i].Page);

        // console.log(`Committee: ${scrapedData.Pages[i].Committiee} - ${$('ul > a').length}`);
        const hasList = $('ul') == undefined;
        const hasListItems = $('ul > a').length > 0;
        if(!hasListItems) {
            // console.log(`No data. Skipping committiee: ${scrapedData.Pages[i].Committiee}.`);
            break;
        }
        else {
            // console.log(`Committiee: ${scrapedData.Pages[i].Committiee} has data. Starting scraping.`);
            $('ul > a').each((i, element) => {
                const number = $(element).find('h1').text().split(":")[1].trim();
                // console.log({number});
                const paragraphs = $(element).find('p');
                const filedDate = $(paragraphs[0]).text().split("Radicada")[1].trim();
                let author = "";
                let coAuthors = "";
                let title = "";
                // console.log({filedDate});
                for(let ii=0; ii < paragraphs.length; ii++) {
                    // console.log();
                    // console.log();
                    const itemParts = $(paragraphs[ii]).text().split(":");
                    switch(itemParts[0]) {
                        case "Autor(es)":
                            author = itemParts[1].trim();
                            break;
                        case "Co-Autor(es)":
                            coAuthors = itemParts[1].trim();
                            break;
                        case "Título":
                            title = itemParts[1].trim();
                            break;
                    }
                }

                let lastEvent = "";
                const events = $(element).find('div.hidden > ol > li > span');
                for(let iii=events.length - 1; iii >= 0; iii--) {
                    if($(events[iii]).attr('class').includes('bg-sutra-secondary')) {
                        lastEvent = $(events[iii]).text().trim();
                        break;
                    }
                }

                const uri = "https://sutra.oslpr.org" + $(element).attr('href');

                const msgBuffer = new TextEncoder().encode(scrapedData.Pages[i].AdministrationId.toString() + number);
                crypto.subtle.digest('SHA-256', msgBuffer).then((hashBuffer) => {
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const _title_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    // Legislation(Number, FiledDate, Title, Author, CoAuthor, Uri, Committe, AdministrationId, LastEvent, ScrapedDate, Hash
                    laws.push({
                        LegislationId: -1,
                        Number: number,
                        FiledDate: filedDate,
                        Title: title,
                        Author: author,
                        CoAuthor: coAuthors,
                        Uri: uri,
                        Committe: scrapedData.Pages[i].Committiee,
                        AdministrationId: scrapedData.Pages[i].AdministrationId,
                        LastEvent: lastEvent,
                        ScrapedDate: scrapedData.ScrapingDate,
                        Hash: _title_hash
                    });
                })
                .catch((reason) => console.log(reason));

                // number, filed_date, title, author, co_authors, uri, committiee, administration_id, last_event, get_utc_time(), hash.hexdigest()

                // console.log({author});
                // console.log({coAuthors});
                // console.log({title});
                // console.log({lastEvent});
                // console.log({uri});
                // console.log();

            })
        }
	}

    return laws;
}