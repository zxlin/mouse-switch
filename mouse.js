const EventEmitter = require('events');
const fs = require('fs');

/*
const CMD = {
  IMPS : new Buffer([ 243, 200, 243, 100, 243, 80 ]),
  IMEX : new Buffer([ 243, 200, 243, 200, 243, 80  ]),
};

const write = fs.createWriteStream(MICE_DEV);
*/

const BTN = {
  272 : 'BTN_LEFT',
  273 : 'BTN_RIGHT',
  274 : 'BTN_MIDDLE',
  275 : 'BTN_SIDE',
  276 : 'BTN_EXTRA',
};

class Mouse extends EventEmitter {
  constructor(dev) {
    super();

    const mouse = fs.createReadStream(dev);

    mouse.on('readable', () => {
      let chunk;
      while (null !== (chunk = mouse.read(16))) {
        const sec = chunk.slice(0, 4).readInt32LE();
        const microSec = chunk.slice(4, 8).readInt32LE();
        const type = chunk.slice(8, 10).readInt16LE();
        const code = chunk.slice(10, 12).readInt16LE();
        const value = chunk.slice(12, 16).readInt32LE();
        const data = {
          sec,
          microSec,
          type,
          code,
          value,
        };

        this.emit('data', data);

        if (type === 1) { // EV_KEY
          if (BTN[code]) {
            this.emit(`${BTN[code]}_${value === 0 ? 'DOWN' : 'UP'}`);
          }
        } else if (type === 2) {
          if (code === 8) { // REL_WHEEL - vertical
            if (value === 1) {
              this.emit('WHEEL_UP');
            } else if (value === -1) {
              this.emit('WHEEL_DOWN');
            }
          } else if (code === 6) { // REL_HWHEEL - horizontal
            if (value === 1) {
              this.emit('WHEEL_RIGHT');
            } else if (value === -1) {
              this.emit('WHEEL_LEFT');
            }
          }
        }
      }
    });
  }
}

module.exports = Mouse;

/*
const mouse = new Mouse(EVENT_DEV);

mouse.on('data', (e) => console.log(e));

mouse.on('BTN_LEFT_DOWN', () => console.log('left click'));
mouse.on('BTN_RIGHT_DOWN', () => console.log('right click'));
mouse.on('BTN_MIDDLE_DOWN', () => console.log('middle click'));
mouse.on('BTN_SIDE_DOWN', () => console.log('side down'));
mouse.on('BTN_EXTRA_DOWN', () => console.log('side up'));
mouse.on('WHEEL_UP', () => console.log('wheel UP'));
mouse.on('WHEEL_DOWN', () => console.log('wheel DOWN'));
mouse.on('WHEEL_RIGHT', () => console.log('wheel RIGHT'));
mouse.on('WHEEL_LEFT', () => console.log('wheel LEFT'));
*/
