import JanusMessage from './message';

class JanusError extends Error {
  private readonly janusMessage: JanusMessage;
  private readonly code: any;

  constructor(message: JanusMessage) {
    super();

    this.name = this.constructor.name;
    this.janusMessage = message;

    let error = message.getError();
    this.message = error['reason'];
    this.code = error['code'];
  }

  getJanusMessage(): JanusMessage {
    return this.janusMessage;
  }

  getCode(): any {
    return this.code;
  }
}

export default JanusError;
