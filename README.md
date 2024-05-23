# custom-mocha-json-reporter

mocha json output file reporter

# Install

```
npm install --save-dev custom-mocha-json-reporter
```

# Run with Mocha

```
mocha --reporter custom-mocha-json-reporter
```

# Output file

The default file output will be `test-report.json` in the current working directory

## Reporter Options

- output - specify exact name of output file

```
mocha --reporter custom-mocha-json-reporter --reporter-options output=my-file.json
```
