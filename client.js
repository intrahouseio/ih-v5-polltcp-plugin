/**
 * client.js
 * TCP клиент
 *
 */

// const util = require('util');
const net = require('net');

module.exports = {
  conn: null,
 
  init(plugin) {
    this.plugin = plugin;
  },


  connect() {
    const host = this.plugin.params.data.host;
    const port = Number(this.plugin.params.data.port);

    this.plugin.log('Try connect to ' + host + ':' + port);

    return new Promise((resolve, reject) => {
      this.conn = net.createConnection({ host, port }, err => {
        this.conn.on('end', () => {
          this.plugin.exit(1, 'disconnected');
        });

        this.conn.on('error', e => {
          this.conn.end();
          this.plugin.exit(1, 'Connection error:  ' + e.code);
        });

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  readOne(buf) {
    // console.log('readOne buf='+buf+' typeof buf='+typeof buf)
    return new Promise((resolve) => {
      this.conn.write(buf);

      const listener = data => {
        this.plugin.log('data: ' + data.toString('hex'));
        // this.plugin.log('data: ' + data.readFloatLE(0));
        this.conn.removeListener('data', listener);
        resolve(data);
      }

      this.conn.on('data', listener);
    });
  },

  close() {
    return new Promise((resolve, reject) => {
      this.conn.dropConnection(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

/*
module.exports = {
  
  start(plugin, params) {
    this.plugin = plugin;
    this.params = params;
    plugin.log('Params: ' + JSON.stringify(params));

    this.host = params.host;
    this.port = params.port;
    this.timeout = params.timeout * 1000;
    this.polling = params.polling * 1000;

    this.lastts = Date.now();

    this.client = net.createConnection({ host: params.host, port: params.port }, () => {
      plugin.log('Connected ' + params.host + ':' + params.port);
     
      this.sendToUnit();
    });

    setInterval(this.sendToUnit.bind(this), this.polling);
    setInterval(this.checkResponse.bind(this), this.timeout);

    this.client.on('end', () => {
      plugin.exit(100, 'Host disconnected!');
    });

    this.client.on('error', e => {
      plugin.exit(100, 'Connection error ' + util.inspect(e));
    });

    this.client.on('data', buf => {
      plugin.log( buf);
      this.lastts = Date.now();

      try {
        this.plugin.log("<= " + util.inspect(buf));
        const data = this.processIncoming(buf);
       
   
        if (data.length > 0) this.plugin.sendData(data);
      } catch (e) {
        this.plugin.log(e.message);
      }
    });
  },

  
  sendToUnit() {
      const buf = "W0GX";
      this.client.write(buf);
      this.plugin.log("=> " + buf.toString("hex"));
  },

  processIncoming(buffer) {
    
    // Входящее сообщение д б длиной 4 байта
   
    // const plugin = this.plugin;
    const value = Math.round(buffer.readFloatLE(0)*1000)/1000;
    // Округлить до 3 знаков, иначе длинный хвост

    return [{ id: 'W_POLL', value, ts: Date.now() }];
  },

  checkResponse() {
    // this.plugin.log(`checkResponse ${Date.now() - this.lastts} timeout=${this.timeout}`);

    if (Date.now() - this.lastts > this.timeout) {
      // мсек
      this.plugin.log('TIMEOUT');
      this.plugin.exit(100, "'Timeout error!");
    }
  },

  end() {
    if (this.client) this.client.end();
  }
};

*/
