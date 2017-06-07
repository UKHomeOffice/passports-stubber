'use strict';

const debug = require('debug')('hmpo:stubber:scenario');
const _ = require('underscore');
const Base = require('./base');
const Response = require('./response');

class Scenario extends Base {
    constructor(scenario, name, basePath) {
        super(scenario, name, basePath);
        debug('New Scenario', this.name);

        let responses = this.require(this.options.responses);
        this.basePath = this.lastBasePath;

        this.responses = [];
        _.each(responses, (response, index) => {
            response = this.require(response);
            response = new Response(response, this.name + '.' + index, this.lastBasePath);
            // add this response to the response list multiple times if the repeat option is given
            _.times(response.options.repeat, () => this.responses.push(response));
        });

        this.reset();
    }

    reset() {
        this.callCount = 0;
    }

    handler(req, res, next) {
        debug('Running Scenario', this.name);
        req.stub.scenario = this;

        let responseIndex = Math.min(this.callCount, this.responses.length - 1);
        let response = this.responses[responseIndex];
        response.handler(req, res, next);
        this.callCount++;
        if (this.options.loop && this.callCount >= this.responses.length) this.reset();
    }
}

module.exports = Scenario;
