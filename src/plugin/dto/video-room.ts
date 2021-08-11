import JanusPluginMessage from '../../client/misc/plugin-message'
import VideoRoomPlugin from '../video-room-plugin'

export interface Publisher {
  id: number
  display: string
  talking: boolean
  audio_codec: string
  video_codec: string
}

export interface PublisherJoinResult {
  message: JanusPluginMessage,
  plugin: VideoRoomPlugin
}

export interface RemoteVideo {
  feedInfo: any
  stream: any
}

export interface JoinOptions {
  room?: number
  ptype?: string
  display?: string
  feed?: number
  pin?: any
  private_id?: number
}

export interface JoinInfo {
  videoroom: string
  room: number
  description: string
  id: number
  private_id: number
  publishers: any[]
}
