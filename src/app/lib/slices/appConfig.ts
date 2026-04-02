import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UpdateCommitteeConfig, Configuration, SourceType, RemoveCommitteeConfig, CommitteeConfig, NewsConfig, LegislationFilter } from "../models";
import { RootState } from "../store";

interface AppConfig {
    config: Configuration,
    legislationFilters: LegislationFilter
}

const initialState: AppConfig = {
    config: {
        ConfigId: 1,
        Config: {
            Committees: [],
            News: []
        }
    },
    legislationFilters: {
        searchText: "",
        committee: -1 // this committee comes from the configuration above and are used by the UI to filter
    }
}

export const appConfig = createSlice({
    name: "appConfig",
    initialState,
    reducers: {
        updateLegislationConfig: (state, action: PayloadAction<CommitteeConfig[]>) => {
            state.config.Config.Committees = Object.assign([], [action.payload]);
        },
        updateConfig: (state, action: PayloadAction<Configuration>) => {
            state.config = action.payload;
        },
        updateNewConfig: (state, action: PayloadAction<NewsConfig[]>) => {
            state.config.Config.News = Object.assign([], [action.payload]);
        },
        updateLegislationFilter: (state, action: PayloadAction<LegislationFilter>) => {
            state.legislationFilters = action.payload;
        }
    }
});

export const selectCommittees = (state: RootState) => state.appConfig.config.Config.Committees;
export const selectNews = (state: RootState) => state.appConfig.config.Config.News;
export const selectConfig = (state: RootState) => state.appConfig.config;

export const { updateLegislationConfig, updateConfig, updateLegislationFilter } = appConfig.actions

export default appConfig.reducer;
