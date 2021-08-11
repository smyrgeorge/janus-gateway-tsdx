import Promise from 'bluebird';
import TTransactionGateway from './tx/t-transaction-gateway';
import JanusError from './misc/error';
import Transaction from './tx/transaction';
import Websocket from './websocket';
import Session from './session';
import JanusMessage from './misc/message';
import { MediaDevices } from '../plugin/base/shims/media-devices-shim';
import { WebRTC } from '../plugin/base/shims/webrtc-shim';

export interface RTCPeerConnectionOptions {
  config?: any;
  constraints?: any;
}

export interface ConnectionOptions {
  token?: string;
  apisecret?: string;
  keepalive: boolean | number;
  pc?: RTCPeerConnectionOptions;
}

class Connection extends TTransactionGateway {
  private readonly id: string;
  private readonly address: string;
  private readonly sessions: {};
  private readonly options: ConnectionOptions;
  private readonly websocketConnection: Websocket;
  private readonly mediaDevices: MediaDevices;
  private readonly webRTC: WebRTC;

  constructor(id: string, address: string, options: ConnectionOptions, mediaDevices: MediaDevices, webRTC: WebRTC) {
    super();

    this.id = id;
    this.address = address;
    this.sessions = {};
    this.options = options;

    this.websocketConnection = new Websocket();
    this.initWebsocketListeners();

    this.mediaDevices = mediaDevices;
    this.webRTC = webRTC;
  }

  getId(): string {
    return this.id;
  }

  getAddress(): string {
    return this.address;
  }

  getOptions(): ConnectionOptions {
    return this.options;
  }

  open(): Promise<Connection> {
    return this.websocketConnection.open(this.address, 'janus-protocol').return(this);
  }

  close(): Promise<any> {
    if (this.websocketConnection.isOpened()) {
      return Promise.map(this.getSessionList(), session => session.cleanup())
        .then(() => this.websocketConnection.close())
        .then(() => this.emit('close'));
    }
    return Promise.resolve();
  }

  isClosed(): boolean {
    return this.websocketConnection.isClosed();
  }

  createSession(): Promise<any> {
    return this.sendSync({ janus: 'create' });
  }

  hasSession(sessionId: string): boolean {
    return !!this.getSession(sessionId);
  }

  getSession(sessionId: string): Session {
    return this.sessions[sessionId];
  }

  getSessionList(): Session[] {
    return Object.keys(this.sessions).map(id => this.sessions[id]);
  }

  addSession(session: Session) {
    this.sessions[session.getId()] = session;
    session.once('destroy', () => this.removeSession(session.getId()));
  }

  removeSession(sessionId: string) {
    delete this.sessions[sessionId];
  }

  send(message: any): Promise<any> {
    if (this.options.token) {
      message.token = this.options.token;
    }

    if (this.options.apisecret) {
      message.apisecret = this.options.apisecret;
    }

    if (!message['transaction']) {
      message['transaction'] = Transaction.generateRandomId();
    }

    return this.websocketConnection.send(message);
  }

  processOutcomeMessage(message: any): Promise<any> {
    if ('create' === message['janus']) {
      return this._onCreate(message);
    }

    let sessionId = message['session_id'];
    if (sessionId) {
      if (this.hasSession(sessionId)) {
        return this.getSession(sessionId).processOutcomeMessage(message);
      } else {
        return Promise.reject(new Error('Invalid session: [' + sessionId + ']'));
      }
    }

    return Promise.resolve(message);
  }

  processIncomeMessage(msg: JanusMessage): Promise<any> {
    this.emit('message', msg);
    let sessionId = msg.get('session_id');

    if (sessionId && this.hasSession(sessionId)) {
      return this.getSession(sessionId).processIncomeMessage(msg);
    }

    return Promise.try(() => {
      if (sessionId && !this.hasSession(sessionId)) {
        throw new Error('Invalid session: [' + sessionId + ']');
      }

      return this.defaultProcessIncomeMessage(msg);
    });
  }

  toString() {
    return `JanusConnection${JSON.stringify({
      id: this.id,
      address: this.address,
    })}`;
  }

  private _onCreate(outMsg: JanusMessage): Promise<JanusMessage> {
    this.addTransaction(
      new Transaction(outMsg['transaction'], (msg: JanusMessage) => {
        if ('success' === msg.get('janus')) {
          let sessionId = msg.get('data', 'id');
          this.addSession(new Session(this, sessionId, this.mediaDevices, this.webRTC));
          return this.getSession(sessionId);
        } else {
          throw new JanusError(msg);
        }
      })
    );

    return Promise.resolve(outMsg);
  }

  private initWebsocketListeners() {
    this.websocketConnection.on('open', () => this.emit('open'));
    this.websocketConnection.on('error', () => this.emit('error'));
    this.websocketConnection.on('close', () => this.emit('close'));
    this.websocketConnection.on('message', msg => {
      this.processIncomeMessage(new JanusMessage(msg)).catch(error => this.emit('error', error));
    });
  }
}

export default Connection;
