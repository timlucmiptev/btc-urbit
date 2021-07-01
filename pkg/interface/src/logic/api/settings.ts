import {
  Bucket, Key,

  SettingsUpdate, Value
} from '@urbit/api/settings';
import { StoreState } from '../store/type';
import BaseApi from './base';

export default class SettingsApi extends BaseApi<StoreState> {
  private storeAction(action: SettingsUpdate): Promise<any> {
    return this.action('settings-store', 'settings-event', action);
  }

  putBucket(key: Key, bucket: Bucket) {
    return this.storeAction({
      'put-bucket': {
        'bucket-key': key,
        'bucket': bucket
      }
    });
  }

  delBucket(key: Key) {
    return this.storeAction({
      'del-bucket': {
        'bucket-key': key
      }
    });
  }

  putEntry(buc: Key, key: Key, val: Value) {
    return this.storeAction({
      'put-entry': {
        'bucket-key': buc,
        'entry-key': key,
        'value': val
      }
    });
  }

  delEntry(buc: Key, key: Key) {
    return this.storeAction({
      'put-entry': {
        'bucket-key': buc,
        'entry-key': key
      }
    });
  }

  async getAll() {
    const { all } = await this.scry('settings-store', '/all');
    this.store.handleEvent({ data:
      { 'settings-data': { all } }
    });
  }

  async getBucket(bucket: Key) {
    const data: Record<string, unknown> = await this.scry('settings-store', `/bucket/${bucket}`);
    this.store.handleEvent({ data: { 'settings-data': {
      'bucket-key': bucket,
      'bucket': data.bucket
    } } });
  }

  async getEntry(bucket: Key, entry: Key) {
    const data: Record<string, unknown> = await this.scry('settings-store', `/entry/${bucket}/${entry}`);
    this.store.handleEvent({ data: { 'settings-data': {
      'bucket-key': bucket,
      'entry-key': entry,
      'entry': data.entry
    } } });
  }
}
