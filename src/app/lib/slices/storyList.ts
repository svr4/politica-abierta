import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {Story, StoryPagination, UpdateStorySummary} from "../models";
import { RootState } from "../store";

interface StoryState {
    Stories: Story[],
    Source: number,
    Page: number,
    Limit: number,
    Total: number,
    Pages: number,
    IsFetching: boolean,
    IsFiltering: boolean,
    IsSummarizing: boolean
}

const initialState: StoryState = {
    Stories: [],
    Source: 1,
    Page: 1,
    Limit: 10,
    Total: 0,
    Pages: 0,
    IsFetching: false,
    IsFiltering: false,
    IsSummarizing: false
}

export const storySlice = createSlice({
    name: "story",
    initialState,
    reducers: {
        updateStories: (state, action: PayloadAction<[Story]>) => {
            state.Stories = action.payload;
        },
        appendStories: (state, action: PayloadAction<[Story]>) => {
            state.Stories = state.Stories.concat(action.payload);
        },
        updatePage: (state, action: PayloadAction<number>) => {
            state.Page = action.payload;
        },
        updateLimit: (state, action: PayloadAction<number>) => {
            state.Limit = action.payload;
        },
        updateTotal: (state, action: PayloadAction<number>) => {
            state.Total = action.payload;
        },
        updatePages: (state, action: PayloadAction<number>) => {
            state.Pages = action.payload;
        },
        updateIsFetching: (state, action: PayloadAction<boolean>) => {
            state.IsFetching = action.payload;
        },
        updateSource: (state, action: PayloadAction<number>) => {
            state.Source = action.payload;
        },
        updatePagination: (state, action: PayloadAction<StoryPagination>) => {
            state.Source = action.payload.Source;
            state.Page = action.payload.Page;
            state.Pages = action.payload.Pages;
            state.Limit = action.payload.Limit;
            state.Total = action.payload.Total;
        },
        updateIsFiltering: (state, action: PayloadAction<boolean>) => {
            state.IsFiltering = action.payload;
        },
        updateIsSummarizing: (state, action: PayloadAction<boolean>) => {
            state.IsSummarizing = action.payload;
        },
        updateStorySummary: (state, action: PayloadAction<UpdateStorySummary>) => {
            state.Stories[action.payload.Id].SummaryText = action.payload.Summary;
        }
    }
});

export const {updateStories, appendStories, updatePage, updateLimit, updateTotal, updatePages,
    updateIsFetching, updateSource, updatePagination, updateIsFiltering, updateIsSummarizing, updateStorySummary} = storySlice.actions;

export const selectStories = (state: RootState) => state.story.Stories;


export default storySlice.reducer;

