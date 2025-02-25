/**
 * 
 */
const util = require('util');

const app = require('./app');

(async () => {
  let plugin;
  try {
    const opt = getOptFromArgs();
    const pluginapi = opt && opt.pluginapi ? opt.pluginapi : 'ih-plugin-api';
    plugin = require(pluginapi + '/index.js')();
    plugin.log('Polling TCP plugin has started.', 0);

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

function getOptFromArgs() {
  let opt;
  try {
    opt = JSON.parse(process.argv[2]);
  } catch (e) {
    opt = {};
  }
  return opt;
}
