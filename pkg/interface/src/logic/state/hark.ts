import { NotificationGraphConfig, Timebox, Unreads } from '@urbit/api';
import { patp2dec } from 'urbit-ob';
import BigIntOrderedMap from '@urbit/api/lib/BigIntOrderedMap';
import { useCallback } from 'react';

// import { harkGraphHookReducer, harkGroupHookReducer, harkReducer } from "~/logic/subscription/hark";
import { createState } from './base';

export const HARK_FETCH_MORE_COUNT = 3;

export interface HarkState {
  archivedNotifications: BigIntOrderedMap<Timebox>;
  doNotDisturb: boolean;
  // getMore: () => Promise<boolean>;
  // getSubset: (offset: number, count: number, isArchive: boolean) => Promise<void>;
  // getTimeSubset: (start?: Date, end?: Date) => Promise<void>;
  notifications: BigIntOrderedMap<Timebox>;
  unreadNotes: Timebox;
  notificationsCount: number;
  notificationsGraphConfig: NotificationGraphConfig; // TODO unthread this everywhere
  notificationsGroupConfig: string[];
  unreads: Unreads;
}

const useHarkState = createState<HarkState>('Hark', {
  archivedNotifications: new BigIntOrderedMap<Timebox>(),
  doNotDisturb: false,
  unreadNotes: [],
  // getMore: async (): Promise<boolean> => {
  //   const state = get();
  //   const offset = state.notifications.size || 0;
  //   await state.getSubset(offset, HARK_FETCH_MORE_COUNT, false);
  //   // TODO make sure that state has mutated at this point.
  //   return offset === (state.notifications.size || 0);
  // },
  // getSubset: async (offset, count, isArchive): Promise<void> => {
  //   const api = useApi();
  //   const where = isArchive ? 'archive' : 'inbox';
  //   const result = await api.scry({
  //     app: 'hark-store',
  //     path: `/recent/${where}/${offset}/${count}`
  //   });
  //   harkReducer(result);
  //   return;
  // },
  // getTimeSubset: async (start, end): Promise<void> => {
  //   const api = useApi();
  //   const s = start ? dateToDa(start) : '-';
  //   const e = end ? dateToDa(end) : '-';
  //   const result = await api.scry({
  //     app: 'hark-hook',
  //     path: `/recent/${s}/${e}`
  //   });
  //   harkGroupHookReducer(result);
  //   harkGraphHookReducer(result);
  //   return;
  // },
  notifications: new BigIntOrderedMap<Timebox>(),
  notificationsCount: 0,
  notificationsGraphConfig: {
    watchOnSelf: false,
    mentions: false,
    watching: []
  },
  notificationsGroupConfig: [],
  unreads: {
    graph: {},
    group: {}
  }
}, ['unreadNotes', 'notifications', 'archivedNotifications', 'unreads', 'notificationsCount']);

export function useHarkDm(ship: string) {
  return useHarkState(useCallback((s) => {
    return s.unreads.graph[`/ship/~${window.ship}/dm-inbox`]?.[`/${patp2dec(ship)}`];
  }, [ship]));
}

export default useHarkState;
