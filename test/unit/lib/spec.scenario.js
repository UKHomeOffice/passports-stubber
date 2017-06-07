'use strict';

const Base = require('../../../lib/base');
const Scenario = require('../../../lib/scenario');
const Response = require('../../../lib/response');

describe('Scenario class', () =>  {
    let options;

    beforeEach(() =>  {
        options = {
            responses: []
        };
    });

    it('should extend the Base class', () => {
        let scenario = new Scenario(options);
        scenario.should.be.an.instanceOf(Base);
    });

    describe('constructor', () => {
        beforeEach(() => {
            sinon.stub(Base.prototype, 'require');
            sinon.stub(Scenario.prototype, 'reset');
        });

        afterEach(() => {
            Base.prototype.require.restore();
            Scenario.prototype.reset.restore();
        });

        it('should run this.require on the responses', () => {
            new Scenario(options);
            Base.prototype.require.should.have.been.calledWithExactly(options.responses);
        });

        it('should run this.require on each response', () => {
            let myResponses = [
                { name: 'first' },
                { name: 'second' },
            ];
            Base.prototype.require.onCall(0).returns(myResponses);
            new Scenario(options);
            Base.prototype.require.should.have.been.calledWithExactly(myResponses[0]);
            Base.prototype.require.should.have.been.calledWithExactly(myResponses[1]);
        });

        it('should set this.responses to an array of Response instances', () => {
            let myResponses = [
                {},
                {},
            ];
            Base.prototype.require.onCall(0).returns(myResponses);
            Base.prototype.require.onCall(1).returns(myResponses[0]);
            Base.prototype.require.onCall(2).returns(myResponses[1]);

            let scenario = new Scenario(options, 'name');

            scenario.responses.should.be.an('array');

            scenario.responses[0].should.be.an.instanceOf(Response);
            scenario.responses[0].name.should.equal('name.0');
            scenario.responses[0].options.should.equal(myResponses[0]);

            scenario.responses[1].should.be.an.instanceOf(Response);
            scenario.responses[1].name.should.equal('name.1');
            scenario.responses[1].options.should.equal(myResponses[1]);
        });

        it('should add in multiple responses if the repeat opton is set in a response', () => {
            let myResponses = [
                { repeat: 4 },
                {},
            ];
            Base.prototype.require.onCall(0).returns(myResponses);
            Base.prototype.require.onCall(1).returns(myResponses[0]);
            Base.prototype.require.onCall(2).returns(myResponses[1]);

            let scenario = new Scenario(options, 'name');

            scenario.responses.should.be.an('array');
            scenario.responses.length.should.equal(5);
            scenario.responses[0].options.should.equal(myResponses[0]);
            scenario.responses[1].options.should.equal(myResponses[0]);
            scenario.responses[2].options.should.equal(myResponses[0]);
            scenario.responses[3].options.should.equal(myResponses[0]);
            scenario.responses[4].options.should.equal(myResponses[1]);
        });

        it('should call reset', () => {
            new Scenario(options);
            Scenario.prototype.reset.should.have.been.calledOnce;
        });
    });

    describe('reset', () => {
        it('should set the call count to zero', () => {
            let scenario = new Scenario(options);
            scenario.callCount = 10;
            scenario.reset();
            scenario.callCount.should.equal(0);
        });
    });

    describe('handler', () =>  {
        let scenario, req, res, next, options;

        beforeEach(() => {
            req = reqres.req({
                stub: {}
            });
            res = reqres.res();
            next = sinon.stub();

            options = {
                responses: []
            };

            scenario = new Scenario(options);
            scenario.responses = [
                { handler: sinon.stub() },
                { handler: sinon.stub() },
                { handler: sinon.stub() },
            ];
        });

        it('should set req.stubScenario to be the instance', () => {
            scenario.handler(req, res, next);
            req.stub.scenario.should.equal(scenario);
        });

        it('should call the first response handler on the first call', () => {
            scenario.callCount = 0;
            scenario.handler(req, res, next);
            scenario.responses[0].handler.should.have.been.calledWithExactly(req, res, next);
            scenario.responses[1].handler.should.not.have.been.called;
        });

        it('should call the second response handler on the second call', () => {
            scenario.callCount = 1;
            scenario.handler(req, res, next);
            scenario.responses[0].handler.should.not.have.been.called;
            scenario.responses[1].handler.should.have.been.calledWithExactly(req, res, next);
        });

        it('should call the last response handler when the call count is more than the number of available responses', () => {
            scenario.callCount = 10;
            scenario.handler(req, res, next);
            scenario.responses[2].handler.should.have.been.calledWithExactly(req, res, next);
        });

        it('should increment the call counter', () => {
            scenario.callCount = 2;
            scenario.handler(req, res, next);
            scenario.callCount.should.equal(3);
        });

        it('should reset the call counter if the loop option is true', () => {
            scenario.options.loop = true;
            scenario.callCount = 2;
            scenario.handler(req, res, next);
            scenario.callCount.should.equal(0);
        });
    });
});
