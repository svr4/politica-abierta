import { LegislationEvent } from "../../../lib/models";
import { updateLegDocSummary, updateSubscribedLegDocSummary, updateIsSubscribedToProject, updateIsSubscribedToProject2, updageLegislationEvents } from "../../../lib/slices/legislationList";

export function updateLegislationSummary(legislationIndex: number, docIndex: number, summary: string) {
    return updateLegDocSummary({Id: legislationIndex, docIndex, Summary: summary});
}

export function updateSubscribedLegislationSummary(legislationIndex: number, docIndex: number, summary: string) {
    return updateSubscribedLegDocSummary({Id: legislationIndex, docIndex, Summary: summary});
}

export function updateLegislationSubscription(legislationId: number, IsSubscribed: boolean) {
    return updateIsSubscribedToProject({LegislationId: legislationId, IsSubscribed});
}

export function updateSubscribedLegislationSubscription(legislationId: number, IsSubscribed: boolean) {
    return updateIsSubscribedToProject2({LegislationId: legislationId, IsSubscribed});
}

export function updateLegislationEvents(legislationId: number, events: LegislationEvent[]) {
    return updageLegislationEvents({LegislationId: legislationId, Events: events});
}

export function updateRecentLegislationEvents(legislationId: number, events: LegislationEvent[]) {
    //return updageLegislationEvents({LegislationId: legislationId, Events: events});
}
