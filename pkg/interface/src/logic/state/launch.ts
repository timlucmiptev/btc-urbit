import { Tile, WeatherState } from '~/types/launch-update';
import { BaseState, createState } from './base';

export interface LaunchState extends BaseState<LaunchState> {
  firstTime: boolean;
  tileOrdering: string[];
  tiles: {
    [app: string]: Tile;
  },
  weather: WeatherState | null | Record<string, never> | boolean,
  userLocation: string | null;
  baseHash: string | null;
  runtimeLag: boolean;
};

// @ts-ignore investigate zustand types
const useLaunchState = createState<LaunchState>('Launch', {
  firstTime: true,
  tileOrdering: [],
  tiles: {},
  weather: null,
  userLocation: null,
  baseHash: null,
  runtimeLag: false,
});

export default useLaunchState;
