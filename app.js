/**
 * app.js
 */

const util = require('util');
const client = require('./client');

module.exports = async function(plugin) {
  const channels = plugin.channels.data;
  const pooldelay = plugin.params.data.pooldelay || 1000; // таймер поллинга в мсек
  const timeout = plugin.params.data.timeout || 5000; // в мсек

  client.init(plugin);
  await client.connect();
  plugin.log('Connected!');

  let currentIdx = -1;
  sendNext();

  function sendNext() {
    currentIdx += 1;
    if (currentIdx >= channels.length) currentIdx = 0;
    read(channels[currentIdx]);
    setTimeout(sendNext, pooldelay);
  }

  /*  read
   *   Отправляет команду чтения на контроллер, ожидает результат
   *   Преобразует результат и отправляет данные на сервер {id, value}
   *
   */
function read(channelItem) {
    // console.log(' READ channelItem='+util.inspect(channelItem))
    try {
      if (!channelItem.req) {
        plugin.log('readOne Missing req:' + util.inspect(channelItem));
        return;
      }
      plugin.log('readOne ' + util.inspect(channelItem.req), 2);

      let timeReject;
      const promise1 = client.readOne(channelItem.req);

      const promise2 = new Promise((resolve, reject) => {
        timeReject = setTimeout(reject, timeout, 'Timeout');
      });

      Promise.race([promise1, promise2])
      .then(data => {
        clearTimeout(timeReject);
        // plugin.log('Promise resolved data '+util.inspect(data))
        if (data) {
          const value = parse(data, channelItem);
          if (value != null) {
            let res = { id: channelItem.id, value, ts: Date.now() };
            plugin.log('sendData ' + util.inspect(res), 2);
            plugin.sendData([res]);
          }
        }
      })
      .catch (e => {
        // Ошибка чтения или таймаута
        client.close();
        plugin.exit(100, util.inspect(e));
      });
    } catch (e) {
      plugin.log('Read error: ' + util.inspect(e));
    }
  }

  function parse(data, channelItem) {
    switch (channelItem.vartype) {
      case 'int8':
        return data.readInt8(0);

      case 'uint8':
        return data.readUInt8(0);

      case 'int16':
        return data.length >= 2 ? data.readInt16LE(0) : null;

      case 'uint16':
        return data.length >= 2 ? data.readUInt16LE(0) : null;

      case 'int32':
        return data.length >= 4 ? data.readInt32LE(0) : null;

      case 'uint32':
        return data.length >= 4 ? data.readUInt32LE(0) : null;

      case 'float':
        if (data.length != 4) plugin.log('Invalid LEN=' + data.length);
        return data.length >= 4 ? data.readFloatLE(0) : null;

      case 'string':
        return data.toString('utf8', 0);
      default:
        return null;
    }
  }

  function terminate() {
    client.close();
    console.log('TERMINATE PLUGIN');
    // Здесь закрыть все что нужно
  }
};
