import Promise from 'bluebird';
import Plugin from '../client/plugin';
import MediaStreamPlugin from './base/media-stream-plugin';
import JanusPluginMessage from '../client/misc/plugin-message';

/**
 * Original documentation of the plugin here:
 * https://janus.conf.meetecho.com/docs/streaming.html
 */
class StreamingPlugin extends MediaStreamPlugin {
  static NAME = 'janus.plugin.streaming';

  create(id: number, options: any) {
    return this._create(id, options);
  }

  destroy(id: number, options: any): Promise<JanusPluginMessage> {
    return this._destroy(id, options);
  }

  list(): Promise<JanusPluginMessage> {
    return this._list();
  }

  watch(id: number, watchOptions: any, answerOptions: any): Promise<JanusPluginMessage> {
    return this._watch(id, watchOptions, answerOptions);
  }

  start(jsep: RTCSessionDescription): Promise<JanusPluginMessage> {
    return this._start(jsep);
  }

  stop(): Promise<JanusPluginMessage> {
    return this._stop();
  }

  pause(): Promise<JanusPluginMessage> {
    return this._pause();
  }

  switch(id: number, options: any): Promise<JanusPluginMessage> {
    return this._switch(id, options);
  }

  enable(id: number, options: any): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'enable', id }, options);
    return this.sendWithTransaction({ body });
  }

  disable(id: number, options: any): Promise<any> {
    let body = Object.assign({ request: 'disable', id }, options);
    return this.sendWithTransaction({ body }).then(() => {
      if (this.hasCurrentEntity(id)) {
        this.resetCurrentEntity();
      }
    });
  }

  recording(id: number, options: any): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'recording', id }, options);
    return this.sendWithTransaction({ body });
  }

  getResponseAlias() {
    return 'streaming';
  }
}

Plugin.register(StreamingPlugin.NAME, StreamingPlugin);

export default StreamingPlugin;
