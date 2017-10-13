'use strict';

const Base = require('../../../lib/base');
const Stub = require('../../../lib/stub');
const Service = require('../../../lib/service');

describe('Stub class', () => {
    let options, services, requiredService;

    beforeEach(() => {
        options = '/path/to/filename.json';
        services = [ 'myservice.json' ];
        requiredService = {
            name: 'myService',
            method: 'GET',
            url: '/url2',
            scenarios: {
                default: { responses: [] },
            }
        };
        sinon.stub(Base.prototype, 'require');
        Base.prototype.require.withArgs(options).returns(services);
        Base.prototype.require.withArgs(services[0]).returns(requiredService);
        Base.prototype.require.returnsArg(0);
    });

    afterEach(() => {
        Base.prototype.require.restore();
    });

    it('should extend the Base class', () => {
        let stub = new Stub();
        stub.should.be.an.instanceOf(Base);
    });

    describe('constructor', () => {
        it('should use a stub name if given', () => {
            let stub = new Stub(options, 'myStub');
            stub.name.should.equal('myStub');
        });

        it('should set a default name based on services filename', () => {
            let stub = new Stub(options);
            stub.name.should.equal('filename');
        });

        it('should set the given basePath if specified', () => {
            let stub = new Stub(options, 'name', '/base/path');
            stub.basePath.should.equal('/base/path');
        });

        it('should set a default basePath if not specified', () => {
            let stub = new Stub(options);
            stub.basePath.should.equal('./');
        });

        it('should run this.require on the services', () => {
            new Stub(options);
            Base.prototype.require.should.have.been.calledWithExactly(options);
        });

        it('should run this.require on each service', () => {
            new Stub(options);
            Base.prototype.require.should.have.been.calledWithExactly(services[0]);
        });

        it('should set this.services to an array of Service instances', () => {
            let stub = new Stub(options, 'myStub');
            stub.services[0].should.be.an.instanceOf(Service);
            stub.services[0].name.should.equal('myStub.myService');
        });

        it('should initialise sessions to an empty object', () => {
            let stub = new Stub(options);
            stub.sessions.should.deep.equal({});
        });
    });

    describe('handler', () => {
        let stub, req, res, next, service;

        beforeEach(() => {
            req = reqres.req({
                stubSession: {
                    services: {}
                }
            });
            res = reqres.res();
            next = sinon.stub();
            service = {
                options: {},
                handler: sinon.stub()
            };

            stub = new Stub(options);

            sinon.stub(Base.prototype, 'param');
        });

        afterEach(() => {
            Base.prototype.param.restore();
        });

        it('should return a middleware function', () => {
            let fn = stub.handler(service);

            fn.should.be.a('function');
            fn.should.have.length(3);
        });

        it('should create req.stub as an object', () => {
            stub.handler(service)(req, res, next);

            req.stub.should.be.an('object');
        });

        it('should set req.stub.stub to be the instance', () => {
            stub.handler(service)(req, res, next);

            req.stub.stub.should.equal(stub);
        });

        it('should use this.param to get the sessionID', () => {
            Base.prototype.param.returns('12345678');

            stub.handler(service)(req, res, next);

            Base.prototype.param.should.have.been.calledWithExactly(
                req,
                stub.options.sessionID,
                'NOSESSION'
            );
        });

        it('should create a new session for the session id', () => {
            Base.prototype.param.returns('12345678');

            stub.handler(service)(req, res, next);

            req.stub.session.should.equal(stub.sessions['12345678']);
        });

        it('should use an existing session for the session id', () => {
            let existingSession = { foo: 'bar' };
            Base.prototype.param.returns('12345678');
            stub.sessions['12345678'] = existingSession;

            stub.handler(service)(req, res, next);

            req.stub.session.should.equal(existingSession);
            req.stub.session.should.equal(stub.sessions['12345678']);
        });

        it('should call the service handler', () => {
            stub.handler(service)(req, res, next);

            service.handler.should.have.been.calledWithExactly(req, res, next);
        });
    });


    describe('errorHandler', () => {
        let err, req, res, next, stub;

        beforeEach(() => {
            stub = new Stub(options);
            err = new Error();
            req = reqres.req();
            res = reqres.req({
                status: sinon.stub().returnsThis(),
                json: sinon.stub().returnsThis()
            });
            next = sinon.stub();
        });

        it('should call status with 500', () => {
            stub.errorHandler(err, req, res, next);

            res.status.should.have.been.calledWithExactly(500);
        });

        it('should call status with error json', () => {
            stub.errorHandler(err, req, res, next);

            res.json.should.have.been.calledWithExactly({err});
        });
    });


    describe('middleware', () => {
        let mocks, stub;

        beforeEach(() => {
            mocks = {};

            mocks.app = {
                use: sinon.stub(),
                get: sinon.stub(),
                post: sinon.stub()
            };
            mocks.express = sinon.stub().returns(mocks.app);

            mocks.jsonParser = sinon.stub();
            mocks.bodyParser = {
                json: sinon.stub().returns(mocks.jsonParser)
            };

            mocks.Stub = proxyquire('../../lib/stub', {
                'express': mocks.express,
                'body-parser': mocks.bodyParser
            });

            mocks.handlerFunction = sinon.stub();
            sinon.stub(mocks.Stub.prototype, 'handler').returns(mocks.handlerFunction);

            stub = new mocks.Stub(options);

        });

        afterEach(() => {
            mocks.Stub.prototype.handler.restore();
        });

        it('should mount the handler on the method and url for each service', () => {
            stub.services = [
                { options: { method: 'GET', url: '/get/url' }},
                { options: { method: 'POST', url: '/post/url' }}
            ];

            stub.middleware();

            mocks.app.get.should.have.been.calledWithExactly(
                '/get/url',
                mocks.jsonParser,
                mocks.handlerFunction
            );
            mocks.Stub.prototype.handler.should.have.been.calledWithExactly(stub.services[0]);

            mocks.app.post.should.have.been.calledWithExactly(
                '/post/url',
                mocks.jsonParser,
                mocks.handlerFunction
            );
            mocks.Stub.prototype.handler.should.have.been.calledWithExactly(stub.services[1]);
        });

        it('should use the error handler', () => {
            stub.middleware();
            mocks.app.use.should.have.been.calledWithExactly(stub.errorHandler);
        });
    });

});
