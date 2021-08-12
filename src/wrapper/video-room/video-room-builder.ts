import VideoRoom from './video-room';
import { JoinInfo, JoinOptions, RemoteVideo } from '../../plugin/dto/video-room';
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
    this.room.onRemoteRoomAttached((info: JoinInfo) => console.info('Remote room attached:', info));
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

  async join(room: number, display: string): Promise<VideoRoom> {
    let options: JoinOptions = { room, display };
    await this.room.join(options, this.mediaConstraints).catch(e => console.error(e.message));
    return this.room;
  }
}

export default VideoRoomBuilder;
