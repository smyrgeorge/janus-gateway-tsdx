import Promise from 'bluebird';
import Transaction from './transaction';

/**
 * [Transactions] class is responsible to keep in track all the active transactions with Janus server.
 * Acts like a very simple transaction manager.
 */
class Transactions {
  // Keeps the active transactions.
  private readonly list = {};

  add(tx: Transaction) {
    if (this.has(tx.id)) throw new Error(`Transaction '${tx.id}' already exists.`);
    this.list[tx.id] = tx;
  }

  has(id: string): boolean {
    return id && this.list[id];
  }

  find(id: string): Transaction | null {
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
    delete this.list[id];
  }
}

export default Transactions;
