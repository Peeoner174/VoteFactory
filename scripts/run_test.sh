#!/usr/bin/env bash

truffle compile 
truffle truffle migrate --network=development
truffle test