// Created by Andrew DeVries, Digital Example LLC move to path + address to allow multiple i2c slaves

//Sugested this be run with Debug enabled so can view Bone debug
//sudo DEBUG=bone node testBone.js


var boneScript;
   
try {
    //diable autoload of cape in octalbone until issue 
    //process.env['AUTO_LOAD_CAPE'] = '0';
     //boneScript = require('bonescript');
    boneScript = require('octalbonescript');
    boneScript.getPlatform(function (err, x) {
        console.log('bonescript getPlatform');
        console.log('platform = ' + x.name);
        console.log('version = ' + x.version);
        console.log('serialNumber = ' + x.serialNumber);
        console.log('dogtag = ' + x.dogtag);
        //console.log('x', x);
    });

    //Adafruit LED Backpack 7 Segment Registers
    var HT16K33_BLINK_CMD = 0x80;
    var HT16K33_BLINK_DISPLAYON = 0x01;
    var HT16K33_BLINK_OFF = 0;
    var HT16K33_BLINK_2HZ = 1;
    var HT16K33_BLINK_1HZ = 2;
    var HT16K33_BLINK_HALFHZ = 3;
    var HT16K33_CMD_BRIGHTNESS = 0xE0;
    var HT16K33_CMD_SYSTEM = 0x20;
    var buffer = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var digits = [
        0x3F, //0
        0x06, //1
        0x5B, //2
        0x4F, //3
        0x66, //4
        0x6D, //5
        0x7D, //6
        0x07, //7
        0x7F, //8
        0x6F, //9
        0x77, //A
        0x7C, //B
        0x39, //C
        0x5E, //D
        0x79, //E
        0x71, //F
        0x00  //blank
    ];


    
    //Method to open i2c backpacks and write 00:00 to the diplays so you know they are connected correctly
    var testI2cOpen = function (i2cDevice, i2cAddress, Callback) {

        boneScript.i2c.open(i2cDevice, i2cAddress,
            function () {
                //Not realy used not sure why it is needed
                console.log('bonescript i2c.open handler');
            },
            function (err, port) {

                if (err) {
                    debug('bonescript i2c.open error %', err);
                    console.log('bonescript i2c.open Error');
                    console.dir(err, { depth: null });
                    debug('bonescript i2c.open error %s', err);
                    if (Callback) {
                        Callback(err, null);
                    }
                } else {
                    //i2cdevice = port;
                    console.log('bonescript i2c.open success ', port);
                    // Turn on the LED Ocillator
                    //port.setAddress(objOptions.I2CAddress);
                    port.writeBytes(HT16K33_CMD_SYSTEM | HT16K33_BLINK_DISPLAYON, [0x00],
                        function (err) {
                            if (err) {
                                console.log('Error in init DisplayOn %s', err);
                                if (Callback) {
                                    Callback(err, null);
                                }
                            } else {
                                console.log('ocillator enabled ' + i2cAddress + " device " + i2cDevice);
                                //i2cdevice.setAddress(objOptions.I2CAddress);
                                port.writeBytes(HT16K33_BLINK_CMD | 0x01, [0x00], function (err) {
                                    if (err) {
                                        console.log('Error in init setBlinkRate %s', err);
                                        if (Callback) {
                                            Callback(err, null);
                                        }
                                    } else {
                                        console.log('display enabled ' + i2cAddress + " device " + i2cDevice);
                                        //i2cdevice.setAddress(objOptions.I2CAddress);
                                        port.writeBytes(HT16K33_CMD_BRIGHTNESS | 15, [0x00], function (err) {
                                            if (err) {
                                                console.log('Error in init setBrightness %s', err);
                                            } else {
                                                console.log('Brightness set to high ' + i2cAddress + " device " + i2cDevice);
                                                //i2cdevice.setAddress(objOptions.I2CAddress);
                                                port.writeBytes([0x00], [digits[0], 0x00, digits[0], 0x00, 0x00, 0x00, digits[0], 0x00, digits[0], 0x00], function (err) {
                                                    if (err) {
                                                        console.log('Error in write zeros ' + i2cAddress + " device " + i2cDevice, err);
                                                    } else {
                                                        console.log('wrote zeros ' + i2cAddress + " device " + i2cDevice);
                                                    }
                                                });
                                                if (Callback) {
                                                    Callback(err, port);
                                                }
                                            }
                                        }); // setBrightness
                                    }
                                }); // setBlinkRate
                            }
                        }); //WriteData    // oscillator on

                }
            },
            function (err, port) {
                console.log('bonescript adafruitLedBackpack i2c.open');

            }
        ); // boneScript i2c Open
    }



    //Now Test multiple i2c devices same port  using 2 adafruit i2c LED 7 segment displays via the adafruit LEDBacpack HT16K33
    //https://www.adafruit.com/products/879
    //
    var LedI2cDevicePath = '/dev/i2c-1';
    var LedI2cAddress1 = '0x70';
    var LedI2cAddress2 = '0x71';
    var LedI2cAddress3 = '0x72';


    // Open and write 1234 to LED Backpack 1
    var LedI2cBackpack1;
    testI2cOpen(LedI2cDevicePath, LedI2cAddress1, function (err, i2cPort) {
        if (err) {
            console.log(' LedI2cBackpack1 errored ' + err);
        } else {
            console.log(' LedI2cBackpack1 success ');
            LedI2cBackpack1 = i2cPort;
            LedI2cBackpack1.writeBytes([0x00], [digits[1], 0x00, digits[1], 0x00, 0x02, 0x00, digits[1], 0x00, digits[1], 0x00], function (err) {
                if (err) {
                    console.log('LedI2cBackpack1 Error in write 11:11', err);
                } else {
                    console.log('LedI2cBackpack1 wrote 11:11 ', LedI2cBackpack1);
                }
            });
        }

    });

    // Open and write 1234 to LED Backpack 1
    var LedI2cBackpack2;
    testI2cOpen(LedI2cDevicePath, LedI2cAddress2, function (err, i2cPort) {
        if (err) {
            console.log(' LedI2cBackpack2 errored ' + err);
        } else {
            console.log(' LedI2cBackpack2 success ');
            LedI2cBackpack2 = i2cPort;
            LedI2cBackpack2.writeBytes([0x00], [digits[2], 0x00, digits[2], 0x00, 0x02, 0x00, digits[2], 0x00, digits[2], 0x00], function (err) {
                if (err) {
                    console.log('LedI2cBackpack2 Error in write 22:22', err);
                } else {
                    console.log('LedI2cBackpack2 wrote 22:22 ', LedI2cBackpack2);
                }
                // Another way to reuse the device but change address on the return but this will causes issues
                // LedI2cBackpack2.address = LedI2cAddress1;
                //LedI2cBackpack2.writeBytes([0x00], [digits[5], 0x00, digits[6], 0x00, 0x02, 0x00, digits[7], 0x00, digits[8], 0x00], function (err) {
                //    if (err) {
                //        console.log('LedI2cBackpack2 Error in write 12:34', err);
                //    } else {
                //        console.log('LedI2cBackpack2 wrote 12:34 ', LedI2cBackpack2);
                //    }
                //});
            });
            
        }

    });

    // Open and write 3333 to LED Backpack 3
    var LedI2cBackpack3;
    testI2cOpen(LedI2cDevicePath, LedI2cAddress3, function (err, i2cPort) {
        if (err) {
            console.log(' LedI2cBackpack3 errored ' + err);
        } else {
            console.log(' LedI2cBackpack3 success ');
            LedI2cBackpack3 = i2cPort;
            LedI2cBackpack3.writeBytes([0x00], [digits[3], 0x00, digits[3], 0x00, 0x02, 0x00, digits[3], 0x00, digits[3], 0x00], function (err) {
                if (err) {
                    console.log('LedI2cBackpack3 Error in write 33:33', err);
                } else {
                    console.log('LedI2cBackpack3 wrote 33:33 ', LedI2cBackpack3);
                }
                // Another way to reuse the device but change address on the return but this will causes issues
                // LedI2cBackpack2.address = LedI2cAddress1;
                //LedI2cBackpack2.writeBytes([0x00], [digits[5], 0x00, digits[6], 0x00, 0x02, 0x00, digits[7], 0x00, digits[8], 0x00], function (err) {
                //    if (err) {
                //        console.log('LedI2cBackpack2 Error in write 12:34', err);
                //    } else {
                //        console.log('LedI2cBackpack2 wrote 12:34 ', LedI2cBackpack2);
                //    }
                //});
            });

        }

    });
} catch (e) {
    console.log(e);
}
   

