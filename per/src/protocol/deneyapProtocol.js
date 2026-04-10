export const buildMotorCommand = ({ leftPwm, rightPwm, leftDirection, rightDirection }) => {
  return JSON.stringify({
    type: "motor",
    leftPwm,
    rightPwm,
    leftDirection,
    rightDirection,
  });
};

export const buildStopCommand = () => {
  return JSON.stringify({
    type: "motor",
    leftPwm: 0,
    rightPwm: 0,
    leftDirection: "stop",
    rightDirection: "stop",
  });
};

export const buildPinMapCommand = (motorPins) => {
  return JSON.stringify({
    type: "pin-map",
    motorPins,
  });
};

export const buildSensorReadCommand = (sensorKey) => {
  return JSON.stringify({
    type: "sensor-read",
    sensor: sensorKey,
  });
};

export const parseIncomingPayload = (message) => {
  try {
    return JSON.parse(message);
  } catch (_error) {
    return {
      type: "raw",
      payload: message,
    };
  }
};
