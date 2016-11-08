#!/bin/bash
#
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
#export PORT=80
# Source function library.
. /lib/lsb/init-functions

NAME=hvacController                  # Unique name for the application
NODE_ENV=production                 # Node environment
PORT=80                           # Port (in this case the application uses process.env.PORT to set the port)
INSTANCE_DIR=/var/$NAME         # Location of the application source
SOURCE_NAME=hvacControllerApp.js              # Name os the applcation entry point script

user=root
pidfile=/var/$NAME/service/$NAME.pid
logfile=/var/$NAME/service/$NAME.log


start() {
    echo "Starting $NAME node instance: "

    if [ "$id" = "" ]; then
        # Create the log and pid files, making sure that the target use has access to them
        touch $logfile
        chown $user $logfile

        touch $pidfile
        chown $user $pidfile

        # Launch the application
        start_daemon
            $forever start --sourceDir=$INSTANCE_DIR --workingDir $INSTANCE_DIR --pidFile $pidfile -p $INSTANCE_DIR/service -l $logfile -d -a start $SOURCE_NAME
            
        RETVAL=$?
    else
        echo "Instance already running"
        RETVAL=0
    fi
}

restart() {
    echo -n "Restarting $NAME node instance : "
    if [ "$id" != "" ]; then
        $forever restart --sourceDir=$INSTANCE_DIR $id
        RETVAL=$?
    else
        start
    fi
}

stop() {
    echo -n "Shutting down $NAME node instance : "
    if [ "$id" != "" ]; then
        $forever stop --sourceDir=$INSTANCE_DIR $id
    else
        echo "Instance is not running";
    fi
    RETVAL=$?
}

getForeverId() {
    local pid=$(pidofproc -p $pidfile)
    $forever list --sourceDir=$INSTANCE_DIR | $sed -e 's/\x1b\[[0-9; ]*m//g' | $awk "\$6 && \$6 == \"$pid\" { gsub(/[\[\]]/, \"\", \$2); print \$2; }";
}
id=$(getForeverId)

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status -p ${pidfile}
        ;;
    restart)
        restart
        ;;
    *)
        echo "Usage:  {start|stop|status|restart}"
        exit 1
        ;;
esac
exit $RETVAL