import Promise from 'bluebird';
import JanusPluginMessage from '../../client/misc/plugin-message';
import MediaEntityPlugin from './media-entity-plugin';

class MediaAudioPlugin extends MediaEntityPlugin {
  _join(id: string | number, options: any): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'join' }, options);
    return this.sendWithTransaction({ body: body }).then(response => {
      this.setCurrentEntity(id);
      return response;
    });
  }

  leave(): Promise<JanusPluginMessage> {
    return this.sendWithTransaction({ body: { request: 'leave' } }).then(response => {
      this.resetCurrentEntity();
      return response;
    });
  }

  _change(id: string | number, options: any): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'changeroom' }, options);
    return this.sendWithTransaction({ body: body }).then(response => {
      this.setCurrentEntity(id);
      return response;
    });
  }

  _connect(id: string | number, options: any): Promise<JanusPluginMessage> {
    if (this.hasCurrentEntity(id)) {
      return Promise.resolve(new JanusPluginMessage({}, this));
    }

    if (this.hasCurrentEntity()) {
      return this._change(id, options);
    }

    return this._join(id, options);
  }

  list(): Promise<JanusPluginMessage> {
    return this._list();
  }

  configure(options: any, jsep: RTCSessionDescription): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'configure' }, options);
    let message: any = { body: body };
    if (jsep) {
      message.jsep = jsep;
    }
    return this.sendWithTransaction(message);
  }

  offerStream(stream: MediaStream, offerOptions: RTCOfferOptions, configureOptions: any): Promise<any> {
    return Promise.try(() => {
      this.createPeerConnection();
      stream.getAudioTracks().forEach(track => this.addTrack(track, stream));
    })
      .then(() => this.createOffer(offerOptions))
      .then(jsep => this.sendSDP(jsep, configureOptions));
  }

  sendSDP(jsep: RTCSessionDescription, configureOptions: any): Promise<RTCSessionDescription> {
    return this.configure(configureOptions, jsep).then(response => {
      let jsep = response.get('jsep');
      if (jsep) {
        this.setRemoteSDP(jsep);
        return jsep;
      }
      return Promise.reject(new Error('Failed sendSDP. No jsep in response.'));
    });
  }

  _listParticipants(options: any): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'listparticipants' }, options);
    return this.sendWithTransaction({ body: body });
  }
}

export default MediaAudioPlugin;
