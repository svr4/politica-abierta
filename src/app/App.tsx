import React, { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from './lib/hooks';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

import FilterBar from './components/FilterBar';
import LegislationList from './components/LegislationList';
import StoryList from './components/StoryList/StoryList';
import './App.css';
import { selectCurrentComponent } from './lib/slices/imparcialApp';
import { updateConfig } from './lib/slices/appConfig';
import { SourceType } from './lib/models';
import NavBar from './components/NavBar';

library.add(fas, far);

function App() {

  const currentComponent = useAppSelector(selectCurrentComponent);
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      const configResult = await window.imparcialAPI.getConfig();
      if(!configResult.Error) {
        dispatch(updateConfig(configResult.Data));
      }
    })()
  }, []);

  function renderMainComponent() {
    switch(currentComponent) {
      case SourceType.ENDI:
      case SourceType.Vocero:
      case SourceType.Noticel:
        return <StoryList />
      case SourceType.Legislacion:
        return <LegislationList />
    }
  }

  return (
    <>
      <NavBar />
      <FilterBar />
      {renderMainComponent()}
    </>
  );
}

export default App;