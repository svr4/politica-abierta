import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { ScrapingJobState, SourceType } from "../models";
import { RootState } from "../store";
import Storage from "../storage";
import { Notification } from '../models';

interface ImparcialApp {
    currentComponent: SourceType,
    selectedNotification?: Notification,
    setNotificationsVisible: boolean
}

const token = Storage.getSessionToken();

const initialState: ImparcialApp = {
    currentComponent: SourceType.ENDI,
    selectedNotification: undefined,
    setNotificationsVisible: false
}

export const imparcialSlice = createSlice({
    name: "imparcial",
    initialState,
    reducers: {
        updateCurrentComponent: (state, action: PayloadAction<SourceType>) => {
            state.currentComponent = action.payload;
        },
        updateSelectedNotification: (state, action: PayloadAction<Notification>) => {
            state.selectedNotification = action.payload;
        },
        updateSetNotificationsVisible: (state, action: PayloadAction<boolean>) => {
            state.setNotificationsVisible = action.payload;
        }
    }
});

export const selectCurrentComponent = (state: RootState) => state.imparcial.currentComponent;

export const { updateCurrentComponent, updateSelectedNotification, updateSetNotificationsVisible } = imparcialSlice.actions

export default imparcialSlice.reducer;
