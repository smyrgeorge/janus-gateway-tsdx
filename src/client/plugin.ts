import Promise from 'bluebird'
import JanusError from './misc/error'
import TTransactionGateway from './tx/t-transaction-gateway'
import Transaction from './tx/transaction'
import JanusPluginMessage from './misc/plugin-message'
import Session from './session'
import JanusMessage from './misc/message'
import {MediaDevices} from '../plugin/base/shims/media-devices-shim'
import {WebRTC} from '../plugin/base/shims/webrtc-shim'

class Plugin extends TTransactionGateway {

  private static types = {}
  private session: Session | null
  private readonly name: string
  private readonly id: string

  constructor(session: Session, name: string, id: string) {
    super()
    this.session = session
    this.name = name
    this.id = id

    session.on('destroy', () => this._detach())
  }

  static create(session: Session, name: string, id: string, mediaDevices: MediaDevices, webRTC: WebRTC): Plugin {
    let aClass = Plugin.types[name]
    if (aClass) return new aClass(session, name, id, mediaDevices, webRTC)
    return new Plugin(session, name, id)
  }

  static register(name: string, aClass) {
    this.types[name] = aClass
  }

  getSession(): Session | null {
    return this.session
  }

  getId(): string {
    return this.id
  }

  getName(): string {
    return this.name
  }

  getResponseAlias(): string {
    throw new Error('Plugin.getResponseAlias must be implemented.')
  }

  send(msg: any): Promise<any> {
    msg['handle_id'] = this.id
    if (this.session) {
      return this.session.send(msg)
    } else {
      return Promise.reject(new Error('No active session.'))
    }
  }

  detach(): Promise<any> {
    if (this.session) {
      return new Promise((resolve, reject) => {
        this.once('detach', resolve)
        this.sendWithTransaction({janus: 'detach'}).catch(reject)
      })
    }
    return Promise.resolve()
  }

  cleanup(): Promise<any> {
    return this._detach()
  }

  processOutcomeMessage(msg: any): Promise<any> {
    return Promise.resolve(msg)
  }

  processIncomeMessage(msg: JanusMessage): Promise<any> {
    return Promise
      .try(() => {
        msg = new JanusPluginMessage(msg.getPlainMessage(), this)
        if ('detached' === msg.get('janus')) {
          return this._onDetached()
        }
        return this.defaultProcessIncomeMessage(msg)
      })
      .then(() => this.emit('message', msg))
      .catch(error => this.emit('error', error))
  }

  _detach(): Promise<any> {
    if (this.session) {
      this.session = null
      this.emit('detach')
    }
    return Promise.resolve()
  }

  toString() {
    return `Plugin${JSON.stringify({id: this.id, name: this.name})}`
  }

  sendWithTransaction(options: any): Promise<any> {
    let transactionId = Transaction.generateRandomId()
    let transaction = new Transaction(transactionId, msg => {
      let errorMessage = msg.getError()
      if (!errorMessage) {
        return Promise.resolve(msg)
      }
      let error = new JanusError(msg)
      return Promise.reject(error)
    })

    let message = Object.assign({janus: 'message', transaction: transactionId}, options)
    this.addTransaction(transaction)
    let sendPromise = this.sendSync(message)

    return new Promise((resolve, reject) => {
      transaction.getPromise().catch(e => reject(e))
      sendPromise.then(r => resolve(r)).catch(e => reject(e))
    })
  }

  private _onDetached(): Promise<any> {
    return this._detach()
  }
}

export default Plugin
