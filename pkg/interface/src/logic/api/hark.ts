import { Association, GraphNotifDescription, IndexedNotification, NotifIndex } from '@urbit/api';
import { BigInteger } from 'big-integer';
import { getParentIndex } from '../lib/notification';
import { dateToDa, decToUd } from '../lib/util';
import { reduce } from '../reducers/hark-update';
import { doOptimistically } from '../state/base';
import useHarkState from '../state/hark';
import { StoreState } from '../store/type';
import BaseApi from './base';

function getHarkSize() {
  return useHarkState.getState().notifications.size ?? 0;
}

export class HarkApi extends BaseApi<StoreState> {
  private harkAction(action: any): Promise<any> {
    return this.action('hark-store', 'hark-action', action);
  }

  private graphHookAction(action: any) {
    return this.action('hark-graph-hook', 'hark-graph-hook-action', action);
  }

  private groupHookAction(action: any) {
    return this.action('hark-group-hook', 'hark-group-hook-action', action);
  }

  private actOnNotification(frond: string, intTime: BigInteger | undefined, index: NotifIndex) {
    const time = intTime ? decToUd(intTime.toString()) : null;
    return this.harkAction({
      [frond]: {
        time,
        index
      }
    });
  }

  async setMentions(mentions: boolean) {
    await this.graphHookAction({
      'set-mentions': mentions
    });
  }

  setWatchOnSelf(watchSelf: boolean) {
    return this.graphHookAction({
      'set-watch-on-self': watchSelf
    });
  }

  setDoNotDisturb(dnd: boolean) {
    return this.harkAction({
      'set-dnd': dnd
    });
  }

  async archive(intTime: BigInteger, index: NotifIndex) {
    const time = intTime ? decToUd(intTime.toString()) : null;
    const action = {
      archive: {
        time,
        index
      }
    };
    await doOptimistically(useHarkState, action, this.harkAction.bind(this), [reduce]);
  }

  read(time: BigInteger, index: NotifIndex) {
    return this.harkAction({
      'read-note': index
    });
  }

  readIndex(index: NotifIndex) {
    return this.harkAction({
      'read-index': index
    });
  }

  unread(time: BigInteger, index: NotifIndex) {
    return this.actOnNotification('unread-note', time, index);
  }

  readGroup(group: string) {
    return this.harkAction({
      'read-group': group
    });
  }

  readGraph(graph: string) {
    return this.harkAction({
      'read-graph': graph
    });
  }

  dismissReadCount(graph: string, index: string) {
    return this.harkAction({
      'read-count': {
        graph: {
          graph,
          index
        }
      }
    });
  }

  markCountAsRead(association: Association, parent: string, description: GraphNotifDescription) {
    const action = {  'read-count': {
         graph: {
        graph: association.resource,
        group: association.group,
        description,
        index: parent
      } }
    };
    doOptimistically(useHarkState, action, this.harkAction.bind(this), [reduce]);
  }

  markEachAsRead(association: Association, parent: string, child: string, description: GraphNotifDescription, mod: string) {
    return this.harkAction({
      'read-each': {
        index:
          { graph:
            { graph: association.resource,
              group: association.group,
              description,
              module: mod,
              index: parent
            }
          },
        target: child
      }
    });
  }

  dec(index: NotifIndex, ref: string) {
    return this.harkAction({
      dec: {
        index,
        ref
      }
    });
  }

  seen() {
    return this.harkAction({ seen: null });
  }
  readAll() {
    return this.harkAction({ 'read-all': null });
  }

  mute(notif: IndexedNotification) {
    if('graph' in notif.index && 'graph' in notif.notification.contents) {
      const { index } = notif;
      const parentIndex = getParentIndex(index.graph, notif.notification.contents.graph);
      if(!parentIndex) {
        return Promise.resolve();
      }
      return this.ignoreGraph(index.graph.graph, parentIndex);
    }
    if('group' in notif.index) {
      const { group } = notif.index.group;
      return this.ignoreGroup(group);
    }
    return Promise.resolve();
  }

  unmute(notif: IndexedNotification) {
    if('graph' in notif.index && 'graph' in notif.notification.contents) {
      const { index } = notif;
      const parentIndex = getParentIndex(index.graph, notif.notification.contents.graph);
      if(!parentIndex) {
        return Promise.resolve();
      }
      return this.listenGraph(index.graph.graph, parentIndex);
    }
    if('group' in notif.index) {
      return this.listenGroup(notif.index.group.group);
    }
    return Promise.resolve();
  }

  ignoreGroup(group: string) {
    return this.groupHookAction({
      ignore: group
    });
  }

  ignoreGraph(graph: string, index: string) {
    return this.graphHookAction({
      ignore: {
        graph,
        index
      }
    });
  }

  listenGroup(group: string) {
    return this.groupHookAction({
      listen: group
    });
  }

  listenGraph(graph: string, index: string) {
    return this.graphHookAction({
      listen: {
        graph,
        index
      }
    });
  }

  async getMore(): Promise<boolean> {
    const offset = getHarkSize();
    const count = 3;
    await this.getSubset(offset, count, false);
    return offset === getHarkSize();
  }

  async getSubset(offset:number, count:number, isArchive: boolean) {
    const where = isArchive ? 'archive' : 'inbox';
    const data = await this.scry('hark-store', `/recent/${where}/${offset}/${count}`);
    this.store.handleEvent({ data });
  }

  async getTimeSubset(start?: Date, end?: Date) {
    const s = start ? dateToDa(start) : '-';
    const e = end ? dateToDa(end) : '-';
    const result = await this.scry('hark-hook', `/recent/${s}/${e}`);
    this.store.handleEvent({
      data: result
    });
  }
}
