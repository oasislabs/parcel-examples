#!/bin/bash

# A simple program that doubles a number.
# Arguments:
#    --from <PATH>  - Path to a file containing a single number.
#    --to <PATH>    - Path to which to write the double of the input number.
#
# Example use:
#   echo 7 > /tmp/seven.txt
#   doubler.sh --from /tmp/seven.txt --to /tmp/fourteen.txt

set -e

# Extremely naive argument parsing for demo purposes.
# Assume that the arguments always come in the order of "--from <PATH> --to <PATH>".
inputPath="$2"
outputPath="$4"

# Read the input number, calculate double, and send the result to output path.
echo $(( $(cat "$inputPath") * 2 )) >"$outputPath"
