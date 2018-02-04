const EventEmitter = require('events');
const net = require('net');
const _ = require('lodash');

const DEFAULT_DURATION = 300;

class Yeelight extends EventEmitter {
  constructor(ip, port = 55443) {
    super();
    this.ip = ip;
    this.port = port;
    this.state = {};

    this.counter = 1;
    this.connect();


    process.on('exit', () => {
      this.client.end();
    });
  }

  connect() {
    this.client = new net.Socket();
    this.client
      .setKeepAlive(true)
      .connect(this.port, this.ip, () => this.getState())
      .on('data', (data) => {
        let json;
        try {
          json = JSON.parse(data.toString());
        } catch (e) {
          json = {};
        }
        const { id, result, error } = json;
        if (id) {
          this.emit(`req${id}`, result);
        }
        if (error) {
          console.error(id, error);
        }
      })
      .on('error', (error) => {
        if (error.code === 'ECONNRESET') {
          setTimeout(() => this.connect(), 1000 * 5); // try connecting again after 5 seconds
        } else {
          console.error(this.ip, error);
          process.exit(1);
        }
      })
      .on('close', () => {
        clearInterval(this._interval);
      })
    ;

    this._interval = setInterval(() => this.getState(), 1000 * 30);
  }

  getCounter() {
    if (this.counter > 10000) {
      this.counter = 1;
    }
    return this.counter++;
  }

  async send(method, ...params) {
    const id = this.getCounter();
    const cmd = { id, method, params };
    this.client.write(`${JSON.stringify(cmd)}\r\n`);
    return await new Promise((resolve) => this.once(`req${id}`, (result) => resolve(result)));
  }

  setScene(prop, ...params) {
    if (prop === 'color') {
      const [ rgb, bright ] = params;
      this.state.rgb = rgb;
      this.state.bright = bright;
    } else if (prop === 'hsv') {
      const [ hue, sat, bright ] = params;
      this.state.hue = hue;
      this.state.sat = sat;
      this.state.bright = bright;
    } else if (prop === 'ct') {
      const [ colorTemperature, bright ] = params;
      this.state.colorTemperature = colorTemperature;
      this.state.bright = bright
    }
    this.state.power = 'on';
    return this.send('set_scene', prop, ...params);
  }

  async getState() {
    const result = await this.send('get_prop', 'power', 'bright', 'ct', 'rgb', 'hue', 'sat', 'color_mode');
    const [ power, bright, colorTemperature, rgb, hue, sat, colorMode ] = result;

    const stats = {
      power,
      bright : Number(bright),
      colorTemperature : Number(colorTemperature),
      rgb : Number(rgb),
      hue : Number(hue),
      sat : Number(sat),
      colorMode,
    };
    this.state = stats;
  }

  setColorTemperature(ct, effect = 'smooth', duration = DEFAULT_DURATION) {
    this.state.colorTemperature = ct;
    return this.send('set_ct_abx', ct, effect, duration);
  }

  setRGB(rgb, effect, duration = DEFAULT_DURATION) {
    this.state.rgb = rgb;
    return this.send('set_rg', rgb, effect, duration);
  }

  setHSV(hue, sat, effect = 'smooth', duration = DEFAULT_DURATION) {
    this.state.hue = hue;
    this.state.sat = sat;
    return this.send('set_hsv', hue, sat, effect, duration);
  }

  setBright(bright, effect = 'smooth', duration = DEFAULT_DURATION) {
    const num = Number(bright)
    const value = Math.max(1, Math.min(100, _.isNaN(num) ? 100 : num))
    this.state.bright = value;
    return this.send('set_bright', value, effect, duration);
  }

  setPower(toggle, effect = 'smooth', duration = DEFAULT_DURATION) {
    const value = toggle ? 'on' : 'off'
    this.state.power = value;
    return this.send('set_power', value, effect, duration);
  }

  toggle() {
    this.state.power = this.state.power === 'on' ? 'off' : 'on';
    return this.send('toggle');
  }

  adjust(action, prop) {
    // action = [ 'increase', 'decrease', 'circle' ]
    // prop = [ 'bright', 'ct', 'color' ]
    return this.send('set_adjust', action, prop);
  }
}

module.exports = Yeelight;
