# hmpo-stubber
Create dynamic stub API services using a simple JSON configuration

## Usage
```
const stubber = require('hmpo-stubber');

app.use('/stubs', stubber.middleware('./services.json', 'My Stub Server'));
```

stubber.middleware(services, [name], [basePath]);
    services: Array, // array of Service config objects
        (can be a filename, each service can be a filename)
    name: String(Stub), // name of stub server for debug logging
    basePath: String(./), // relative location when looking up filenames

## Command line interface
```
hmpo-stubber [options] [services.json...]

  -c, --config path::String  Use configuration from this file
  -p, --port Number          Specify port to listen on - default: 3030
  -m, --mount String         Base path to mount mocks on - default: /
  -s, --scenario String      Specify the default scenario - default: default
  -h, --help                 display help
```

### Command line config file
    {
        port: Number(3030), // port number
        mount: String('/'), // base URL to mount the standalone server
        scenario: String(), // default scenario
        stubs: Array,       // array of service filenames or service lists, 
    }

## Configuration

### Service config object
    {
        name: String,        // service name for debug logging
        method: String(GET), // method to mount in the stub server
        url: String,         // url to mount in the stub server
        scenarios: Object,   // object of named Scenario config objects
            (can be a filename, each scenario can be a filename)
        defaultScenario:
            String(default), // specify the default scenario
        sessionID: {         // locations to look for the session ID
          header: String,
          param: String,
          body: String,
          query: String
        },
        scenarioID: {        // locations to look for the scenario ID
          header: String,
          param: String,
          body: String,
          query: String
        }
    }

### Scenario config object
    {
        responses: Array,     // array of Response config objects to step through on each call
            (can be a filename, each response can be a filename, each response can be a function)
        loop: Boolean(false), // loop around the response list instead of staying on the last response
    }

### Response config object
    {
        body: Object,          // body to send as JSON
            (can be a filename or a function)
        status: Number(200),   // status code to respond with
        delay: Number(0),      // delay before sending the response
            (in milliseconds)
        repeat: Number(1),     // number of times to repeat this response
        close: Boolean(false), // close the connection before sending a response
    }

## Exposed additions to the stub req object:
```
req: {
  stub{
    stubtub: Stub,
    service: Service,
    scenario: Scenario,
    response: Response,
    session: {
      services: {
        [service.name]: {
          scenario: Scenario,
          scenarioID: String,
          scenarioParam: String
        }
      }
    }
  }
}
```


