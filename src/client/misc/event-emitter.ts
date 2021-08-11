import { EventEmitter2 } from 'eventemitter2';

class EventEmitter extends EventEmitter2 {
  constructor() {
    super({
      wildcard: true,
      delimiter: ':',
      newListener: false,
      maxListeners: 20,
    });
  }
}

export default EventEmitter;
