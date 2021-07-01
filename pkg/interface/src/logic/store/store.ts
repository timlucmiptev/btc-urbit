import _ from 'lodash';
import { unstable_batchedUpdates } from 'react-dom';
import { Cage } from '~/types/cage';
import ConnectionReducer from '../reducers/connection';
import { ContactReducer } from '../reducers/contact-update';
import GcpReducer from '../reducers/gcp-reducer';
import { GraphReducer } from '../reducers/graph-update';
import GroupReducer from '../reducers/group-update';
import { GroupViewReducer } from '../reducers/group-view';
import { HarkReducer } from '../reducers/hark-update';
import InviteReducer from '../reducers/invite-update';
import LaunchReducer from '../reducers/launch-update';
import MetadataReducer from '../reducers/metadata-update';
import S3Reducer from '../reducers/s3-update';
import SettingsReducer from '../reducers/settings-update';
import BaseStore from './base';
import { StoreState } from './type';

export default class GlobalStore extends BaseStore<StoreState> {
  inviteReducer = new InviteReducer();
  metadataReducer = new MetadataReducer();
  s3Reducer = new S3Reducer();
  groupReducer = new GroupReducer();
  launchReducer = new LaunchReducer();
  connReducer = new ConnectionReducer();
  settingsReducer = new SettingsReducer();
  gcpReducer = new GcpReducer();

  pastActions: Record<string, any> = {}

  constructor() {
    super();
    (window as any).debugStore = this.debugStore.bind(this);
  }

  debugStore(tag: string, ...stateKeys: string[]) {
    console.log(this.pastActions[tag]);
    console.log(_.pick(this.state, stateKeys));
  }

  initialState(): StoreState {
    return {
      connection: 'connected'
    };
  }

  reduce(data: Cage, state: StoreState) {
    unstable_batchedUpdates(() => {
      //  debug shim
      const tag = Object.keys(data)[0];
      const oldActions = this.pastActions[tag] || [];
      this.pastActions[tag] = [data[tag], ...oldActions.slice(0, 14)];
      this.inviteReducer.reduce(data);
      this.metadataReducer.reduce(data);
      this.s3Reducer.reduce(data);
      this.groupReducer.reduce(data);
      GroupViewReducer(data);
      this.launchReducer.reduce(data);
      this.connReducer.reduce(data, this.state);
      GraphReducer(data);
      HarkReducer(data);
      ContactReducer(data);
      this.settingsReducer.reduce(data);
      this.gcpReducer.reduce(data);
    });
  }
}
