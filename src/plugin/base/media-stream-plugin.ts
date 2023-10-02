import Promise from 'bluebird';
import JanusPluginMessage from '../../client/misc/plugin-message';
import MediaEntityPlugin from './media-entity-plugin';

class MediaStreamPlugin extends MediaEntityPlugin {
  // @ts-ignore
  _create(id: string | number, options: any): Promise<JanusPluginMessage> {
    options = Object.assign({ id }, options);
    return super._create(options);
  }

  _destroy(id: string | number, options: any = {}): Promise<JanusPluginMessage> {
    options = Object.assign({ id }, options);
    return super._destroy(id, options);
  }

  _watch(id: string | number, watchOptions: any = null, answerOptions: RTCAnswerOptions): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'watch', id }, watchOptions);
    return this.sendWithTransaction({ body }).then(response => {
      let jsep = response.get('jsep');
      if (!jsep || 'offer' !== jsep['type']) {
        throw new Error('Expect offer response on watch request');
      }
      this.setCurrentEntity(id);
      return this._offerAnswer(jsep, answerOptions).return(response);
    });
  }

  _start(jsep: RTCSessionDescription | null = null) {
    let message: any = { body: { request: 'start' } };
    if (jsep) {
      message.jsep = jsep;
    }
    return this.sendWithTransaction(message);
  }

  _stop(): Promise<JanusPluginMessage> {
    return this.sendWithTransaction({ body: { request: 'stop' } }).then(response => {
      this.resetCurrentEntity();
      return response;
    });
  }

  _pause(): Promise<JanusPluginMessage> {
    return this.sendWithTransaction({ body: { request: 'pause' } });
  }

  _switch(id: string | number, options: any = {}): Promise<JanusPluginMessage> {
    let body = Object.assign({ request: 'switch', id }, options);
    return this.sendWithTransaction({ body }).then(response => {
      this.setCurrentEntity(id);
      return response;
    });
  }

  connect(id: string | number, watchOptions: any, answerOptions: any): Promise<JanusPluginMessage> {
    if (this.hasCurrentEntity(id)) {
      return Promise.resolve(new JanusPluginMessage({}, this));
    }
    if (this.hasCurrentEntity()) {
      return this._switch(id, watchOptions);
    }
    return this._watch(id, watchOptions, answerOptions);
  }

  _offerAnswer(jsep: RTCSessionDescription, answerOptions: RTCAnswerOptions): Promise<JanusPluginMessage> {
    return Promise.try(() => this.createPeerConnection())
      .then(() => this.createAnswer(jsep, answerOptions))
      .then(jsep =>
        this.sendWithTransaction({
          janus: 'message',
          body: { request: 'start' },
          jsep,
        })
      );
  }
}

export default MediaStreamPlugin;
