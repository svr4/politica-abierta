import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {Legislation, LegislationSourceType, Pagination, RecentLegislation, SubscribedLegislation, UpdateLegDocSummary, UpdateRecentLegDocSummary,
    UpdateSubscribedLegislationTags, UpdateIsSubscribedToProject, UpdateLegislationEvents} from "../models";

interface LegislationState {
    Legislation: Legislation[],
    RecentLegislation: RecentLegislation[],
    SubscribedLegislation: SubscribedLegislation[],
    Page: number,
    Limit: number,
    Total: number,
    Pages: number,
    IsFetching: boolean,
    IsFiltering: boolean,
    IsSummarizing: boolean,
    LegislationSourceType: LegislationSourceType
}

const initialState: LegislationState = {
    Legislation: [],
    RecentLegislation: [],
    SubscribedLegislation: [],
    Page: 0,
    Limit: 0,
    Total: 0,
    Pages: 0,
    IsFetching: false,
    IsFiltering: false,
    IsSummarizing: false,
    LegislationSourceType: LegislationSourceType.RecentLegislation
}

export const legislationSlice = createSlice({
    name: "legislation",
    initialState,
    reducers: {
        appendLegislation: (state, action: PayloadAction<Legislation[]>) => {
            state.Legislation = state.Legislation.concat(action.payload);
        },
        appendRecentLegislation: (state, action: PayloadAction<RecentLegislation[]>) => {
            state.RecentLegislation = state.RecentLegislation.concat(action.payload);
        },
        appendSubscribedLegislation: (state, action: PayloadAction<SubscribedLegislation[]>) => {
            state.SubscribedLegislation = state.SubscribedLegislation.concat(action.payload);
        },
        updateLegislation: (state, action: PayloadAction<Legislation[]>) => {
            state.Legislation = action.payload;
        },
        updateRecentLegislation: (state, action: PayloadAction<RecentLegislation[]>) => {
            state.RecentLegislation = action.payload;
        },
        updatePagination: (state, action: PayloadAction<Pagination>) => {
            state.Page = action.payload.Page;
            state.Pages = action.payload.Pages;
            state.Limit = action.payload.Limit;
            state.Total = action.payload.Total;
        },
        updateIsFiltering: (state, action: PayloadAction<boolean>) => {
            state.IsFiltering = action.payload;
        },
        updateLegDocSummary: (state, action: PayloadAction<UpdateLegDocSummary>) => {
            state.Legislation[action.payload.Id].Events[action.payload.docIndex].DocSummary = action.payload.Summary;
        },
        updateRecentLegDocSummary: (state, action: PayloadAction<UpdateRecentLegDocSummary>) => {
            state.RecentLegislation[action.payload.Id].DocSummary = action.payload.Summary;
        },
        updateIsFetching: (state, action: PayloadAction<boolean>) => {
            state.IsFetching = action.payload;
        },
        updateLegislationSource: (state, action: PayloadAction<LegislationSourceType>) => {
            state.LegislationSourceType = action.payload;
        },
        updateSubscribedLegislation: (state, action: PayloadAction<SubscribedLegislation[]>) => {
            state.SubscribedLegislation = action.payload;
        },
        // removeSubscribedLegislation: (state, action: PayloadAction<number>) => {
        //     let legs = [...state.SubscribedLegislation];
        //     legs.splice(action.payload, 1);
        //     state.SubscribedLegislation = legs;
        // },
        updateSubscribedLegDocSummary: (state, action: PayloadAction<UpdateLegDocSummary>) => {
            state.SubscribedLegislation[action.payload.Id].Events[action.payload.docIndex].DocSummary = action.payload.Summary;
        },
        updateSubscribedLegislationTags: (state, action: PayloadAction<UpdateSubscribedLegislationTags>) => {
            let leg = state.SubscribedLegislation.find((e) => e.LegislationId == action.payload.LegislationId);
            if(leg) {
                leg.Tags = [...action.payload.Tags];
            }
        },
        updateIsSubscribedToProject: (state, action: PayloadAction<UpdateIsSubscribedToProject>) => {
            let leg = state.Legislation.find((e) => e.LegislationId == action.payload.LegislationId);
            if(leg) {
                leg.IsSubscribed = action.payload.IsSubscribed;
            }
        },
        updateIsSubscribedToProject2: (state, action: PayloadAction<UpdateIsSubscribedToProject>) => {
            let leg = state.SubscribedLegislation.find((e) => e.LegislationId == action.payload.LegislationId);
            if(leg) {
                leg.IsSubscribed = action.payload.IsSubscribed;
            }
        },
        updageLegislationEvents: (state, action: PayloadAction<UpdateLegislationEvents>) => {
            let leg = state.Legislation.find((e) => e.LegislationId == action.payload.LegislationId);
            if(leg) {
                leg.Events = [...action.payload.Events];
            }
        }
    }
});

export const {updateLegislation, updatePagination, updateIsFiltering,
    updateLegDocSummary, updateIsFetching, appendLegislation, updateRecentLegislation,
    appendRecentLegislation, updateLegislationSource, updateRecentLegDocSummary, updateSubscribedLegislationTags,
    updateSubscribedLegislation, updateSubscribedLegDocSummary, updateIsSubscribedToProject, updateIsSubscribedToProject2,
    appendSubscribedLegislation, updageLegislationEvents
    // removeSubscribedLegislation
    } = legislationSlice.actions;

export default legislationSlice.reducer;