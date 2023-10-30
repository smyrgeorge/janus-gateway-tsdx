//@ts-ignore
import Promise from 'bluebird';
import TransactionManager from './tx/transaction-manager';
import JanusError from './misc/error';
import Transaction from './tx/transaction';
import Websocket from './websocket';
import Session from './session';
import JanusMessage from './misc/message';
import { MediaDevices, WebRTC } from '../plugin/base/shims/definitions';

export interface RTCPeerConnectionOptions {
  config?: any;
  constraints?: any;
}

export interface ConnectionOptions {
  token?: string;
  apisecret?: string;
  keepalive?: boolean | number;
  pc?: RTCPeerConnectionOptions;
}

class Connection extends TransactionManager {
  private readonly id: string;
  private readonly address: string;
  private readonly sessions: { [key: string]: Session };
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
  // @ts-ignore
  async close(): Promise<boolean> {
    if (this.websocketConnection.isOpened()) {
      return Promise.map(this.getSessionList(), session => session.cleanup())
        .then(() => this.websocketConnection.close())
        .then(() => this.emit('close'));
    }
    return true;
  }

  isClosed(): boolean {
    return this.websocketConnection.isClosed();
  }

  createSession(): Promise<Session> {
    return this.sendSync({ janus: 'create' }, this);
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

  send(message: { token: string; apisecret: string; transaction: string }): Promise<void> {
    if (this.options.token) {
      message.token = this.options.token;
    }

    if (this.options.apisecret) {
      message.apisecret = this.options.apisecret;
    }

    if (!message.transaction) {
      message.transaction = Transaction.generateRandomId();
    }

    return this.websocketConnection.send(message);
  }

  // @ts-ignore
  async processOutcomeMessage(message: JanusMessage): Promise<JanusMessage> {
    //@ts-ignore
    if ('create' === message.janus) {
      return this.onCreate(message);
    }

    //@ts-ignore
    let sessionId = message['session_id'];
    if (sessionId) {
      if (this.hasSession(sessionId)) {
        return this.getSession(sessionId).processOutcomeMessage(message);
      } else {
        throw new Error(`Invalid session: [${sessionId}]`);
      }
    }

    return message;
  }

  processIncomeMessage(msg: JanusMessage): Promise<any> {
    this.emit('message', msg);
    let sessionId = msg.get('session_id');

    if (sessionId && this.hasSession(sessionId)) {
      return this.getSession(sessionId).processIncomeMessage(msg);
    }

    return Promise.try(() => {
      if (sessionId && !this.hasSession(sessionId)) {
        throw new Error(`Invalid session: [${sessionId}]`);
      }

      return this.defaultProcessIncomeMessage(msg);
    });
  }

  toString() {
    return `[Connection] ${JSON.stringify({ id: this.id, address: this.address })}`;
  }

  //@ts-ignore
  private async onCreate(outMsg: JanusMessage): Promise<JanusMessage> {
    this.addTransaction(
      //@ts-ignore
      new Transaction(outMsg.transaction, (msg: JanusMessage) => {
        if ('success' === msg.get('janus')) {
          let sessionId = msg.get('data', 'id');
          this.addSession(new Session(this, sessionId, this.mediaDevices, this.webRTC));
          return this.getSession(sessionId);
        } else {
          throw new JanusError(msg);
        }
      })
    );

    return outMsg;
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
