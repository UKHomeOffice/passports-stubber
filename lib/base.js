'use strict';

const debug = require('debug')('hmpo:stubber:base');
const path = require('path');

class Base {
    constructor(options, name, basePath) {
        this.name = name;
        this.options = options || {};
        this.basePath = basePath;
        this.lastBasePath = basePath;
    }

    // Pick values from req params based on the locations specified in options
    param(req, options, def) {
        let item =
            (options.query && req.query && req.query[options.query]) ||
            (options.param && req.params && req.params[options.param]) ||
            (options.body && req.body && req.body[options.body]) ||
            (options.header && req.get(options.header)) ||
            (options.session && req.session && req.session[options.session]) ||
            (options.env && process.env[options.env]) ||
            def;
        return item;
    }

    // If value is a string, require() it relative to the current basePath
    // Set the lastBasePath to the dirname of the resolved file
    require(value, defaultValue) {
        if (typeof value === 'string') {
            let filename = value;
            value = null;
            debug('Resolving filename', this.name, filename);
            this.lastBasePath = this.basePath;
            filename = require.resolve(path.resolve(this.basePath, filename));
            debug('Requiring filename', this.name, filename);
            value = require(filename);
            this.lastBasePath = path.dirname(filename);
        }
        return value || defaultValue;
    }

    // If value is a function run it and return a value
    value(value, req, res, defaultValue) {
        if (typeof value === 'function') {
            debug('Resolving value function', this.name, value);
            value = value.call(this, req, res);
        }
        return value || defaultValue;
    }
}

module.exports = Base;
