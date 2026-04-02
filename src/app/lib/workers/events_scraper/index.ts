import * as cheerio from 'cheerio';
import { EventScraperData } from '../../models';
import moment from 'moment-timezone';

onmessage = async (event: MessageEvent) => {
    const scraperData = event.data as EventScraperData;
    const events = await scrape_events(scraperData);
    postMessage(events);
}

interface Document {
    Uri: string,
    DocType: string
}

interface Event {
    Title: string,
    Description: string,
    ScrapedDate: string,
    Hash: string,
    LegislationIdFk: number,
    CreatedDate: string,
    Document?: Document
}

async function scrape_events(scrapedData: EventScraperData) {
    let events: any[] = [];

    let body = "";
	let workingBody = "";
	let eventTitle = "";
	let paragraphs: any = [];
	let hash = "";

    for(let i=0; i < scrapedData.Pages.length; i++) {
        // parse page
        const $ = cheerio.load(scrapedData.Pages[i].Page);
		
		const listItems = $('ul.divide-y.divide-gray-100').find('li');

		for(let ii=0; ii < listItems.length; ii++) {
			eventTitle = $(listItems[ii]).find('h2').text().trim();
			paragraphs = $(listItems[ii]).find('p');
			for(let iii=0; iii < paragraphs.length; iii++) {
				workingBody = $(paragraphs[iii]).text().trim();
				if(!workingBody.includes("doc") && !workingBody.includes("docx") && !workingBody.includes("pdf")) {
					body += workingBody;
					body += "\n";
				}
			}

			// hash = crypto.createHash('sha256').update(administrationId.toString() + eventTitle + body + legislationId.toString()).digest('hex');
            const msgBuffer = new TextEncoder().encode(scrapedData.Pages[i].AdministrationId.toString() + eventTitle + body + scrapedData.Pages[i].LegislationId.toString());
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

			const event: Event = {
				Title: eventTitle,
				Description: body,
				ScrapedDate: scrapedData.ScrapingDate,
				Hash: hash,
				LegislationIdFk: scrapedData.Pages[i].LegislationId,
				CreatedDate: moment().tz("America/Puerto_Rico").format(),
			}

			if($(listItems[ii]).find('a').length > 0) {
				const uri = "https://sutra.oslpr.org" + $(listItems[ii]).find('a').attr('href');
				const docType = $(listItems[ii]).find('a').attr('href').split('.').at(-1);
				event.Document = {
                    Uri: uri,
                    DocType: docType
                };
			}

			events.push(event);

            body = "";
            workingBody = "";
            eventTitle = "";
            paragraphs = [];
            hash = "";
		}
        
    }

    return events;
}

