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
            } else if (kd100interface.interface === HuionKeypad.GROUPED_INTERFACE) {
                if (this.log) console.log(`[${new Date().toLocaleString()}] Registering grouped interface`);
                const deviceHandle = new HID.HID(kd100interface.path);
                deviceHandle.on('data', data => this.handleRaw(this, data))
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

    handleRaw(p, data) {
        if (p.log) console.log(`[${new Date().toLocaleString()}] Arbitrary interface Data`, data);
        const evType = data[1];

        if (evType === HuionKeypad.RAW.EVENT_TYPE.BUTTON) {
            const val = data[6] + (data[5] * 255) + (data[4] * 65025);
            if (val > 0) {
                this.sendButtonPress(HuionKeypad.RAW.BUTTONS_MAP[val]);
            }
        } else if (evType === HuionKeypad.RAW.EVENT_TYPE.WHEEL) {
            this.sendWheelRoll(HuionKeypad.RAW.WHEEL_MAP[data[5]], 1);
        }

    }

    handleWheel(p, data) {
        if (data[1] === 2) {
            p.wheelDown = true;
            p.sendWheelButton();
            if (p.log) console.log(`[${new Date().toLocaleString()}] Received wheel button input.`);
        } else if (data[2] === 0 && data[1] === 0 && p.wheelDown) {
            p.wheelDown = false;
        } else if (data[2] >= 1 || data[2] <= 255) { // Wheel event
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
HuionKeypad.GROUPED_INTERFACE = 0;
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

HuionKeypad.RAW = {
    EVENT_TYPE: {
        BUTTON: 224,
        WHEEL: 241
    },
    WHEEL_MAP: {
        "1": HuionKeypad.WHEEL_DIRECTION.CLOCKWISE,
        "2": HuionKeypad.WHEEL_DIRECTION.COUNTER_CLOCKWISE
    },
    BUTTONS_MAP: {
        "65025": HuionKeypad.BUTTONS.BTN_1,
        "130050": HuionKeypad.BUTTONS.BTN_2,
        "260100": HuionKeypad.BUTTONS.BTN_3,
        "520200": HuionKeypad.BUTTONS.BTN_4,
        "1040400": HuionKeypad.BUTTONS.BTN_5,
        "2080800": HuionKeypad.BUTTONS.BTN_6,
        "4161600": HuionKeypad.BUTTONS.BTN_7,
        "8323200": HuionKeypad.BUTTONS.BTN_8,
        "255": HuionKeypad.BUTTONS.BTN_9,
        "510": HuionKeypad.BUTTONS.BTN_10,
        "1020": HuionKeypad.BUTTONS.BTN_11,
        "2040": HuionKeypad.BUTTONS.BTN_12,
        "4080": HuionKeypad.BUTTONS.BTN_13,
        "8160": HuionKeypad.BUTTONS.BTN_14,
        "16320": HuionKeypad.BUTTONS.BTN_15,
        "2": HuionKeypad.BUTTONS.BTN_16,
        "32640": HuionKeypad.BUTTONS.VBTN,
        "1": HuionKeypad.BUTTONS.HBTN,
        "4": HuionKeypad.WHEEL_BUTTON,
    }
}

module.exports = HuionKeypad;