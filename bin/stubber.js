#!/usr/bin/env node

'use strict';

/* eslint no-console: "off" */

process.once('uncaughtException', err => {
    console.error(err.message);
    console.error(err.stack);
    process.exitCode = 1;
});

const cli = require('../lib/cli');

let options = cli.loadOptions(process.argv);

cli.loadConfig(options);

cli.runServer(options);
