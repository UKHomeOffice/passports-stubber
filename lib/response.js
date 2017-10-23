'use strict';

const debug = require('debug')('hmpo:stubber:response');
const Base = require('./base');

class Response extends Base {
    constructor(response, name, basePath) {
        super(response, name, basePath);
        debug('New Response', this.name);
        this.options.repeat = this.options.repeat || 1;
    }

    send(response, req, res) {
        if (response.close) {
            return res.socket.destroy();
        }

        res.status(response.statusCode || 200);

        let body = this.require(response.body);
        body = this.value(body, req, res);

        if (body === res) {
            debug('Value handler has sent response', this.name);
        } else if (typeof body === 'string') {
            res.set('Content-Type', 'text/html');
            debug('Sending HTML response body', this.name, body);
            res.send(body);
        } else {
            debug('Sending JSON response body', this.name, body);
            res.json(body);
        }
    }

    handler(req, res, next) {
        debug('Returning response', this.name);
        req.stub.response = this;

        let response = this.value(this.options, req, res);

        if (!response || typeof response !== 'object') {
            return next(new Error('response must be an object at ' + this.name));
        }

        debug('Sending response', this.name, {
            status: response.statusCode,
            delay: response.delay,
            close: response.close
        });

        if (response.delay) {
            setTimeout(
                () => this.send(response, req, res),
                response.delay
            );
        } else {
            this.send(response, req, res);
        }
    }
}

module.exports = Response;
