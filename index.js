/**
 * 
 */
const util = require('util');

const plugin = require('ih-plugin-api')();
const app = require('./app');

(async () => {
  plugin.log('Polling TCP plugin has started.', 0);

  try {
    // Получить параметры
    plugin.params.data = await plugin.params.get();
    plugin.log('Received params...', 1);

    plugin.channels.data = await plugin.channels.get();
    plugin.log('Received channels '+util.inspect(plugin.channels.data), 1);

    app(plugin);
  } catch (err) {
    plugin.exit(8, `Error: ${util.inspect(err)}`);
  }
})();