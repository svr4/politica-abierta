import { configureStore } from '@reduxjs/toolkit'
import storyReducer from './slices/storyList'
import imparcialReducer from './slices/imparcialApp'
import legislationReducer from './slices/legislationList'
import appConfigReducer from './slices/appConfig'
// ...

const store = configureStore({
  reducer: {
    story: storyReducer,
    imparcial: imparcialReducer,
    legislation: legislationReducer,
    appConfig: appConfigReducer
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export type AppStore = typeof store

export default store;