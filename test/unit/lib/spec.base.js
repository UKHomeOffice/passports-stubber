'use strict';

const Base = require('../../../lib/base');

describe('Base class', () =>  {
    describe('constructor', () => {
        it('should set the given args to the instance', () => {
            let options = {};
            let base = new Base(options, 'name', '/base/path');
            base.name.should.equal('name');
            base.options.should.equal(options);
            base.basePath.should.equal('/base/path');
            base.lastBasePath.should.equal('/base/path');
        });
        it('should default the options to an empty object', () => {
            let base = new Base(null, 'name', '/base/path');
            base.options.should.deep.equal({});
        });
    });

    describe('param', () =>  {
        let base, req;

        beforeEach(() => {
            req = {
                get(k) { return req.headers && req.headers[k]; }
            };
            base = new Base();
        });

        it('should return the default if empty options are given', () => {
            base.param(req, {}, 'default').should.equal('default');
        });

        it('should return value from an environment variable', () => {
            base.param(req, { env: 'foo' }, 'default').should.equal('default');
            process.env.foo = 'bar';
            base.param(req, { env: 'foo' }, 'default').should.equal('bar');
            base.param(req, { env: 'moo' }, 'default').should.equal('default');
        });

        it('should return value from the session', () => {
            base.param(req, { session: 'foo' }, 'default').should.equal('default');
            req.session = { foo: 'bar' };
            base.param(req, { session: 'foo' }, 'default').should.equal('bar');
            base.param(req, { session: 'moo' }, 'default').should.equal('default');
        });

        it('should return value from a header', () => {
            base.param(req, { header: 'foo' }, 'default').should.equal('default');
            req.headers = { foo: 'bar' };
            base.param(req, { header: 'foo' }, 'default').should.equal('bar');
            base.param(req, { header: 'moo' }, 'default').should.equal('default');
        });

        it('should return value from the body', () => {
            base.param(req, { body: 'foo' }, 'default').should.equal('default');
            req.body = { foo: 'bar' };
            base.param(req, { body: 'foo' }, 'default').should.equal('bar');
            base.param(req, { body: 'moo' }, 'default').should.equal('default');
        });

        it('should return value from a URL param', () => {
            base.param(req, { param: 'foo' }, 'default').should.equal('default');
            req.params = { foo: 'bar' };
            base.param(req, { param: 'foo' }, 'default').should.equal('bar');
            base.param(req, { param: 'moo' }, 'default').should.equal('default');
        });

        it('should return value from a query param', () => {
            base.param(req, { query: 'foo' }, 'default').should.equal('default');
            req.query = { foo: 'bar' };
            base.param(req, { query: 'foo' }, 'default').should.equal('bar');
            base.param(req, { query: 'moo' }, 'default').should.equal('default');
        });

        it('should return value from first available option', () => {
            req.session = { foo: 'session' };
            req.headers = { foo: 'header' };
            req.body = { foo: 'body' };
            req.params = { foo: 'param' };
            req.query = { foo: 'query' };
            process.env.foo = 'env';

            let options = {
                env: 'foo',
                session: 'foo',
                header: 'foo',
                body: 'foo',
                param: 'foo',
                query: 'foo'
            };

            base.param(req, options, 'default').should.equal('query');

            delete req.query.foo;
            base.param(req, options, 'default').should.equal('param');

            delete req.params.foo;
            base.param(req, options, 'default').should.equal('body');

            delete req.body.foo;
            base.param(req, options, 'default').should.equal('header');

            delete req.headers.foo;
            base.param(req, options, 'default').should.equal('session');

            delete req.session.foo;
            base.param(req, options, 'default').should.equal('env');

            delete process.env.foo;
            base.param(req, options, 'default').should.equal('default');
        });
    });

    describe('require', () =>  {
        let base;

        beforeEach(() => {
            base  = new Base({}, 'name', './test');
        });

        it('should return the given value if it is an object', () => {
            let obj = {};
            base.require(obj, 'default').should.equal(obj);
        });

        it('should return the default if the given value is falsy', () => {
            base.require(false, 'default').should.equal('default');
        });

        it('should return require the value as a filename if it is a string', () => {
            let result = base.require('fixtures/test', 'default');
            result.should.deep.equal({
                foo: 'javascript'
            });
        });

        it('should return require the value as a json filename if it ends in .json', () => {
            let result = base.require('fixtures/test.json', 'default');
            result.should.deep.equal({
                foo: 'json'
            });
        });

        it('should throw an error if the file is not found', () => {
            expect(() => base.require('fixtures/unknown', 'default')).to.throw();
        });

        it('should set lastBasePath to the directory containing the required file', () => {
            base.require('fixtures/test', 'default');
            base.lastBasePath.should.match(/\/test\/fixtures$/);
        });
    });

    describe('value', () =>  {
        let base, req, res;
        beforeEach(() => {
            req = {};
            res = {};
            base  = new Base();
        });

        it('should return the given value if it is a string', () => {
            base.value('string', req, res, 'default').should.equal('string');
        });

        it('should return the given value if it is an object', () => {
            let obj = {};
            base.value(obj, req, res, 'default').should.equal(obj);
        });

        it('should return the default if the given value is falsy', () => {
            base.value(false, req, res, 'default').should.equal('default');
        });

        it('should run the value as a function and return its return value', () => {
            let fn = sinon.stub().returns('returned');
            base.value(fn, req, res, 'default').should.equal('returned');
            fn.should.have.been.calledWithExactly(req, res);
            fn.should.have.been.calledOn(base);
        });

        it('should return the default if the value function returns falsy', () => {
            let fn = sinon.stub().returns(false);
            base.value(fn, req, res, 'default').should.equal('default');
        });
    });
});
