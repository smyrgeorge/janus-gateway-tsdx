import Connection, {ConnectionOptions} from './connection'
import MediaDevicesShim, {MediaDevices} from '../plugin/base/shims/media-devices-shim'
import WebRTCShim, {WebRTC} from '../plugin/base/shims/webrtc-shim'

class Client {
  private readonly address: string
  private readonly options: ConnectionOptions
  private readonly mediaDevices: MediaDevices
  private readonly webRTC: WebRTC

  constructor(address: string, options: ConnectionOptions = {keepalive: true},
              mediaDevices: MediaDevices = new MediaDevicesShim(), webRTC: WebRTC = new WebRTCShim()) {
    this.address = address
    this.options = options
    this.mediaDevices = mediaDevices
    this.webRTC = webRTC
  }

  createConnection(id: string): Promise<Connection> {
    return new Connection(id, this.address, this.options, this.mediaDevices, this.webRTC).open()
  }
}

export default Client
