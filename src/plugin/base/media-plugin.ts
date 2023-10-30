import Promise from 'bluebird';
import Plugin from '../../client/plugin';
import { MediaDevices, WebRTC } from './shims/definitions';
import JanusMessage from '../../client/misc/message';
import Session from '../../client/session';

class MediaPlugin extends Plugin {
  private readonly pcListeners: {} = {};
  private pc: RTCPeerConnection | null = null;

  private readonly mediaDevices: MediaDevices;
  private readonly webRTC: WebRTC;

  constructor(session: Session, name: string, id: string, mediaDevices: MediaDevices, webRTC: WebRTC) {
    super(session, name, id);
    this.mediaDevices = mediaDevices;
    this.webRTC = webRTC;
  }

  createPeerConnection(config: RTCConfiguration = {}): RTCPeerConnection {
    config = Object.assign({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }, config);
    this.pc = this.webRTC.newRTCPeerConnection(config);
    this.addPcEventListeners();
    return this.pc;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  hangup(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.once('hangup', resolve);
      this.sendWithTransaction({ janus: 'hangup' }).catch(reject);
    });
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    this.pc?.addTrack(track, stream);
    this.emit('pc:track:local', { track, streams: [stream] });
  }

  getUserMedia(constraints: MediaStreamConstraints): Promise<any> {
    this.emit('consent-dialog:start');
    let promise = this.mediaDevices.getUserMedia(constraints);
    return promise
      .then(stream => {
        this.emit('consent-dialog:stop', { stream });
        return stream;
      })
      .catch(error => {
        this.emit('consent-dialog:stop', { error });
        throw error;
      });
  }

  createOffer(options: RTCOfferOptions): Promise<any> {
    return this.createSDP('createOffer', options);
  }

  createAnswer(jsep: RTCSessionDescription, options: RTCAnswerOptions): Promise<any> {
    return Promise.try(() => this.setRemoteSDP(jsep)).then(() => this.createSDP('createAnswer', options));
  }

  setRemoteSDP(jsep: RTCSessionDescription): Promise<any> {
    return Promise.resolve(this.pc?.setRemoteDescription(this.webRTC.newRTCSessionDescription(jsep)));
  }

  private createSDP(party: string, options: RTCAnswerOptions | RTCOfferOptions): Promise<any> {
    if (!this.pc) {
      throw new Error('Create PeerConnection before creating SDP for it.');
    }

    if (['createOffer', 'createAnswer'].indexOf(party) < 0) {
      throw new Error('Unknown party in createSDP.');
    }

    options = options ?? {};

    return (
      //@ts-ignore
      this.pc[party](options)
        //@ts-ignore
        .then(description => this.pc?.setLocalDescription(description))
        .then(() => this.pc?.localDescription)
    );
  }

  processIncomeMessage(message: JanusMessage) {
    return Promise.try(() => super.processIncomeMessage(message)).then(result => {
      //@ts-ignore
      let janusType = message['janus'];
      switch (janusType) {
        case 'trickle':
          this.onTrickle(message);
          break;
        case 'hangup':
          this.onHangup(message);
          break;
      }
      return result;
    });
  }

  closePeerConnection() {
    if (this.pc) {
      this.stopLocalMedia();
      Object.keys(this.pcListeners).forEach(event => this.removePcEventListener(event));
      this.pc.close();
      this.pc = null;
      this.emit('pc:close');
    }
  }

  onDetached() {
    this.closePeerConnection();
    return super.onDetached();
  }

  onHangup(msg: any) {
    this.emit('hangup', msg);
  }

  private onTrickle(msg: any) {
    let candidate = this.webRTC.newRTCIceCandidate(msg['candidate']);
    this.pc?.addIceCandidate(candidate).catch(error => this.emit('pc:error', error));
  }

  private stopLocalMedia() {
    this.pc?.getSenders().forEach((sender: RTCRtpSender) => sender.track?.stop());
  }

  private addPcEventListeners() {
    //@ts-ignore
    this.addPcEventListener('addstream', event => {
      this.emit('pc:track:remote', { streams: [event.stream] });
    });
    //@ts-ignore
    this.addPcEventListener('track', event => {
      this.emit('pc:track:remote', event);
    });
    //@ts-ignore
    this.addPcEventListener('icecandidate', event => {
      if (event.candidate) {
        this.send({ janus: 'trickle', candidate: event.candidate });
      } else {
        this.send({ janus: 'trickle', candidate: { completed: true } });
        this.removePcEventListener('icecandidate');
      }
    });

    this.addPcEventListener('signalingstatechange', () => {
      if ('closed' === this.pc?.signalingState) {
        this.closePeerConnection();
      }
    });

    this.addPcEventListener('iceconnectionstatechange', () => {
      switch (this.pc?.iceConnectionState) {
        case 'closed':
        case 'failed':
          this.closePeerConnection();
          break;
      }
    });
  }
  //@ts-ignore
  private addPcEventListener(event, listener) {
    //@ts-ignore
    this.pcListeners[event] = listener;
    this.pc?.addEventListener(event, listener);
  }
  //@ts-ignore
  private removePcEventListener(event) {
    //@ts-ignore
    this.pc?.removeEventListener(event, this.pcListeners[event]);
    //@ts-ignore
    delete this.pcListeners[event];
  }
}

export interface UserMediaResult {
  stream?: MediaStream;
  error?: any;
}

export default MediaPlugin;
