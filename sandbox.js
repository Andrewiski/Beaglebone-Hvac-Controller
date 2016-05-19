
var i2c = require('i2c');

var Sandbox = function (options) {
    
    console.log('attempting I2C');
    
    var address = 0x18;
    var wire = new i2c(address, { device: '/dev/i2c-1' }); // point to your i2c address, debug provides REPL interface 
    
    wire.scan(function (err, data) {
        // result contains an array of addresses 
        if (err) {
            console.dir(err);
        } else {
            for (var i = 0; i < data.length; i++) {
                console.log(data[i]);
            }
        }
    });
}

module.exports = Sandbox;