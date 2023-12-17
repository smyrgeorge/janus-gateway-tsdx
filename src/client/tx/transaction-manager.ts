import Promise from 'bluebird';
import JanusError from '../misc/error';
import Transaction from './transaction';
import JanusMessage from '../misc/message';
import EventEmitter from '../misc/event-emitter';
import Plugin from '../plugin';
import Session from '../session';
import Connection from '../connection';

/**
 * [TransactionManager] class is responsible to keep in track all the active transactions with Janus server.
 * Provides methods to:
 *  - retrieve active transactions
 *  - execute transactions
 */
class TransactionManager extends EventEmitter {
  private readonly transactions: Transactions = new Transactions();

  getTransactions(): Transactions {
    return this.transactions;
  }

  addTransaction(tx: Transaction) {
    this.getTransactions().add(tx);
  }

  sendSync<T>(msg: any, executor: Session | Connection | Plugin): Promise<T> {
    if (!msg.transaction) {
      msg.transaction = Transaction.generateRandomId();
    }

    return executor
      .processOutcomeMessage(msg)
      .then(message => executor.send(message))
      .then(result => {
        let transaction = this.transactions.find(msg.transaction);
        if (transaction) {
          return transaction.getPromise();
        }
        return result;
      });
  }

  hasTransaction(msg: JanusMessage): boolean {
    return this.getTransactions().has(msg.get('transaction'));
  }

  executeTransaction(msg: JanusMessage): Promise<any> {
    return this.getTransactions().execute(msg.get('transaction'), msg);
  }

  defaultProcessIncomeMessage(msg: JanusMessage): Promise<any> | undefined {
    if (this.hasTransaction(msg)) {
      return this.executeTransaction(msg);
    } else {
      if (msg.getError()) {
        return Promise.reject(new JanusError(msg));
      }
    }

    return undefined;
  }
}

class Transactions {
  // Keeps the active transactions.
  private readonly list = {};

  add(tx: Transaction) {
    if (this.has(tx.id)) throw new Error(`Transaction '${tx.id}' already exists.`);
    //@ts-ignore
    this.list[tx.id] = tx;
  }

  has(id: string): boolean {
    //@ts-ignore
    return id && this.list[id];
  }

  find(id: string): Transaction | null {
    //@ts-ignore
    return this.list[id] ?? null;
  }

  execute(id: string, message: any): Promise<any> {
    let tx = this.find(id);
    if (!tx) throw new Error(`Transaction '${id}' not found.`);
    if ('ack' !== message['janus']) {
      this.remove(id);
      return tx.execute(message);
    }
    return Promise.resolve(message);
  }

  remove(id: string) {
    if (!this.has(id)) throw new Error(`Transaction '${id}' doesn't exist.`);
    //@ts-ignore
    delete this.list[id];
  }
}

export default TransactionManager;
