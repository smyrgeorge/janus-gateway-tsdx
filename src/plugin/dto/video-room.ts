import JanusPluginMessage from '../../client/misc/plugin-message';
import VideoRoomPlugin from '../video-room-plugin';

export interface Publisher {
  id: number;
  display: string;
  talking: boolean;
  audio_codec: string;
  video_codec: string;
}

export interface PublisherJoinResult {
  message: JanusPluginMessage;
  plugin: VideoRoomPlugin;
}

export interface RemoteVideo {
  feedInfo: any;
  stream: any;
}

/**
 * TODO: Change to correct Type.
 * {
 *       "request" : "join",
 *       "ptype" : "publisher",
 *       "room" : <unique ID of the room to join>,
 *       "id" : <unique ID to register for the publisher; optional, will be chosen by the plugin if missing>,
 *       "display" : "<display name for the publisher; optional>",
 *       "token" : "<invitation token, in case the room has an ACL; optional>"
 * }
 */
export type JanusId = number | string
export interface JoinOptions {
  id?: JanusId;
  room?: JanusId;
  ptype?: string;
  display?: string;
  feed?: number;
  pin?: string;
  private_id?: number;
}

export interface JoinInfo {
  videoroom: string;
  room: JanusId;
  description: string;
  id: JanusId;
  private_id: number;
  publishers: any[];
}
