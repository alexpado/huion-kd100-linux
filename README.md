## Huion KD100 on Linux using node-hid

This small project allows you to use your KD100 on linux. 

> **Note:** This does not map any button to an action, but allow just to read input from the KD100.

For usage example, simply check the `index.js` file.

### For this to work, you'll need to add a UDEV rules !

*You can read more on the original `node-hid` repository [here](https://github.com/node-hid/node-hid#udev-device-permissions).*

```
SUBSYSTEM=="usb",ATTRS{idVendor}=="256c",ATTRS{idProduct}=="006d",MODE="0666",GROUP="plugdev"
```