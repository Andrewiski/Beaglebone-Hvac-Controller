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