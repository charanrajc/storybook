/* global window */

import { createStore } from 'redux';
import qs from 'qs';
import addons from '@storybook/addons';
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

const createWrapperComponent = Target => ({
  functional: true,
  render(h, c) {
    return h(Target, c.data, c.children);
  },
});
const decorateStory = (getStory, decorators) =>
  decorators.reduce(
    (decorated, decorator) => context => {
      const story = () => decorated(context);
      const decoratedStory = decorator(story, context);
      decoratedStory.components = decoratedStory.components || {};
      decoratedStory.components.story = createWrapperComponent(story());
      return decoratedStory;
    },
    getStory
  );
const context = { storyStore, reduxStore, decorateStory };

if (isBrowser) {
  // create preview channel
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
export const { storiesOf, setAddon, addDecorator, clearDecorators } = clientApi;

const configApi = new ConfigApi({ ...context, clearDecorators });
export const { configure } = configApi;

// initialize the UI
const renderUI = () => {
  if (isBrowser) {
    render(context);
  }
};

reduxStore.subscribe(renderUI);
