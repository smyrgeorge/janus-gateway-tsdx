import Plugin from '../client/plugin';
import MediaPlugin from './base/media-plugin';
import JanusMessage from '../client/misc/message';
import JanusPluginMessage from '../client/misc/plugin-message';
import { JoinInfo, JoinOptions, Publisher, PublisherJoinResult, RemoteVideo } from './dto/video-room';

const JANUS_VIDEOROOM_OPTIONS = { audio: true, video: true };

/**
 * Original documentation of the plugin here:
 * https://janus.conf.meetecho.com/docs/videoroom.html
 *
 * Events:
 * videoroom-remote-feed:received
 * videoroom-remote-feed:leaving
 * videoroom-remote-feed:unpublished
 * videoroom-remote-feed:leaving
 */
class VideoRoomPlugin extends MediaPlugin {
  static NAME = 'janus.plugin.videoroom';
  private joinInfo: JoinInfo | null = null;

  processLocalVideo(info: JoinInfo, constraints: MediaStreamConstraints) {
    this.joinInfo = info;

    return this.getUserMedia(constraints)
      .then(stream => {
        this.createPeerConnection({});
        //@ts-ignore
        stream.getTracks().forEach(track => this.addTrack(track, stream));
      })
      .then(() => this.createOffer({}))
      .then(jsep => this.configure(JANUS_VIDEOROOM_OPTIONS, jsep))
      .then(resp => {
        const jsep = resp.get('jsep');
        if (jsep) {
          this.setRemoteSDP(jsep);
          return jsep;
        }
      });
  }
  //@ts-ignore
  configure(options, jsep) {
    const body = Object.assign({ request: 'configure' }, options);
    const message: any = { body };
    if (jsep) {
      message.jsep = jsep;
    }
    return this.sendWithTransaction(message);
  }

  join(options: JoinOptions) {
    let body = Object.assign({ request: 'join' }, options);
    return this.sendWithTransaction({ janus: 'message', body });
  }
  //@ts-ignore
  start(room, jsep) {
    return this.sendWithTransaction({
      janus: 'message',
      body: { request: 'start', room },
      jsep,
    });
  }

  unpublish() {
    return this.sendWithTransaction({
      janus: 'message',
      body: { request: 'unpublish' },
    }).then(response => {
      this.closePeerConnection();
      return response;
    });
  }

  processIncomeMessage(message: JanusMessage) {
    return super.processIncomeMessage(message).then(result => {
      if (!message.getPlainMessage()) {
        return;
      }

      console.log('Received:', message);

      const plainMessage = message.getPlainMessage();
      const type = plainMessage.janus;

      switch (type) {
        case 'event':
          const pluginData = plainMessage?.plugindata?.data;
          if (!pluginData.videoroom) {
            break;
          }

          let videoroom = pluginData.videoroom;
          this.handleRemotePublishers(pluginData.publishers).then(() => console.debug('Success handle publishers.'));

          switch (videoroom) {
            case 'attached':
              this.emit('videoroom-remote-feed:attached', { plainMessage });
              break;
            case 'event':
              if (pluginData.unpublished) {
                this.emit('videoroom-remote-feed:unpublished', pluginData.unpublished);
              } else if (pluginData.leaving) {
                this.emit('videoroom-remote-feed:leaving', pluginData.leaving);
              }
              break;
          }
          break;
      }
      return result;
    });
  }

  getResponseAlias() {
    return 'videoroom';
  }

  private handlerPublisher = async (publisher: Publisher): Promise<PublisherJoinResult> => {
    //@ts-ignore
    let plugin: VideoRoomPlugin = await this.getSession()?.attachPlugin(VideoRoomPlugin.NAME);
    plugin.on('pc:track:remote', (event: any) => {
      let feed: RemoteVideo = { feedInfo: publisher, stream: event.streams[0] };
      this.emit('videoroom-remote-feed:received', feed);
    });

    let options: JoinOptions = {
      ptype: 'subscriber',
      feed: publisher.id,
      room: this.joinInfo?.room,
      private_id: this.joinInfo?.private_id,
    };

    let message: JanusPluginMessage = await plugin.join(options);
    return { message, plugin };
  };

  private handleRemotePublishers = async (publishers: Publisher[]) => {
    if (!publishers) return;
    for (const publisher of publishers) {
      let result = await this.handlerPublisher(publisher);
      result.plugin.createPeerConnection();
      let jsep = await result.plugin.createAnswer(result.message.getPlainMessage().jsep, {});
      await result.plugin.start(this.joinInfo?.room, jsep);
    }
  };
}

Plugin.register(VideoRoomPlugin.NAME, VideoRoomPlugin);

export default VideoRoomPlugin;
