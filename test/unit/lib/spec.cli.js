'use strict';

/* eslint no-console: "off" */

const cli = require('../../../lib/cli');

describe('cli', () =>  {
    describe('loadOptions', () =>  {
        beforeEach(() => {
            sinon.stub(process, 'exit');
            sinon.stub(console, 'error');
        });

        afterEach(() => {
            process.exit.restore();
            console.error.restore();
        });

        it('should be exported as a function', () => {
            cli.loadOptions.should.be.a('function');
        });

        it('should return default options if no options are provided', () => {
            let args = [ 'node', 'cli.js' ];
            let options = cli.loadOptions(args);
            expect(options.help).to.not.be.ok;
            expect(options.config).to.not.be.ok;
            expect(options.scenario).to.not.be.ok;
            options.port.should.equal(3030);
            options.mount.should.equal('/');
            options.stubs.should.deep.equal([]);
        });

        it('should return parsed supplied options', () => {
            let args = [
                'node', 'cli.js',
                '-c', 'config.js',
                '-p', '1234',
                '-s', 'myscenario',
                '-m', '/blah',
                'file1', 'file2'];
            let options = cli.loadOptions(args);
            expect(options.help).to.not.be.ok;
            options.config.should.equal('config.js');
            options.port.should.equal(1234);
            options.mount.should.equal('/blah');
            options.scenario.should.equal('myscenario');
            options.stubs.should.deep.equal([ 'file1', 'file2' ]);
        });

        it('should show help and exit if -h is supplied', () => {
            let args = [ 'node', 'cli.js', '-h' ];
            cli.loadOptions(args);
            console.error.should.have.been.calledOnce;
            process.exit.should.have.been.calledWithExactly(0);
        });
    });

    describe('loadConfig', () =>  {
        it('should be exported as a function', () => {
            cli.loadConfig.should.be.a('function');
        });

        it('should not change the options if no config is given', () => {
            let options = {
                port: 4321,
                mount: '/',
                scenario: 'oldscenario',
                stubs: [ 'file1', 'file2' ]
            };
            cli.loadConfig(options);
            options.port.should.equal(4321);
            options.mount.should.equal('/');
            options.scenario.should.equal('oldscenario');
            options.stubs.should.deep.equal([ 'file1', 'file2' ]);
        });

        it('should not change the options if option is missing from config', () => {
            let options = {
                config: './test/fixtures/empty.json',
                port: 4321,
                mount: '/',
                scenario: 'oldscenario',
                stubs: [ 'file1', 'file2' ]
            };
            cli.loadConfig(options);
            options.port.should.equal(4321);
            options.mount.should.equal('/');
            options.scenario.should.equal('oldscenario');
            options.stubs.should.deep.equal([ 'file1', 'file2' ]);
        });

        it('should update options with values from a config file', () => {
            let options = {
                config: './test/fixtures/config.json',
                port: 4321,
                mount: '/',
                scenario: 'oldscenario',
                stubs: [ 'file1', 'file2' ]
            };
            cli.loadConfig(options);
            options.port.should.equal(1234);
            options.mount.should.equal('/blah');
            options.scenario.should.equal('test');
            options.stubs.should.deep.equal([ 'file1', 'file2', 'file3', 'file4' ]);
        });

        it('should set the basePath based on the config file name', () => {
            let options = {
                config: './test/fixtures/config.json',
                stubs: []
            };
            cli.loadConfig(options);
            options.basePath.should.match(/\/test\/fixtures$/);
        });
    });

    describe('runServer', () =>  {
        let mocks, cli, options;

        beforeEach(() => {
            sinon.stub(process, 'exit');
            sinon.stub(console, 'log');
            sinon.stub(console, 'error');

            mocks = {};

            mocks.setDefaultScenario = sinon.stub();

            mocks.stubMiddlewareFunction = sinon.stub();
            mocks.stubInstance = {
                name: 'stubname',
                middleware: sinon.stub().returns(mocks.stubMiddlewareFunction),
                services: [
                    {
                        options: {
                            method: 'GET',
                            url: '/url'
                        },
                        setDefaultScenario: mocks.setDefaultScenario
                    }
                ]
            };
            mocks.Stub = sinon.stub().returns(mocks.stubInstance);

            mocks.expressInstance = {
                use: sinon.stub(),
                listen: sinon.stub().yields()
            };
            mocks.express = sinon.stub().returns(mocks.expressInstance);

            mocks.routerInstance = {
                use: sinon.stub()
            };
            mocks.express.Router = sinon.stub().returns(mocks.routerInstance);

            cli = proxyquire('../../lib/cli', {
                './stub': mocks.Stub,
                'express': mocks.express
            });

            options = {
                port: 1234,
                mount: '/base',
                stubs: [ 'stub1', 'stub2', 'stub3' ]
            };
        });

        afterEach(() => {
            process.exit.restore();
            console.log.restore();
            console.error.restore();
        });

        it('should be exported as a function', () => {
            cli.runServer.should.be.a('function');
        });

        it('should exist with an error if no stubs are supplied', () => {
            options.stubs = [];

            cli.runServer(options);

            console.error.should.have.been.calledOnce;
            process.exit.should.have.been.calledWithExactly(1);
        });

        it('should create an express server and router', () => {
            cli.runServer(options);

            mocks.express.should.have.been.calledWithExactly();
            mocks.express.Router.should.have.been.calledWithExactly();
            mocks.expressInstance.use.should.have.been.calledWithExactly('/base', mocks.routerInstance);
        });

        it('should call listen on the express server with the port number', () => {
            cli.runServer(options);

            mocks.express.should.have.been.calledWithExactly();
            mocks.express.Router.should.have.been.calledWithExactly();
            mocks.expressInstance.listen.should.have.been.calledWith(1234);
            console.log.should.have.been.calledWith(sinon.match.string, 1234);
        });

        it('should create a stub for each stub config', () => {
            cli.runServer(options);

            mocks.Stub.should.have.been.calledWithExactly('stub1', 0, undefined);
            mocks.Stub.should.have.been.calledWithExactly('stub2', 1, undefined);
        });

        it('should use the basePath set by the config loaded to create the stub', () => {
            options.basePath = '/base/path';

            cli.runServer(options);

            mocks.Stub.should.have.been.calledWithExactly('stub1', 0, '/base/path');
        });

        it('should add each stub middleware to the express router', () => {
            cli.runServer(options);

            mocks.stubInstance.middleware.should.have.been.calledThrice;
            mocks.routerInstance.use.should.have.been.calledThrice;
            mocks.routerInstance.use.should.have.been.calledWithExactly(mocks.stubMiddlewareFunction);
        });

        it('should log the url of each service configured in the stub', () => {
            cli.runServer(options);
            console.log.should.have.been.calledWithExactly('Stub', 'stubname');
            console.log.should.have.been.calledWithExactly('-', 'GET', '/base/url');
        });

        it('should set the default scenario for each service', () => {
            options.scenario = 'test';
            cli.runServer(options);
            mocks.setDefaultScenario.should.have.been.calledWithExactly('test');
        });
    });
});
