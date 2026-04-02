import * as cheerio from 'cheerio';
import { LawScraperData } from '../../models';

onmessage = async (event: MessageEvent) => {
    const scraperData = event.data as LawScraperData;
    const laws = await scrape_recent_laws(scraperData);
    postMessage(laws);
}

async function scrape_recent_laws(scrapedData: LawScraperData) {
	let laws: any[] = [];
	let pageCounter = 1;

    for(let i=0; i < scrapedData.Pages.length; i++) {

	    const $ = cheerio.load(scrapedData.Pages[i].Page);

		const hasListItems = $('ul > a').length > 0;
		if(!hasListItems) {
			console.log(`No data. Skipping page: ${pageCounter}`);
			break;
		}
		else {
			console.log(`Starting scraping on page: ${pageCounter}.`);
			const listItems = $('ul > a');
			for(let ii=0; ii < listItems.length; ii++) {
				const number = $(listItems[ii]).find('h1').text().split(":")[1].trim();
				// console.log({number});
				const paragraphs = $(listItems[ii]).find('p');
				const filedDate = $(paragraphs[0]).text().split("Radicada")[1].trim();
				let author = "";
				let coAuthors = "";
				let title = "";
				// console.log({filedDate});
				for(let iii=0; iii < paragraphs.length; iii++) {
					// console.log();
					// console.log();
					const itemParts = $(paragraphs[iii]).text().split(":");
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
				const events = $(listItems[ii]).find('div.hidden > ol > li > span');
				for(let iv=events.length - 1; iv >= 0; iv--) {
					if($(events[iv]).attr('class').includes('bg-sutra-secondary')) {
						lastEvent = $(events[iv]).text().trim();
						break;
					}
				}

				const uri = "https://sutra.oslpr.org" + $(listItems[ii]).attr('href');

				// const hash = crypto.createHash('sha256').update(administrationId.toString() + number).digest('hex');
                const msgBuffer = new TextEncoder().encode(scrapedData.Pages[i].AdministrationId.toString() + number);
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

				// number, filed_date, title, author, co_authors, uri, committiee, administration_id, last_event, get_utc_time(), hash.hexdigest()
				laws.push({
					Number: number,
					FiledDate: filedDate,
					Title: title,
					Author: author,
					CoAuthor: coAuthors,
					Uri: uri,
                    AdministrationId: scrapedData.Pages[i].AdministrationId,
                    LastEvent: lastEvent,
					ScrapedDate: scrapedData.ScrapingDate,
					Hash: hash,
                    Document: Buffer.from([]),
                    DocDesc: '',
                    DocUri: '',
                    DocType: '',
                    DocText: undefined,
                    DocSummary: undefined,
                    EventDescription: undefined
				});
			}
		}

		pageCounter++;
    }

    return laws;
}