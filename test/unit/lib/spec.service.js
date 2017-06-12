'use strict';

const Base = require('../../../lib/base');
const Service = require('../../../lib/service');
const Scenario = require('../../../lib/scenario');

describe('Service class', () =>  {
    let options;

    beforeEach(() =>  {
        options = {
            method: 'GET',
            url: '/url',
            scenarios: {
                default: { responses: [] },
                first: { responses: [] },
                second: { responses: [] }
            }
        };
    });

    it('should extend the Base class', () => {
        let service = new Service(options);
        service.should.be.an.instanceOf(Base);
    });

    describe('constructor', () => {
        let requiredScenarios, requiredDefault, requiredFirst, requiredSecond;
        beforeEach(() => {
            sinon.stub(Base.prototype, 'require');
            sinon.stub(Service.prototype, 'setDefaultScenario');

            requiredScenarios = {
                default: { name: 'default' },
                first: { name: 'first' },
                second: { name: 'second' }
            };
            Base.prototype.require.withArgs(options.scenarios).returns(requiredScenarios);

            requiredDefault = { name: 'requiredDefault' };
            Base.prototype.require.withArgs(requiredScenarios.default).returns(requiredDefault);

            requiredFirst = { name: 'requiredFirst' };
            Base.prototype.require.withArgs(requiredScenarios.first).returns(requiredFirst);

            requiredSecond = { name: 'requiredSecond' };
            Base.prototype.require.withArgs(requiredScenarios.second).returns(requiredSecond);
        });

        afterEach(() => {
            Base.prototype.require.restore();
            Service.prototype.setDefaultScenario.restore();
        });

        it('should set a default sessionID location', () => {
            let service = new Service(options);
            service.options.sessionID.should.be.an('object');
            service.options.sessionID.should.contain.all.keys('header');
        });

        it('should set the method to uppercase', () => {
            options.method = 'post';
            let service = new Service(options);
            service.options.method.should.equal('POST');
        });

        it('should default the method to GET', () => {
            options.method = '';
            let service = new Service(options);
            service.options.method.should.equal('GET');
        });

        it('should throw an error if the method is not allowed', () => {
            options.method = 'OTHER';
            expect(() => new Service(options)).to.throw();
        });

        it('should throw an error if the url is missing or not a string', () => {
            options.url = '';
            expect(() => new Service(options)).to.throw();
            options.url = 123;
            expect(() => new Service(options)).to.throw();
        });

        it('should run this.require on the scenarios', () => {
            new Service(options);
            Base.prototype.require.should.have.been.calledWithExactly(options.scenarios);
        });

        it('should run this.require on the scenarios', () => {
            new Service(options);
            Base.prototype.require.should.have.been.calledWithExactly(options.scenarios);
        });

        it('should run this.require on each scenario', () => {
            new Service(options);
            Base.prototype.require.should.have.been.calledWithExactly(requiredScenarios.default);
            Base.prototype.require.should.have.been.calledWithExactly(requiredScenarios.first);
            Base.prototype.require.should.have.been.calledWithExactly(requiredScenarios.second);
        });

        it('should set this.scenarios to the processed scenarios', () => {
            let service = new Service(options);
            service.scenarios.default.should.equal(requiredDefault);
            service.scenarios.first.should.equal(requiredFirst);
            service.scenarios.second.should.equal(requiredSecond);
        });

        it('should set the basePath of each scenario', () => {
            let service = new Service(options, 'name', '/base/path');
            service.scenarios.default.basePath.should.equal('/base/path');
        });

        it('should set the default scenario from the options', () => {
            options.defaultScenario = 'test';
            new Service(options);
            Service.prototype.setDefaultScenario.should.have.been.calledWithExactly('test');
        });
    });

    describe('setDefaultScenario', () =>  {
        let service;

        beforeEach(() => {
            service = new Service(options, 'myService');
        });

        it('should set the default scenario to the one specified', () => {
            service.defaultScenario = 'first';
            service.setDefaultScenario('second');
            service.defaultScenario.should.equal('second');
        });

        it('should throw an error if the new default is not in the scenarios', () => {
            service.defaultScenario = 'first';
            expect(() => service.setDefaultScenario('other')).to.throw();
            service.defaultScenario.should.equal('first');
        });
    });

    describe('handler', () =>  {
        let service, req, res, next;

        beforeEach(() => {
            req = reqres.req({
                stub: {
                    session: {
                        services: {}
                    }
                }
            });
            res = reqres.res();
            next = sinon.stub();

            service = new Service(options, 'myService');

            sinon.stub(Scenario.prototype, 'handler');
            sinon.stub(Base.prototype, 'param');
        });

        afterEach(() => {
            Scenario.prototype.handler.restore();
            Base.prototype.param.restore();
        });

        it('should set req.stub.service to be the instance', () => {
            Base.prototype.param.returns('default');
            service.handler(req, res, next);
            req.stub.service.should.equal(service);
        });

        it('should use this.param to get the scenarioID', () => {
            Base.prototype.param.returns('default');
            service.handler(req, res, next);
            Base.prototype.param.should.have.been.calledWithExactly(
                req,
                service.options.scenarioID,
                'default'
            );
        });

        it('should use the scenario specified by a param', () => {
            Base.prototype.param.returns('first');
            service.handler(req, res, next);
            req.stub.session.services.myService.scenarioParam.should.equal('first');
            req.stub.session.services.myService.scenarioID.should.equal('first');
            req.stub.session.services.myService.scenario.name.should.equal('myService.first');
        });

        it('should use the default scenario if the name is not found', () => {
            Base.prototype.param.returns('other');
            service.handler(req, res, next);
            req.stub.session.services.myService.scenarioParam.should.equal('other');
            req.stub.session.services.myService.scenarioID.should.equal('default');
            req.stub.session.services.myService.scenario.name.should.equal('myService.default');
        });

        it('should remove the hash suffix off the scenario name', () => {
            Base.prototype.param.returns('second#extra');
            service.handler(req, res, next);
            req.stub.session.services.myService.scenarioParam.should.equal('second#extra');
            req.stub.session.services.myService.scenarioID.should.equal('second');
            req.stub.session.services.myService.scenario.name.should.equal('myService.second');
        });

        it('should use the existing scenario if the scenarioParam has not changed', () => {
            let existingScenario = { handler: sinon.stub() };
            req.stub.session.services.myService = {
                scenarioParam: 'first#blah',
                scenarioID: 'first',
                scenario: existingScenario
            };
            Base.prototype.param.returns('first#blah');
            service.handler(req, res, next);
            req.stub.session.services.myService.scenarioParam.should.equal('first#blah');
            req.stub.session.services.myService.scenarioID.should.equal('first');
            req.stub.session.services.myService.scenario.should.equal(existingScenario);
        });

        it('should create a new scenario if only the hash suffix has changed', () => {
            let existingScenario = { handler: sinon.stub() };
            req.stub.session.services.myService = {
                scenarioParam: 'first#blah',
                scenarioID: 'first',
                scenario: existingScenario
            };
            Base.prototype.param.returns('first#new');
            service.handler(req, res, next);
            req.stub.session.services.myService.scenarioParam.should.equal('first#new');
            req.stub.session.services.myService.scenarioID.should.equal('first');
            req.stub.session.services.myService.scenario.should.not.equal(existingScenario);
        });

        it('should call the scenario handler', () => {
            let scenario = { handler: sinon.stub() };
            req.stub.session.services.myService = {
                scenarioParam: 'first',
                scenarioID: 'first',
                scenario
            };
            Base.prototype.param.returns('first');
            service.handler(req, res, next);
            scenario.handler.should.have.been.calledWithExactly(req, res, next);
        });
    });
});
