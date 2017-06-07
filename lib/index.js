'use strict';

let Stub = require('./stub');

let middleware = (services, name, basePath) => {
    let stub = new Stub(services, name, basePath);
    return stub.middleware();
};

module.exports = {
    Stub,
    middleware
};
