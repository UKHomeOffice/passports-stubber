'use strict';

const Base = require('../../../lib/base');
const Response = require('../../../lib/response');

describe('Response class', () =>  {
    it('should extend the Base class', () => {
        let response = new Response();
        response.should.be.an.instanceOf(Base);
    });

    describe('constructor', () => {
        it('should set the repeat option on the instance', () => {
            let response = new Response({ repeat: 5 });
            response.options.repeat.should.equal(5);
        });

        it('should default the repeat option to 1 if not specified', () => {
            let response = new Response();
            response.options.repeat.should.equal(1);
        });
    });

    describe('send', () =>  {
        let response, req, res, options;

        beforeEach(() => {
            req = reqres.req();
            res = reqres.res({
                socket: {
                    destroy: sinon.stub()
                }
            });
            response = new Response();

            sinon.stub(Base.prototype, 'require').returnsArg(0);
            sinon.stub(Base.prototype, 'value');

            options = {
                body: {}
            };
        });

        afterEach(() => {
            Base.prototype.require.restore();
            Base.prototype.value.restore();
        });

        it('should close the connection if the close option is given', () => {
            response.send({ close: true }, req, res);
            res.socket.destroy.should.have.been.calledOnce;
            res.json.should.not.have.been.called;
            res.send.should.not.have.been.called;
        });

        it('should run this.require on the response body', () => {
            Base.prototype.value.returnsArg(0);
            response.send(options, req, res);
            Base.prototype.require.should.have.been.calledWithExactly(options.body);
        });

        it('should run this.value on the require result', () => {
            let requireResult = {};
            Base.prototype.require.returns(requireResult);
            response.send(options, req, res);
            Base.prototype.value.should.have.been.calledWithExactly(requireResult, req, res);
        });

        it('should send the result of value as json', () => {
            let valueResult = { foo: 'bar' };
            Base.prototype.value.returns(valueResult);
            response.send(options, req, res);
            res.json.should.have.been.calledWithExactly(valueResult);
        });

        it('should send the result of value as HTML if it is a string', () => {
            let valueResult = 'string value';
            Base.prototype.value.returns(valueResult);
            response.send(options, req, res);
            res.set.should.have.been.calledWithExactly('Content-Type', 'text/html');
            res.send.should.have.been.calledWithExactly(valueResult);
        });
    });

    describe('handler', () =>  {
        let response, req, res, next, options, clock;

        beforeEach(() => {
            req = reqres.req({
                stub: {}
            });
            res = reqres.res();
            next = sinon.stub();

            sinon.stub(Base.prototype, 'value');
            sinon.stub(Response.prototype, 'send');

            clock = sinon.useFakeTimers();

            options = {
                body: {}
            };

            response = new Response(options);
        });

        afterEach(() => {
            Base.prototype.value.restore();
            Response.prototype.send.restore();
            clock.restore();
        });

        it('should set req.stub.response to be the instance', () => {
            response.handler(req, res, next);
            req.stub.response.should.equal(response);
        });

        it('should pass the options through this.value', () => {
            response.handler(req, res, next);
            Base.prototype.value.should.have.been.calledWithExactly(options, req, res);
        });

        it('should call next with an error if the response is falsy', () => {
            Base.prototype.value.returns(null);
            response.handler(req, res, next);
            next.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
        });

        it('should call next with an error if the response is not an object', () => {
            Base.prototype.value.returns('string');
            response.handler(req, res, next);
            next.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
        });

        it('should call this.send', () => {
            Base.prototype.value.returns(options);
            response.handler(req, res, next);
            Response.prototype.send.should.have.been.calledWithExactly(options, req, res);
            next.should.not.have.been.called;
        });

        it('should call this.send after an interval if options.delay is given', () => {
            options.delay = 1000;
            Base.prototype.value.returns(options);

            response.handler(req, res, next);

            Response.prototype.send.should.not.have.been.called;
            next.should.not.have.been.called;

            clock.tick(1000);

            Response.prototype.send.should.have.been.calledWithExactly(options, req, res);
            next.should.not.have.been.called;
        });
    });
});
