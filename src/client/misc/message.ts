class JanusMessage {
  private readonly plainMessage: any;

  constructor(plainMessage: any) {
    this.plainMessage = plainMessage;
  }

  getPlainMessage(): any {
    return this.plainMessage;
  }

  getError(): any {
    return this.get('error');
  }
  //@ts-ignore
  get(name, ...names: string[]): any {
    let result = this.plainMessage[name];

    for (const item of names) {
      if (result) result = result[item];
      else break;
    }

    return result ?? null;
  }
}

export default JanusMessage;
