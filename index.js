const HuionKeypad = require('./HuionKD100.js');
const driver = new HuionKeypad();

driver.on('button', code => {
    console.log(`You pressed the button with code ${code}.`);
});

driver.onWheel((direction, power) => {
    if (direction === HuionKeypad.WHEEL_DIRECTION.CLOCKWISE) {
        console.log(`You turn the wheel clockwise with a power of ${power}.`);
    } else {
        console.log(`You turn the wheel counter-clockwise with a power of ${power}.`);
    }
});

driver.onMenu(() => {
    console.log('You pressed the wheel button.');
});