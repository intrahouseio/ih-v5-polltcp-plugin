/**
 * app.js
 */

const util = require('util');
const client = require('./client');

module.exports = async function(plugin) {
  const channels =  plugin.channels.data;
  const pooldelay = plugin.params.data.pooldelay || 1000; // таймер поллинга в мсек
  const timeout = plugin.params.data.timeout || 5000; // таймер поллинга в мсек

  let waiting = 0; // Содержит ts старта операции или 0
  let currentIdx = -1;

  client.init(plugin);
  await client.connect();
  plugin.log('Connected!');
  sendNext();

  async function sendNext() {
    if (waiting) {
      if (Date.now() - waiting > timeout) {
        // Переходить к следующему каналу или завершить с ошибкой таймаута 
        // - зависит от оборудования
        // Если канал один - смысла нет
        terminate();
      } else {
        setTimeout(sendNext, 100); // min interval?
      }
      return;
    }

    currentIdx += 1;
    if (currentIdx >= channels.length) currentIdx = 0;
  
    waiting = Date.now();
    await read(channels[currentIdx]);
    waiting = 0;
    setTimeout(sendNext, pooldelay);
  }

  /*  read
   *   Отправляет команду чтения на контроллер, ожидает результат
   *   Преобразует результат и отправляет данные на сервер {id, value}
   *
   */
  async function read(channelItem) {
    // console.log(' READ channelItem='+util.inspect(channelItem))
    try {
    
      if (!channelItem.req) {
        plugin.log('readOne Missing req:'+util.inspect(channelItem));
        return;
      } 
      plugin.log('readOne '+util.inspect(channelItem.req));
      
      const data = await client.readOne(channelItem.req);
      if (data) {
        const value = parse(data, channelItem);
        if (value != null) {
          let res = { id: channelItem.id, value, ts: Date.now() };
          plugin.log('sendData '+util.inspect(res))
          plugin.sendData([res]);
        }
      }
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
        plugin.log('LEN='+data.length)
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
