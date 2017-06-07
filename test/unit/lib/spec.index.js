'use strict';

const index = require('../../../lib');
const Stub = require('../../../lib/stub');

describe('index', () =>  {
    it('should export the Stub class and helper middleware', () => {
        index.Stub.should.equal(Stub);
        index.middleware.should.be.a('function');
    });

    describe('middleware', () =>  {
        let mocks, index;

        beforeEach(() => {
            mocks = {};

            mocks.stubMiddlewareFunction = sinon.stub();
            mocks.stubInstance = {
                middleware: sinon.stub().returns(mocks.stubMiddlewareFunction),
            };
            mocks.Stub = sinon.stub().returns(mocks.stubInstance);

            index = proxyquire('../../lib', {
                './stub': mocks.Stub
            });
        });

        it('should create a stub with the args passed', () => {
            index.middleware('services', 'name', 'basePath');
            mocks.Stub.should.have.been.calledWithExactly('services', 'name', 'basePath');
        });

        it('should call the stub middleware setup function', () => {
            index.middleware('services', 'name', 'basePath');
            mocks.stubInstance.middleware.should.have.been.called;
        });

        it('should return the stub middleware function', () => {
            let middleware = index.middleware('services', 'name', 'basePath');
            middleware.should.equal(mocks.stubMiddlewareFunction);
        });
    });
});
