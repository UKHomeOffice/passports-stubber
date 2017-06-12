'use strict';

const debug = require('debug')('hmpo:stubber:service');
const _ = require('underscore');
const Base = require('./base');
const Scenario = require('./scenario');

class Service extends Base {
    constructor(service, name, basePath) {
        super(service, name, basePath);
        debug('New Service', this.name);

        this.options.sessionID = this.options.sessionID || {
            header: 'X-SESSION-ID'
        };

        this.options.scenarioID = this.options.scenarioID || {
            header: 'X-SCENARIO-ID',
            query: 'x-scenario-id'
        };

        this.options.method = String(this.options.method || 'GET').toUpperCase();
        if (!_.contains(['GET', 'POST', 'PUT', 'DELETE'], this.options.method)) {
            throw new Error('service.method must be GET, POST, PUT, or DELETE at ' + this.name);
        }

        if (!this.options.url || typeof this.options.url !== 'string') {
            throw new Error('service.url must be a string at ' + this.name);
        }

        let scenarios = this.require(this.options.scenarios);
        this.basePath = this.lastBasePath;

        this.scenarios = _.mapObject(scenarios, scenario => {
            scenario = this.require(scenario);
            scenario.basePath = this.lastBasePath;
            return scenario;
        });

        this.setDefaultScenario(this.options.defaultScenario);
    }

    setDefaultScenario(scenario) {
        scenario = scenario || 'default';
        if (!this.scenarios[scenario]) {
            throw new Error('service.scenarios must have a default ' + scenario + ' scenario at ' + this.name);
        }
        this.defaultScenario = scenario;
    }

    handler(req, res, next) {
        debug('Running Service', this.name);
        req.stub.service = this;

        let serviceSession = req.stub.session.services[this.name] || {};

        debug('Getting scenario ID config', this.options.scenarioID);
        let scenarioParam = this.param(req, this.options.scenarioID, this.defaultScenario);
        let scenarioID = scenarioParam.split('#')[0];
        debug('Getting scenario ID value', scenarioID);
        if (!this.scenarios[scenarioID]) scenarioID = this.defaultScenario;

        if (serviceSession.scenarioParam !== scenarioParam) {
            debug('Scenario changed', this.name, serviceSession.scenarioParam, scenarioParam, scenarioID);
            let scenarioOptions = this.scenarios[scenarioID];
            let scenario = new Scenario(
                scenarioOptions,
                this.name + '.' + scenarioID,
                scenarioOptions.basePath
            );
            serviceSession = {
                scenario,
                scenarioID,
                scenarioParam
            };
            req.stub.session.services[this.name] = serviceSession;
        }

        serviceSession.scenario.handler(req, res, next);
    }
}


module.exports = Service;
