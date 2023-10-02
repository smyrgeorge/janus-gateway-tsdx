import Promise from 'bluebird';

class Transaction {
  readonly id: string;
  private readonly promise: Promise<any>;
  private isExecuted: boolean;
  private callback: Function;

  constructor(id: string, callback: Function, timeout: number = 30000) {
    this.id = id;
    this.callback = () => undefined;
    //@ts-ignore
    let timeoutRejection;

    this.promise = new Promise((resolve, reject) => {
      //@ts-ignore
      this.callback = message => {
        //@ts-ignore
        clearTimeout(timeoutRejection);

        let result;
        try {
          result = callback(message);
        } catch (error) {
          result = Promise.reject(error);
        }

        if (!(result instanceof Promise)) {
          result = Promise.resolve(result);
        }

        result.then(resolve, reject);
      };

      timeoutRejection = setTimeout(() => reject(new Error(`Transaction timeout ${this.id}.`)), timeout);
    });

    this.isExecuted = false;
  }

  static generateRandomId(): string {
    return Math.random()
      .toString(36)
      .substring(2, 12);
  }

  //@ts-ignore
  execute(message): Promise<any> {
    if (!this.isExecuted) {
      this.isExecuted = true;
      this.callback(message);
    }
    return this.promise;
  }

  getPromise(): Promise<any> {
    return this.promise;
  }
}

export default Transaction;
