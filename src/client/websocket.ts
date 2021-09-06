import Promise from 'bluebird';
import EventEmitter from './misc/event-emitter';

class Websocket extends EventEmitter {
  // @ts-ignore
  private ws: WebSocket;

  open(address: string, protocol: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(address, protocol ?? '');

      this.ws.onerror = reject;
      this.ws.onclose = reject;
      this.ws.onopen = () => {
        this.ws.onerror = () => {};
        this.ws.onclose = () => {};
        this.onOpen(this.ws);
        resolve(this);
      };
    });
  }

  isOpened(): boolean {
    return this.ws && this.ws.OPEN === this.ws.readyState;
  }

  isClosed(): boolean {
    return !this.ws || this.ws.CLOSED === this.ws.readyState || this.ws.CLOSING === this.ws.readyState;
  }

  close(): Promise<any> {
    if (this.isClosed()) return Promise.resolve();
    return new Promise(resolve => {
      this._close();
      resolve();
    });
  }

  send(message: any): Promise<any> {
    if (this.isOpened()) {
      return this._send(message);
    } else if (!this.ws || this.ws.CONNECTING === this.ws.readyState) {
      return this.queue(message);
    } else {
      return Promise.reject(new Error('Can not send message over closed connection'));
    }
  }

  onMessage(message: any) {
    try {
      this.emit('message', message);
    } catch (error) {
      this.emit('error', error);
    }
  }

  private queue(message: any): Promise<any> {
    return new Promise(resolve => {
      this.once('open', () => this._send(message).then(() => resolve()));
    });
  }

  private _send(message: any): Promise<any> {
    return new Promise(resolve => {
      this.ws.send(JSON.stringify(message));
      resolve();
    });
  }

  private _close() {
    if (!this.isClosed()) {
      this.ws.close();
    }
    this.emit('close');
  }

  private initListeners() {
    this.ws.onmessage = msg => {
      let parsed = JSON.parse(msg.data as string);
      this.onMessage(parsed);
    };

    this.ws.onerror = error => this.emit('error', error);
    this.ws.onclose = () => this._close();
  }

  private onOpen(webSocket: WebSocket) {
    if (typeof webSocket.readyState !== 'undefined') {
      this.initListeners();
    } else {
      throw new Error('Trying to instantiate WebsocketConnection with unknown Websocket.');
    }

    this.emit('open');
  }
}

export default Websocket;
