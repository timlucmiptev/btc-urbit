import f from 'lodash/fp';
import { RemoteContentPolicy, LeapCategories, leapCategories } from '~/types/local-update';
import { useShortcut as usePlainShortcut } from '~/logic/lib/shortcutContext';
import { BaseState, createState } from '~/logic/state/base';
import { useCallback } from 'react';

export interface ShortcutMapping {
  cycleForward: string;
  cycleBack: string;
  navForward: string;
  navBack: string;
  hideSidebar: string;
  readGroup: string;
}

export interface SettingsState extends BaseState<SettingsState> {
  display: {
    backgroundType: 'none' | 'url' | 'color';
    background?: string;
    dark: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  calm: {
    hideNicknames: boolean;
    hideAvatars: boolean;
    hideUnreads: boolean;
    hideGroups: boolean;
    hideUtilities: boolean;
  };
  keyboard: ShortcutMapping;
  remoteContentPolicy: RemoteContentPolicy;
  leap: {
    categories: LeapCategories[];
  };
  tutorial: {
    seen: boolean;
    joined?: number;
  };
}

export const selectSettingsState =
<K extends keyof SettingsState>(keys: K[]) => f.pick<SettingsState, K>(keys);

export const selectCalmState = (s: SettingsState) => s.calm;

export const selectDisplayState = (s: SettingsState) => s.display;

// @ts-ignore investigate zustand types
const useSettingsState = createState<SettingsState>('Settings', {
  display: {
    backgroundType: 'none',
    background: undefined,
    dark: false,
    theme: 'auto'
  },
  calm: {
    hideNicknames: false,
    hideAvatars: false,
    hideUnreads: false,
    hideGroups: false,
    hideUtilities: false
  },
  remoteContentPolicy: {
    imageShown: true,
    oembedShown: true,
    audioShown: true,
    videoShown: true
  },
  leap: {
    categories: leapCategories
  },
  tutorial: {
    seen: true,
    joined: undefined
  },
  keyboard: {
    cycleForward: 'ctrl+\'',
    cycleBack: 'ctrl+;',
    navForward: 'ctrl+]',
    navBack: 'ctrl+[',
    hideSidebar: 'ctrl+\\',
    readGroup: 'shift+Escape'
  }
});

export function useShortcut<T extends keyof ShortcutMapping>(name: T, cb: (e: KeyboardEvent) => void) {
  const key = useSettingsState(useCallback(s => s.keyboard[name], [name]));
  return usePlainShortcut(key, cb);
}

export default useSettingsState;
