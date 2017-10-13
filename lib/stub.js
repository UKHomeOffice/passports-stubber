'use strict';

const debug = require('debug')('hmpo:stubs');
const _ = require('underscore');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Base = require('./base');
const Service = require('./service');

class Stub extends Base {
    constructor(services, name, basePath) {
        if (typeof name !== 'string' && typeof services === 'string') {
            name = path.basename(services, '.json');
        }
        if (!basePath) basePath = './';

        super(services, name, basePath);
        debug('Creating Stub Server', this.name);

        services = this.require(services);
        this.basePath = this.lastBasePath;

        this.services = _.map(services, service => {
            service = this.require(service);
            return new Service(service, this.name + '.' + service.name, this.lastBasePath);
        });

        this.sessions = {};
    }

    handler(service) {
        return (req, res, next) => {
            req.stub = {
                stub: this
            };

            let sessionID = this.param(req, service.options.sessionID, 'NOSESSION');
            req.stub.sessionID = sessionID;

            let session = this.sessions[sessionID];
            if (!session) {
                debug('Creating new session', this.name, sessionID);
                session = this.sessions[sessionID] = {
                    services: {}
                };
            }
            req.stub.session = session;

            service.handler(req, res, next);
        };
    }

    middleware() {
        let app = express();

        _.each(this.services, service => {
            let method = service.options.method;
            let url = service.options.url;
            debug('Stub server listening', service.name, method, url);
            app[method.toLowerCase()](
                url,
                bodyParser.json(),
                this.handler(service)
            );
        });

        app.use(this.errorHandler);

        return app;
    }

    errorHandler(err, req, res, next) {
        debug('Stub error', err, err.stack);
        res.status(500).json({err});
    }
}


module.exports = Stub;
