const HID = require("node-hid");

/**
 * Huion KD100 "driver".
 */
class HuionKeypad {

    constructor(log) {
        this.log = log || false;
        this.wheelDown = false;
        this.listeners = [];

        if (this.log) console.log(`[${new Date().toLocaleString()}] Loading devices...`);
        const HID = require("node-hid");
        HID.setDriverType("lib-usb");
        const devices = HID.devices();
        const KD100 = devices.filter(d => d.vendorId === HuionKeypad.VENDOR_ID && d.productId === HuionKeypad.PRODUCT_ID);

        if (this.log) console.log(`[${new Date().toLocaleString()}] Hooking device...`);
        KD100.forEach(kd100interface => {
            if (kd100interface.interface === HuionKeypad.BUTTON_INTERFACE) {
                // Button interface
                if (this.log) console.log(`[${new Date().toLocaleString()}] Registering button interface`);
                const deviceHandle = new HID.HID(kd100interface.path);
                deviceHandle.on('data', data => this.handleButton(this, data));
            } else if (kd100interface.interface === HuionKeypad.WHEEL_INTERFACE) {
                // Wheel interface
                if (this.log) console.log(`[${new Date().toLocaleString()}] Registering wheel interface`);
                const deviceHandle = new HID.HID(kd100interface.path);
                deviceHandle.on('data', data => this.handleWheel(this, data));
            }
        });
        if (this.log) console.log(`[${new Date().toLocaleString()}] Ready...`);
    }

    sendButtonPress(code) {
        this.listeners.forEach(listener => {
            if ((listener.code === code || listener.code === 'button') && listener.func) {
                listener.func(code);
            }
        });
    }

    sendWheelRoll(direction, power) {
        this.listeners.forEach(listener => {
            if (listener.code === 'wheel' && listener.func) {
                listener.func(direction, power);
            }
        })
    }

    sendWheelButton() {
        this.sendButtonPress(HuionKeypad.WHEEL_BUTTON);
    }

    handleWheel(p, data) {
        if (data[1] === 2) {
            p.wheelDown = true;
            p.sendWheelButton();
            if (p.log) console.log(`[${new Date().toLocaleString()}] Received wheel button input.`);
        } else if (data[2] === 0 && data[1] === 0 && p.wheelDown) {
            p.wheelDown = false;
        } else if (data[2] >= 1 || data[2] <= 255) { // Wheel even
            const direction = data[3] === 255 ? HuionKeypad.WHEEL_DIRECTION.COUNTER_CLOCKWISE : HuionKeypad.WHEEL_DIRECTION.CLOCKWISE;
            const power = direction === HuionKeypad.WHEEL_DIRECTION.COUNTER_CLOCKWISE ? 256 - data[2] : data[2];

            if (power >= 1) {
                if (p.log) console.log(`[${new Date().toLocaleString()}] Received wheel input: {WheelDir: ${direction} Power: ${power}}.`);
                p.sendWheelRoll(direction, power);
            }
        }
    }

    handleButton(p, data) {
        const btnData = (data[1] * 255) + data[2];

        if (btnData > 0) {
            if (p.log) console.log(`[${new Date().toLocaleString()}] Received button input: ${btnData}.`);
            p.sendButtonPress(btnData);
        }
    }

    on(ev, handler) {
        this.listeners.push({
            code: ev,
            func: handler
        })
    }

    onButton(code, handler) {
        this.on(code, handler);
    }

    onWheel(handler) {
        this.on('wheel', handler);
    }

    onMenu(handler) {
        this.onButton(HuionKeypad.WHEEL_BUTTON, handler);
    }

}

HuionKeypad.VENDOR_ID = 9580;
HuionKeypad.PRODUCT_ID = 109;
HuionKeypad.BUTTON_INTERFACE = 1;
HuionKeypad.WHEEL_INTERFACE = 2;
HuionKeypad.WHEEL_DIRECTION = {
    CLOCKWISE: 1,
    COUNTER_CLOCKWISE: -1
};
HuionKeypad.WHEEL_BUTTON = 765;
HuionKeypad.BUTTONS = {
    BTN_1: 1,
    BTN_2: 59670,
    BTN_3: 59415,
    BTN_4: 2055,
    BTN_5: 47,
    BTN_6: 48,
    BTN_7: 5,
    BTN_8: 8,
    BTN_9: 15,
    BTN_10: 262,
    BTN_11: 278,
    BTN_12: 1802,
    BTN_13: 255,
    BTN_14: 1020,
    BTN_15: 510,
    BTN_16: 277,
    VBTN: 1304,
    HBTN: 44
};

module.exports = HuionKeypad;