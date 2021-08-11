import * as Janus from '../../index'
import JanusPluginMessage from '../../client/misc/plugin-message'
import {ConnectionOptions} from '../../client/connection'
import {UserMediaResult} from '../../plugin/base/media-plugin'
import {JoinInfo, JoinOptions, RemoteVideo} from '../../plugin/dto/video-room'

export class VideoRoom {
  private readonly address: string
  private readonly clientOptions: ConnectionOptions

  private client: Janus.Client
  private connection?: Janus.Connection
  private session?: Janus.Session
  private plugin?: Janus.VideoRoomPlugin

  private joinInfo?: JoinInfo

  constructor(address: string, clientOptions: ConnectionOptions = {keepalive: true}) {
    this.address = address
    this.clientOptions = clientOptions
    this.client = new Janus.Client(this.address, this.clientOptions)
  }

  public onRoomJoined(f: (e: JoinInfo) => void) {
    this._onRoomJoined = f
  }

  public onRemoteRoomAttached(f: (e: JoinInfo) => void) {
    this._onRemoteRoomAttached = f
  }

  public onLocalVideo(f: (e: MediaStream) => void) {
    this._onLocalVideo = f
  }

  public onRemoteVideo(f: (e: RemoteVideo) => void) {
    this._onRemoteVideo = f
  }

  public onUnpublished(f: (e: number) => void) {
    this._onUnpublished = f
  }

  public onLeaving(f: (e: number) => void) {
    this._onLeaving = f
  }

  join = async (options: JoinOptions, constraints: MediaStreamConstraints) => {
    options = Object.assign(options, {ptype: 'publisher'})

    // Attach video plugin.
    await this.attachPlugin()

    // Join room.
    const data: JanusPluginMessage = await this.plugin?.join(options)
    this.joinInfo = data.getPlainMessage().plugindata.data as JoinInfo
    this._onRoomJoined(this.joinInfo)

    // Request local video.
    await this.plugin?.processLocalVideo(this.joinInfo, constraints)
  }

  unpublish = async () => {
    return this.plugin?.unpublish()
  }

  private _onRoomJoined = (_: JoinInfo) => {
  }

  // @ts-ignore
  private _onRemoteRoomAttached = (_: JoinInfo) => {
  }

  private _onLocalVideo = (_: MediaStream) => {
  }

  private _onRemoteVideo = (_: RemoteVideo) => {
  }

  private _onUnpublished = (_: number) => {
  }

  private _onLeaving = (_: number) => {
  }

  private createConnection = async () => {
    if (this.connection) return this.connection
    this.connection = await this.client.createConnection('client')
    return this.connection
  }

  private createSession = async () => {
    if (this.session) return this.session
    await this.createConnection()
    this.session = await this.connection?.createSession()
    return this.session
  }

  private attachPlugin = async () => {
    await this.createSession()
    if (this.plugin) return this.plugin
    this.plugin = await this.session?.attachPlugin(Janus.VideoRoomPlugin.NAME)

    // Event when user accepts permissions.
    this.plugin?.on('consent-dialog:stop', (media: UserMediaResult) => {
      if (media.stream) this._onLocalVideo(media.stream)
      else console.log(media.error)
    })

    // Event when remote stream is available.
    this.plugin?.on('videoroom-remote-feed:received', (feed: RemoteVideo) => {
      this._onRemoteVideo(feed)
    })

    // Event when remote feed unpublished.
    this.plugin?.on('videoroom-remote-feed:unpublished', (feedId: number) => {
      this._onUnpublished(feedId)
    })

    // Event when remote participant left the room.
    this.plugin?.on('videoroom-remote-feed:leaving', (feedId: number) => {
      this._onLeaving(feedId)
    })

    return this.plugin
  }
}

export default VideoRoom
