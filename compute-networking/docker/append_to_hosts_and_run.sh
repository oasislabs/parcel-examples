#!/bin/sh

# Appends data to /etc/hosts and launches the given command.
# Usage:
#   append_to_hosts_and_run.sh <data_to_append> <cmd> [<args ...>]

echo "$(printf '\n\t')$1" >>/etc/hosts
shift
exec "$@"
