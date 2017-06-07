'use strict';

/* eslint no-console: "off" */

const debug = require('debug')('hmpo:stubber:cli');
const optionator = require('optionator');
const path = require('path');
const express = require('express');
const Stub = require('./stub');

let loadOptions = args => {
    let optionConfig = optionator({
        prepend: 'hmpo-stubber [options] services.json services.json',
        options: [
            {
                option: 'config',
                alias: 'c',
                type: 'path::String',
                description: 'Use configuration from this file'
            },
            {
                option: 'port',
                alias: 'p',
                type: 'Number',
                default: '3030',
                description: 'Specify port to listen on'
            },
            {
                option: 'mount',
                alias: 'm',
                type: 'String',
                default: '/',
                description: 'Base path to mount mocks on'
            },
            {
                option: 'scenario',
                alias: 's',
                type: 'String',
                description: 'Name of the default scenario'
            },
            {
                option: 'help',
                alias: 'h',
                type: 'Boolean',
                description: 'display help'
            }
        ]
    });

    let options = optionConfig.parseArgv(args);
    debug('Loaded command line options', args, options);

    if (options.help) {
        console.error(optionConfig.generateHelp());
        process.exit(0);
    }

    options.stubs = options._;

    return options;
};

let loadConfig = options => {
    if (options.config) {
        debug('Loading config file', options.config);
        let filename = path.resolve(options.config);
        let config = require(filename);
        options.basePath = path.dirname(filename);
        if (config.port) options.port = config.port;
        if (config.mount) options.mount = config.mount;
        if (config.scenario) options.scenario = config.scenario;
        if (config.stubs) options.stubs = options.stubs.concat(config.stubs);
    }
};

let runServer = options => {
    let app = express();

    let router = express.Router();
    app.use(options.mount, router);

    if (!options.stubs.length) {
        console.error('No services specified in config or command line');
        process.exit(1);
    }

    options.stubs.forEach((file, name) => {
        let stub = new Stub(file, name, options.basePath);

        console.log('Stub', stub.name);
        stub.services.forEach(service => {
            service.setDefaultScenario(options.scenario);
            let url = path.posix.join(options.mount, service.options.url);
            console.log('-', service.options.method, url);
        });

        router.use(stub.middleware());
    });

    app.listen(options.port, () => {
        console.log('Stub server listening on port', options.port);
    });
};

module.exports = {
    loadOptions,
    loadConfig,
    runServer
};
