import Promise from 'bluebird';
import MediaPlugin from './media-plugin';
import JanusPluginMessage from '../../client/misc/plugin-message';

class MediaEntityPlugin extends MediaPlugin {
  private currentEntityId: string | number | null = null;

  hasCurrentEntity(id: string | number | null = null): boolean {
    if (id) return id === this.currentEntityId;
    return !!this.currentEntityId;
  }

  setCurrentEntity(id: string | number) {
    this.currentEntityId = id;
  }

  resetCurrentEntity() {
    this.currentEntityId = null;
  }

  _create(options: any): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'create' }, options);
    return this.sendWithTransaction({ body }).catch(error => {
      if (error.message.indexOf('already exists') > 0) {
        return error.response;
      } else {
        throw error;
      }
    });
  }

  _destroy(id: string | number, options: any): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'destroy' }, options);
    return this.sendWithTransaction({ body }).then(response => {
      if (this.hasCurrentEntity(id)) {
        this.resetCurrentEntity();
      }
      return response;
    });
  }

  _list(options: any = {}): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'list' }, options ?? {});
    return this.sendWithTransaction({ body });
  }

  //@ts-ignore
  onHangup(msg) {
    this.resetCurrentEntity();
    return super.onHangup(msg);
  }
}

export default MediaEntityPlugin;
