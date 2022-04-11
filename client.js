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
        this.plugin.log('data: ' + data.toString('hex'), 2);
        // this.plugin.log('data: ' + data.readFloatLE(0));
        this.conn.removeListener('data', listener);
        resolve(data);
      }

      this.conn.on('data', listener);
    });
  },

  close() {
    return new Promise((resolve, reject) => {
      this.conn.end(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

