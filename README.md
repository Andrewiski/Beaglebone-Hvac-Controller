#DE.HvacController

# Beaglebone Server Room Hvac Controller #

### Intro ###
A Beaglebone Hvac Controller with config settings to allow the control of nth number relays.
Using a tempature measurment device relays are controlled via overtemp and undertemp in an attempt to reach a target temp.

The node.js based application also has a web front end to allow the display and plot of tempature changes and relay state changes

Current Suport is for the LM35 tempature sensor and the more accurate i2c MCP9808 (recommended <https://learn.adafruit.com/adafruit-mcp9808-precision-i2c-temperature-sensor-guide/overview>).  
Currently only one tempature sensor is used but plans for inlet and exhast temature sensors as in my currect server room setup if the outside tempature
is lower then the desired temp turning on both the inlet and exhast fans has significate saving then starting up the AC unit.readme

### Installation and Setup ###
Due to the current state of rapid changes to Beaglebone Debian images with the move to Cape Manager and Jessie. I decided to go with the bleeding edge release
of Debian 8.4 2016-05-13.   Since there is a web front end I hve no need for HDMI I used a Beaglebone Green as its cheaper and I have no plans to use the HDMI port.
That being said any version of the Beaglebone can be used and techincal by making changes to the package.json depedencys you could run the app on Debian 7, 
the trick is getting i2c and bonescript (Octalbonescript in latest version) to work.

Current Dev is against Node 0.12.13 as that is what Octalbonescript and i2C is test against. Others may work milage may very.

Tested setup is as follows.

Download and flash a micro sd or onboard emmc with the following debian 8.4 console image (Instruction on how to flash the image can be found here <https://beagleboard.org/getting-started#update>)

<https://rcn-ee.net/rootfs/bb.org/testing/2016-05-13/console/bone-debian-8.4-console-armhf-2016-05-13-2gb.img.xz>

Connect the BeagleBone to the internet as we need to install some software

```
 sudo apt-get update
 sudo apt-get install -y git
 sudo apt-get install -y build-essential g++ python-setuptools python2.7-dev
 sudo apt-get install -y nodejs
 ```

 Do to missing files in the current console image the following needs to be ran to fix the universal image not being loaded
 which can be tested by viewing the loaded cape slots.
 We need the universial cape so that we can access the io pins for i2c and drive the relays.
 If output does not show  a universal cape then you may have load the universial cape manual or fix the image so it loads at boot.

 ```
 #show loaded Capes
 cat /sys/devices/platform/bone_capemgr/slots
 ```

  ```
 0: PF----  -1
 1: PF----  -1
 2: PF----  -1
 3: PF----  -1
 4: P-O-L-   0 Override Board Name,00A0,Override Manuf,univ-emmc
 ```

 If you are missing the universal cape which in example above is slot 4 then


 We can load the cape manual like so
 ```   
  sudo sh -c "echo 'univ-emmc' > /sys/devices/platform/bone_capemgr/slots"
 
 ```

To Fix the console image so it loads like it should at boot via the /opt/scripts/boot/am335x_evm.sh that excutes at boot  
do the following

```
 cd /opt/source/
 sudo  git clone https://github.com/cdsteinkuehler/beaglebone-universal-io.git
 sudo chmod a+rwx /opt/source/beaglebone-universal-io/config-pin
 cd /usr/local/bin/
 sudo ln -s /opt/source/beaglebone-universal-io/config-pin config-pin
```
after a reboot you should now see the universal cape loaded on boot

``` 
 cat /sys/devices/platform/bone_capemgr/slots
```

 

 Setup hvac Controller
 ```
 sudo mkdir /var/hvacController
 sudo chmod a+rw /var/hvacController
 cd  /var/hvacController
 git clone https://github.com/Andrewiski/Beaglebone-Hvac-Controller.git .
 npm install
 sudo DEBUG=hvacapp npm start
```
 Now Open a web browser and connect to the Beaglebone.

 <http://192.168.7.2> is your connected via usb port  if not you will need the IP address of the beaglebone which maybe accessable by its host name.

 <http://beaglebone>

### Running as Forever Service ###
Forever can be used to run the hvacController as a service and so it runs all the same.
```
sudo npm install -g forever
sudo mkdir /var/hvacController/logs
sudo touch /etc/init.d/hvacController
sudo chmod a+x /etc/init.d/hvacController
sudo update-rc.d hvacController defaults
```

```
sudo nano /etc/init.d/hvacController
```

```
#!/bin/sh

### BEGIN INIT INFO
# Provides:          hvacController
# Required-Start:    $local_fs $network
# Required-Stop:     $local_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: hvacController Service
# Description:       hvacController Service daemon
### END INIT INFO
export PATH=$PATH:/usr/local/bin
export NODE_PATH=$NODE_PATH:/usr/local/lib/node_modules
export PORT=80

case "$1" in
  start)
  exec forever --sourceDir=/var/hvacController --workingDir /var/hvacController -p /var/hvacController/logs start bin/www
  ;;

  stop)
  exec forever stop --sourceDir=/var/hvacController bin/www
  ;;
esac

exit 0
```

### Updates ###
Git commands can be used to get the latest version of posted software
```
cd  /var/hvacController
git pull

```

### Configuration ###

To setup the tempature sensor and relay pins edit configs/hvacControllerConfig.json.  If you are only using a mcp9808 then set
pinLm35 = null or '' so it will not be used. The mcp9808 is prefered as it seems to be calibrated correctly and doesn't drift 3 degrees up or down between readings.

tempTarget is the desired tempature and tempTolerance is the trigger above or below tempTarget of the relays or the allowed swing of the temperature before relays are triggered.

tempCorrectionOffset is used to calibrate the temp sensor as when using LM35 you may need to adjust the actual temp to match the sensors temp.

mcp9808I2CDevice is the i2c device name as passed into Octalbonescriptand ie  /dev/i2c-1 =  I2C2_SCL Pin P9_19 and I2C2_SDA Pin P9_20.

relays is an array of nth relays that can be triggered on overtemp under temp or both.
    Pin is the Pin name that is passed to Octalbone script
    alias is the name displayed to the user in the web based graph.
    onStateIsHigh is used to set the pin state when the relay  is triggered as some boards trigger pin high others pin lower

```
nano /var/hvacController/configs/hvacControllerConfig.json 
```

```

{
    "pinLm35": null,
    "mcp9808I2CDevice": "/dev/i2c-1",
    "mcp9808I2CAddress": "0x18",
  "refreshTimerIntervalSeconds": 30,
  "tempTarget": 70,
  "tempCorrectionOffset": 0,
  "tempTolerance": 5,
  "relays": {
    "relay1": {
      "pin": "P9_41",
      "alias": "Relay 1",
      "enableOnOverTemp": true,
      "enableOnUnderTemp": false,
      "onStateIsHigh": false,
      "pinIsHigh": false,
      "isOn": false
    },
    "relay2": {
        "pin": "P9_42",
        "alias": "Relay 2",
        "enableOnOverTemp": true,
        "enableOnUnderTemp": false,
        "onStateIsHigh": false,
        "pinIsHigh": false,
        "isOn": false
    }
  }
}
```

### Debug ###

To enable debug output set the DEBUG enviroment varable at start up.

```
cd /var/HvacController
sudo DEBUG=hvacApp npm start
```

### Future Development ###

Add Email/Text Alerts for temp events

I would like to add additional tempature sensors and allow configurable logic trees based on outside air temp determin if turning on 
fan to bring in outdoor air would be better then starting the Air Conditioning unit.

I would also like to add Rudman Regulator Support as my Battery banks have Rudman Regulator's on them
<http://www.manzanitamicro.com/products?page=shop.product_details&flypage=flypage.tpl&product_id=87&category_id=22&vmcchk=1>
