import Promise from 'bluebird'
import Plugin from '../client/plugin'
import MediaStreamPlugin from './base/media-stream-plugin'
import JanusPluginMessage from '../client/misc/plugin-message'

class StreamingPlugin extends MediaStreamPlugin {

  static NAME = 'janus.plugin.streaming'

  create(id: number, options: any) {
    return this._create(id, options)
  }

  destroy(id: number, options: any): Promise<JanusPluginMessage> {
    return this._destroy(id, options)
  }

  list(): Promise<JanusPluginMessage> {
    return this._list()
  }

  watch(id: number, watchOptions: any, answerOptions: any): Promise<JanusPluginMessage> {
    return this._watch(id, watchOptions, answerOptions)
  }

  start(jsep: RTCSessionDescription): Promise<JanusPluginMessage> {
    return this._start(jsep)
  }

  stop(): Promise<JanusPluginMessage> {
    return this._stop()
  }

  pause(): Promise<JanusPluginMessage> {
    return this._pause()
  }

  switch(mountpointId: number, options: any): Promise<JanusPluginMessage> {
    return this._switch(mountpointId, options)
  }

  enable(mountpointId: number, options: any): Promise<JanusPluginMessage> {
    let body = Object.assign({request: 'enable', id: mountpointId}, options)
    return this.sendWithTransaction({body: body})
  }

  disable(mountpointId: number, options: any): Promise<any> {
    let body = Object.assign({request: 'disable', id: mountpointId}, options)
    return this.sendWithTransaction({body: body})
      .then(() => {
        if (this.hasCurrentEntity(mountpointId)) {
          this.resetCurrentEntity()
        }
      })
  }

  recording(mountpointId: number, options: any): Promise<JanusPluginMessage> {
    let body = Object.assign({request: 'recording', id: mountpointId}, options)
    return this.sendWithTransaction({body: body})
  }

  getResponseAlias() {
    return 'streaming'
  }
}

Plugin.register(StreamingPlugin.NAME, StreamingPlugin)

export default StreamingPlugin
