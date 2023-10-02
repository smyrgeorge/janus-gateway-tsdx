import Promise from 'bluebird';
import EventEmitter from './misc/event-emitter';

class Websocket extends EventEmitter {
  // @ts-ignore
  private ws: WebSocket;

  open(address: string, protocol: string): Promise<Websocket> {
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

  close(): Promise<void> {
    if (this.isClosed()) return Promise.resolve();
    return new Promise(resolve => {
      this.onClose();
      resolve();
    });
  }

  send(message: any): Promise<void> {
    if (this.isOpened()) {
      return this.onSend(message);
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

  private queue(message: any): Promise<void> {
    return new Promise(resolve => {
      this.once('open', () => this.onSend(message).then(() => resolve()));
    });
  }

  private onSend(message: any): Promise<void> {
    return new Promise(resolve => {
      this.ws.send(JSON.stringify(message));
      resolve();
    });
  }

  private onClose() {
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
    this.ws.onclose = () => this.onClose();
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
