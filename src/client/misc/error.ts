import JanusMessage from './message'

class JanusError extends Error {
  // @ts-ignore
  private janusMessage: JanusMessage
  // @ts-ignore
  private code: any

  constructor(message: JanusMessage) {
    super();

    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.janusMessage = message;

    let error = message.getError();
    this.message = error['reason'];
    this.code = error['code'];
  }
}

export default JanusError;
