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

`
 sudo apt-get update
 sudo apt-get install -y git
 sudo apt-get install -y build-essential g++ python-setuptools python2.7-dev
 sudo apt-get install -y nodejs
 
 sudo mkdir /var/hvacController
 sudo chmod a+rw /var/hvacController
 cd  /var/hvacController
 git clone https://github.com/Andrewiski/Beaglebone-Hvac-Controller.git .
 npm install
 sudo sh -c "echo 'univ-emmc' > /sys/devices/platform/bone_capemgr/slots"
 sudo DEBUG=hvacapp npm start
`


### Configuration ###

```

 hvacControllerConfig:{
        pinLm35: 'P9_39',
        pinRelay1: 'P9_41',
        pinRelay2: 'P9_42'
    },
    hvacSharedConfig: {
        eventLogMaxCount:1000
    }
```

### Debug ###

To enable debug output set the DEBUG enviroment varable at start up.

```
cd /var/HvacController
sudo DEBUG=hvacApp npm start
```

