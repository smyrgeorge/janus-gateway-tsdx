import JanusMessage from './message';
import Plugin from '../plugin';

class JanusPluginMessage extends JanusMessage {
  private plugin: Plugin;

  constructor(plainMessage: any, plugin: Plugin) {
    super(plainMessage);
    this.plugin = plugin;
  }

  getPluginData(...names: string[]): any | null {
    return this.get('plugindata', ...['data', ...names]);
  }

  getError(): any {
    let error = this.getPluginData('error');

    if (error) {
      return {
        reason: error,
        code: this.getPluginData('error_code'),
      };
    }

    return super.getError();
  }

  getResultText(): string {
    return this.getPluginData(this.plugin.getResponseAlias());
  }
}

export default JanusPluginMessage;
