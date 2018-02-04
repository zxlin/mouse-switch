const _ = require('lodash');
const Mouse = require('./mouse');
const Yeelight = require('./yeelight');
const DEVICES = require('./devices');

const EVENT_DEV = '/dev/input/event0';

const mouse = new Mouse(EVENT_DEV);

const LIGHTS = {
  FLOOR_LAMP : new Yeelight(DEVICES.FLOOR_LAMP),
  BED : new Yeelight(DEVICES.BED),
  FLOOR_RIGHT : new Yeelight(DEVICES.FLOOR_RIGHT),
  FLOOR_LEFT : new Yeelight(DEVICES.FLOOR_LEFT),
  LAMP : new Yeelight(DEVICES.LAMP),
}

function printState() {
  _.each(LIGHTS, (light, name) => {
    console.log(name, light.state);
  });
}

function turnOffAll(omit) {
  _.each(_.omit(LIGHTS, omit), (light) => light.setPower(false));
}

const SCENES = {
  DIM_WARM() {
    turnOffAll([ 'BED', 'FLOOR_LEFT', 'FLOOR_RIGHT' ]);
    LIGHTS.BED.setScene('ct', 4000, 1);
    LIGHTS.FLOOR_LEFT.setScene('ct', 2433, 10);
    LIGHTS.FLOOR_RIGHT.setScene('ct', 2433, 10);
  },
  FULL_WARM() {
    LIGHTS.FLOOR_LAMP.setScene('ct', 2741, 100);
    LIGHTS.FLOOR_RIGHT.setScene('ct', 2544, 100);
    LIGHTS.FLOOR_LEFT.setScene('ct', 2544, 100);
    LIGHTS.BED.setScene('ct', 2957, 100);
    LIGHTS.LAMP.setScene('ct', 3030, 100);
  },
  DAYLIGHT() {
    LIGHTS.FLOOR_LAMP.setScene('ct', 4955, 100);
    LIGHTS.FLOOR_LEFT.setScene('ct', 4474, 100);
    LIGHTS.FLOOR_RIGHT.setScene('ct', 4474, 100);
    LIGHTS.BED.setScene('ct', 5563, 100);
    LIGHTS.LAMP.setScene('ct', 4000, 100);
  },
  LAMP() {
    turnOffAll('LAMP');
    LIGHTS.LAMP.setScene('ct', 2911, 100);
  }
}

mouse.on('BTN_LEFT_DOWN', () => {});

mouse.on('WHEEL_DOWN', () => {
  if (LIGHTS.FLOOR_LAMP.state.power === 'off') {
    LIGHTS.FLOOR_LAMP.setScene('ct', 4955, 100);
  }
});

mouse.on('WHEEL_UP', () => {
  if (LIGHTS.FLOOR_LAMP.state.power === 'on') {
    turnOffAll();
  }
});

mouse.on('BTN_RIGHT_DOWN', () => SCENES.DAYLIGHT());
mouse.on('WHEEL_RIGHT', () => SCENES.LAMP());
mouse.on('BTN_SIDE_DOWN', () => SCENES.FULL_WARM());
mouse.on('BTN_EXTRA_DOWN', () => SCENES.DIM_WARM());