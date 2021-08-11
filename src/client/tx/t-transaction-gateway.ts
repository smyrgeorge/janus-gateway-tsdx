import Promise from 'bluebird';
import JanusError from '../misc/error';
import Transaction from './transaction';
import Transactions from './transactions';
import JanusMessage from '../misc/message';
import EventEmitter from '../misc/event-emitter';

class TTransactionGateway extends EventEmitter {
  private readonly transactions: Transactions = new Transactions();

  getTransactions(): Transactions {
    return this.transactions;
  }

  addTransaction(tx: Transaction) {
    this.getTransactions().add(tx);
  }

  sendSync(msg: any): Promise<any> {
    if (!msg['transaction']) {
      msg['transaction'] = Transaction.generateRandomId();
    }

    // TODO: fix this
    let self: any = this;
    return self
      .processOutcomeMessage(msg)
      .then(message => self.send(message))
      .then(result => {
        let transaction = this.transactions.find(msg['transaction']);
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

export default TTransactionGateway;
