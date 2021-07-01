import _ from 'lodash';
import { Cage } from '~/types/cage';
import { LaunchUpdate, WeatherState } from '~/types/launch-update';
import { reduceState } from '../state/base';
import useLaunchState, { LaunchState } from '../state/launch';

export default class LaunchReducer {
  reduce(json: Cage) {
    const data = _.get(json, 'launch-update', false);
    if (data) {
      reduceState<LaunchState, LaunchUpdate>(useLaunchState, data, [
        initial,
        changeFirstTime,
        changeOrder,
        changeFirstTime,
        changeIsShown
      ]);
    }

    const weatherData: WeatherState | boolean | Record<string, never> = _.get(json, 'weather', false);
    if (weatherData) {
      useLaunchState.getState().set((state) => {
        // @ts-ignore investigate zustand types
        state.weather = weatherData;
      });
    }

    const locationData = _.get(json, 'location', false);
    if (locationData) {
      useLaunchState.getState().set((state) => {
        // @ts-ignore investigate zustand types
        state.userLocation = locationData;
      });
    }

    const baseHash = _.get(json, 'baseHash', false);
    if (baseHash) {
      useLaunchState.getState().set((state) => {
        // @ts-ignore investigate zustand types
        state.baseHash = baseHash;
      });
    }

    const runtimeLag = _.get(json, 'runtimeLag', null);
    if (runtimeLag !== null) {
      useLaunchState.getState().set(state => {
        // @ts-ignore investigate zustand types
        state.runtimeLag = runtimeLag;
      });
    }
  }
}

export const initial = (json: LaunchUpdate, state: LaunchState): LaunchState => {
  const data = _.get(json, 'initial', false);
  if (data) {
    Object.keys(data).forEach((key) => {
      state[key] = data[key];
    });
  }
  return state;
};

export const changeFirstTime = (json: LaunchUpdate, state: LaunchState): LaunchState => {
  const data = _.get(json, 'changeFirstTime', false);
  if (data) {
    state.firstTime = data;
  }
  return state;
};

export const changeOrder = (json: LaunchUpdate, state: LaunchState): LaunchState => {
  const data = _.get(json, 'changeOrder', false);
  if (data) {
    state.tileOrdering = data;
  }
  return state;
};

export const changeIsShown = (json: LaunchUpdate, state: LaunchState): LaunchState => {
  const data = _.get(json, 'changeIsShown', false);
  if (data) {
    const tile = state.tiles[data.name];
    if (tile) {
      tile.isShown = data.isShown;
    }
  }
  return state;
};
