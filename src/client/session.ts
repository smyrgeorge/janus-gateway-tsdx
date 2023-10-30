import Promise from 'bluebird';
import TransactionManager from './tx/transaction-manager';
import JanusError from './misc/error';
import Timer from './misc/timer';
import Transaction from './tx/transaction';
import Plugin from './plugin';
import Connection from './connection';
import JanusMessage from './misc/message';
import { isNaturalNumber } from './misc/utils';
import { MediaDevices } from '../plugin/base/shims/definitions';
import { WebRTC } from '../plugin/base/shims/definitions';

class Session extends TransactionManager {
  private connection: Connection | null;
  private readonly id: string;
  private plugins: { [key: string]: Plugin };
  private keepAlivePeriod: number;
  private keepAliveTimer?: Timer | null;
  private readonly mediaDevices: MediaDevices;
  private readonly webRTC: WebRTC;

  constructor(connection: Connection, id: string, mediaDevices: MediaDevices, webRTC: WebRTC) {
    super();

    this.connection = connection;
    this.id = id;
    this.plugins = {};
    this.keepAlivePeriod = 30000;
    this.mediaDevices = mediaDevices;
    this.webRTC = webRTC;

    if (this.connection.getOptions().keepalive) {
      this.startKeepAlive();
    }

    connection.on('close', () => this._destroy());
  }

  getConnection(): Connection | null {
    return this.connection;
  }

  getId(): string {
    return this.id;
  }

  send(message: any): Promise<any> {
    if (!this.connection) {
      return Promise.reject(new Error(`Can not send message over destroyed ${this}.`));
    }

    message['session_id'] = this.id;
    if (this.keepAliveTimer) {
      this.keepAliveTimer.reset();
    }

    return this.connection.send(message);
  }

  attachPlugin(name: string): Promise<Plugin> {
    return this.sendSync({ janus: 'attach', plugin: name }, this);
  }

  destroy(): Promise<any> {
    return this.sendSync({ janus: 'destroy' }, this);
  }

  cleanup(): Promise<any> {
    return this._destroy();
  }

  hasPlugin(pluginId: string): boolean {
    return !!this.getPlugin(pluginId);
  }

  getPlugin(pluginId: string): Plugin {
    return this.plugins[pluginId];
  }

  getPluginList(): Plugin[] {
    return Object.keys(this.plugins).map(id => this.plugins[id]);
  }

  addPlugin(plugin: Plugin) {
    this.plugins[plugin.getId()] = plugin;
    plugin.once('detach', () => this.removePlugin(plugin.getId()));
  }

  removePlugin(pluginId: string) {
    delete this.plugins[pluginId];
  }

  processOutcomeMessage(message: any): Promise<any> {
    let janusMessage = message['janus'];
    if ('attach' === janusMessage) {
      return this.onAttach(message);
    }

    if ('destroy' === janusMessage) {
      return this.onDestroy(message);
    }

    let pluginId = message['handle_id'];
    if (pluginId) {
      if (this.hasPlugin(pluginId)) {
        return this.getPlugin(pluginId).processOutcomeMessage(message);
      } else {
        return Promise.reject(new Error(`Invalid plugin [${pluginId}].`));
      }
    }

    return Promise.resolve(message);
  }

  processIncomeMessage(msg: JanusMessage): Promise<any> {
    let pluginId = msg.get('handle_id') ?? msg.get('sender');
    if (pluginId && this.hasPlugin(pluginId)) {
      return this.getPlugin(pluginId).processIncomeMessage(msg);
    }

    return Promise.try(() => {
      if (pluginId && !this.hasPlugin(pluginId)) {
        throw new Error(`Invalid plugin [${pluginId}].`);
      }
      if ('timeout' === msg.get('janus')) {
        return this.onTimeout(msg);
      }
      return this.defaultProcessIncomeMessage(msg);
    })
      .then(() => this.emit('message', msg))
      .catch(error => this.emit('error', error));
  }

  toString() {
    return `[Session] ${JSON.stringify({ id: this.id })}`;
  }

  private startKeepAlive() {
    let keepAlive = this.connection?.getOptions().keepalive;

    //@ts-ignore
    if (keepAlive && isNaturalNumber(keepAlive) && keepAlive < 59000) {
      this.keepAlivePeriod = keepAlive as number;
    } else {
      this.keepAlivePeriod = 30000;
    }

    this.keepAliveTimer = new Timer(() => {
      this.send({ janus: 'keepalive' }).catch(error => {
        if (this.connection?.isClosed()) {
          this.stopKeepAlive();
        }
        throw error;
      });
    }, this.keepAlivePeriod);
    this.keepAliveTimer.start();
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer) {
      this.keepAliveTimer.stop();
      this.keepAliveTimer = null;
    }
  }

  private _destroy(): Promise<any> {
    if (!this.connection) {
      return Promise.resolve();
    }
    this.stopKeepAlive();
    return Promise.map(this.getPluginList(), plugin => plugin.cleanup()).finally(() => {
      this.plugins = {};
      this.connection = null;
      this.emit('destroy');
    });
  }

  //@ts-ignore
  private onTimeout(msg): Promise<any> {
    return this._destroy().return(msg);
  }
  //@ts-ignore
  private onDestroy(outMsg): Promise<any> {
    this.addTransaction(
      //@ts-ignore
      new Transaction(outMsg['transaction'], msg => {
        if ('success' === msg.get('janus')) {
          return this._destroy().return(msg);
        } else {
          throw new JanusError(msg);
        }
      })
    );
    return Promise.resolve(outMsg);
  }

  private onAttach(outMsg: any): Promise<any> {
    this.addTransaction(
      //@ts-ignore
      new Transaction(outMsg['transaction'], msg => {
        if ('success' === msg.get('janus')) {
          let pluginId = msg.get('data', 'id');
          this.addPlugin(Plugin.create(this, outMsg['plugin'], pluginId, this.mediaDevices, this.webRTC));
          return this.getPlugin(pluginId);
        } else {
          throw new JanusError(msg);
        }
      })
    );
    return Promise.resolve(outMsg);
  }
}

export default Session;
