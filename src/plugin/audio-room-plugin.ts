import Plugin from '../client/plugin';
import MediaAudioPlugin from './base/media-audio-plugin';
import JanusPluginMessage from '../client/misc/plugin-message';

class AudioRoomPlugin extends MediaAudioPlugin {
  static NAME = 'janus.plugin.cm.audioroom';

  destroy(id: string, options: any): Promise<JanusPluginMessage> {
    return this._destroy(id, Object.assign({ id: id }, options));
  }

  join(id: string, options: any): Promise<JanusPluginMessage> {
    options = Object.assign({ id: id }, options);
    return this._join(id, options);
  }

  change(id: string, options: any): Promise<JanusPluginMessage> {
    options = Object.assign({ id: id }, options);
    return this._change(id, options);
  }

  connect(id: string, options: any): Promise<JanusPluginMessage> {
    options = Object.assign({ id: id }, options);
    return this._connect(id, options);
  }

  listParticipants(id: string): Promise<JanusPluginMessage> {
    return this._listParticipants({ id: id });
  }

  getResponseAlias() {
    return 'audioroom';
  }
}

Plugin.register(AudioRoomPlugin.NAME, AudioRoomPlugin);

export default AudioRoomPlugin;
