/* global window */

import { createStore } from 'redux';
import addons from '@storybook/addons';
import qs from 'qs';
import createChannel from '@storybook/channel-postmessage';
import { handleKeyboardShortcuts } from '@storybook/ui/dist/libs/key_events';
import { StoryStore, ClientApi, ConfigApi, Actions, reducer } from '@storybook/core/client';
import render from './render';

// check whether we're running on node/browser
const { navigator } = global;
const isBrowser =
  navigator &&
  navigator.userAgent !== 'storyshots' &&
  !(navigator.userAgent.indexOf('Node.js') > -1);

const storyStore = new StoryStore();
const reduxStore = createStore(reducer);
const context = { storyStore, reduxStore };

if (isBrowser) {
  // setup preview channel
  const channel = createChannel({ page: 'preview' });
  channel.on('setCurrentStory', data => {
    reduxStore.dispatch(Actions.selectStory(data.kind, data.story));
  });
  addons.setChannel(channel);
  Object.assign(context, { channel });

  // handle query params
  const queryParams = qs.parse(window.location.search.substring(1));
  if (queryParams.selectedKind) {
    reduxStore.dispatch(Actions.selectStory(queryParams.selectedKind, queryParams.selectedStory));
  }

  // Handle keyboard shortcuts
  window.onkeydown = handleKeyboardShortcuts(channel);
}

const clientApi = new ClientApi(context);
export const { storiesOf, setAddon, addDecorator, clearDecorators, getStorybook } = clientApi;

const configApi = new ConfigApi({ clearDecorators, ...context });
export const { configure } = configApi;

// initialize the UI
const renderUI = () => {
  if (isBrowser) {
    render(context);
  }
};

reduxStore.subscribe(renderUI);
