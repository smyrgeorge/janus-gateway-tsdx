import Plugin from '../client/plugin'
import MediaStreamPlugin from './base/media-stream-plugin'
import JanusPluginMessage from '../client/misc/plugin-message'

class RtpBroadcastPlugin extends MediaStreamPlugin {

  static NAME = 'janus.plugin.cm.audioroom'

  create(id: string, options: any): Promise<JanusPluginMessage> {
    return this._create(id, options)
  }

  destroy(id: string): Promise<JanusPluginMessage> {
    return this._destroy(id)
  }

  list(id: string) {
    return this._list(id)
  }

  watch(id: string, answerOptions: any): Promise<JanusPluginMessage> {
    return this._watch(id, null, answerOptions)
  }

  watchUDP(id: string, streams: any[]): Promise<JanusPluginMessage> {
    return this.sendWithTransaction({body: {request: 'watch-udp', id: id, streams: streams}})
  }

  start(): Promise<JanusPluginMessage> {
    return this._start()
  }

  stop(): Promise<JanusPluginMessage> {
    return this._stop()
  }

  pause(): Promise<JanusPluginMessage> {
    return this._pause()
  }

  switch(id: string): Promise<JanusPluginMessage> {
    return this._switch(id)
  }

  switchSource(index: number): Promise<JanusPluginMessage> {
    return this.sendWithTransaction({body: {request: 'switch-source', index: index}})
  }

  superuser(enabled: boolean): Promise<JanusPluginMessage> {
    return this.sendWithTransaction({body: {request: 'superuser', enabled: enabled}})
  }

  getResponseAlias() {
    return 'streaming'
  }
}

Plugin.register(RtpBroadcastPlugin.NAME, RtpBroadcastPlugin)

export default RtpBroadcastPlugin
