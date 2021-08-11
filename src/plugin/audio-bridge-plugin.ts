import Plugin from '../client/plugin'
import MediaAudioPlugin from './base/media-audio-plugin'
import JanusPluginMessage from '../client/misc/plugin-message'

class AudioBridgePlugin extends MediaAudioPlugin {

  static NAME = 'janus.plugin.audiobridge'

  create(roomId: any, options: any): Promise<JanusPluginMessage> {
    return this._create(Object.assign({room: roomId}, options))
  }

  destroy(roomId: number, options: any): Promise<JanusPluginMessage> {
    return this._destroy(roomId, Object.assign({room: roomId}, options))
  }

  join(roomId: number, options: any): Promise<JanusPluginMessage> {
    options = Object.assign({room: roomId}, options)
    return this._join(roomId, options)
  }

  change(roomId: number, options: any): Promise<JanusPluginMessage> {
    options = Object.assign({room: roomId}, options)
    return this._change(roomId, options)
  }

  connect(roomId: number, options: any): Promise<JanusPluginMessage> {
    options = Object.assign({room: roomId}, options)
    return this._connect(roomId, options)
  }

  listParticipants(roomId: number): Promise<JanusPluginMessage> {
    return this._listParticipants({room: roomId})
  }

  getResponseAlias() {
    return 'audiobridge'
  }
}

Plugin.register(AudioBridgePlugin.NAME, AudioBridgePlugin)

export default AudioBridgePlugin
