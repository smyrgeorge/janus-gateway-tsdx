import Plugin from '../client/plugin';
import MediaAudioPlugin from './base/media-audio-plugin';
import JanusPluginMessage from '../client/misc/plugin-message';

/**
 * Original documentation of the plugin here:
 * https://janus.conf.meetecho.com/docs/audiobridge.html
 */
class AudioBridgePlugin extends MediaAudioPlugin {
  static NAME = 'janus.plugin.audiobridge';

  create(room: number, options: any): Promise<JanusPluginMessage> {
    return this._create(Object.assign({ room }, options));
  }

  destroy(room: number, options: any): Promise<JanusPluginMessage> {
    return this._destroy(room, Object.assign({ room }, options));
  }

  join(room: number, options: any): Promise<JanusPluginMessage> {
    options = Object.assign({ room }, options);
    return this._join(room, options);
  }

  change(room: number, options: any): Promise<JanusPluginMessage> {
    options = Object.assign({ room }, options);
    return this._change(room, options);
  }

  connect(room: number, options: any): Promise<JanusPluginMessage> {
    options = Object.assign({ room }, options);
    return this._connect(room, options);
  }

  listParticipants(room: number): Promise<JanusPluginMessage> {
    return this._listParticipants({ room });
  }

  getResponseAlias() {
    return 'audiobridge';
  }
}

Plugin.register(AudioBridgePlugin.NAME, AudioBridgePlugin);

export default AudioBridgePlugin;
