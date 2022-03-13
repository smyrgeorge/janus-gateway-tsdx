import VideoRoom from './video-room';
import { JanusId, JoinInfo, JoinOptions, RemoteVideo } from '../../plugin/dto/video-room'
import { MediaDevices, WebRTC } from '../../plugin/base/shims/definitions';

class VideoRoomBuilder {
  // Media constraints documentation here:
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints
  private readonly mediaConstraints: MediaStreamConstraints;

  // Room
  private readonly room: VideoRoom;

  constructor(server: string, mediaConstraints: MediaStreamConstraints, mediaDevices: MediaDevices, webRTC: WebRTC) {
    this.mediaConstraints = mediaConstraints;
    this.room = new VideoRoom(server, { keepalive: true }, mediaDevices, webRTC);
    this.room.onRoomJoined((info: JoinInfo) => console.info('Room joined:', info));
  }

  onLocalVideo(f: (stream: MediaStream) => void): VideoRoomBuilder {
    this.room.onLocalVideo(f);
    return this;
  }

  onRemoteVideo(f: (e: RemoteVideo) => void): VideoRoomBuilder {
    this.room.onRemoteVideo(f);
    return this;
  }

  onUnpublished(f: (e: number) => void): VideoRoomBuilder {
    this.room.onUnpublished(f);
    return this;
  }

  onLeaving(f: (e: number) => void): VideoRoomBuilder {
    this.room.onLeaving(f);
    return this;
  }

  /**
   * @param room Room id
   * @param display User display name
   * @param id User pre-defined id (optional)
   * @param pin Room pin (optional)
   */
  async join(
    room: JanusId,
    display: string,
    id: JanusId | undefined = undefined,
    pin: string | undefined = undefined
  ): Promise<VideoRoom> {
    let options: JoinOptions = { room, display, id, pin };
    await this.room.join(options, this.mediaConstraints).catch(e => console.error(e.message));
    return this.room;
  }
}

export default VideoRoomBuilder;
