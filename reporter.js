'use strict';
/**
 * @module JSON
 */
/**
 * Module dependencies.
 */

var Base = require('mocha/lib/reporters/base');
var constants = require('mocha/lib/runner').constants;
var fs = require('fs');
var EVENT_TEST_PASS = constants.EVENT_TEST_PASS;
var EVENT_TEST_FAIL = constants.EVENT_TEST_FAIL;
var EVENT_TEST_END = constants.EVENT_TEST_END;
var EVENT_RUN_END = constants.EVENT_RUN_END;
var EVENT_TEST_PENDING = constants.EVENT_TEST_PENDING;
var EVENT_SUITE_END = constants.EVENT_SUITE_END;

/**
 * Expose `JSON`.
 */

exports = module.exports = JSONReporter;

/**
 * Constructs a new `JSON` reporter instance.
 *
 * @public
 * @class JSON
 * @memberof Mocha.reporters
 * @extends Mocha.reporters.Base
 * @param {Runner} runner - Instance triggers reporter actions.
 * @param {Object} [options] - runner options
 */
function JSONReporter(runner, options) {
  Base.call(this, runner, options);

  var self = this;
  var tests = [];
  var pending = [];
  var failures = [];
  var passes = [];

  runner.on(EVENT_TEST_END, function (test) {
    tests.push(test);
  });

  runner.on(EVENT_TEST_PASS, function (test) {
    passes.push(test);
  });

  runner.on(EVENT_TEST_FAIL, function (test) {
    failures.push(test);
  });

  runner.on(EVENT_TEST_PENDING, function (test) {
    pending.push(test);
  });

  runner.once(EVENT_RUN_END, function () {
    const labels = {
      ...(tests?.[0] || failures?.[0]).ctx.labels,
    };
    Object.entries(labels).forEach(([key, value]) => {
      if (key.startsWith('label_')) return;
      labels['label_' + key] = value;
      delete labels[key];
    });

    const testIds = tests.map((test) => test.id);
    testIds.map((testId) => delete labels['label_' + testId]);

    var obj = {
      stats: self.stats,
      tests: tests.map(clean),
      pending: pending.map(clean),
      failures: failures.map(clean),
      passes: passes.map(clean),
    };

    const runId = runner.suite.id;
    const app = 'qa-tests';

    console.log(JSON.stringify({ app, runId, dataType: 'stats', ...labels, ...obj.stats }));
    obj.pending.map((test) =>
      console.log(JSON.stringify({ app, runId, dataType: 'test', status: 'pending', ...test }))
    );
    obj.failures.map((test) =>
      console.log(JSON.stringify({ app, runId, dataType: 'test', status: 'failure', ...test }))
    );
    obj.passes.map((test) => console.log(JSON.stringify({ app, runId, dataType: 'test', status: 'pass', ...test })));

    runner.testResults = obj;

    fs.writeFileSync(
      options.reporterOptions && options.reporterOptions.output ? options.reporterOptions.output : 'test-report.json',
      JSON.stringify(obj, null, 2)
    );
  });
}

/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @private
 * @param {Object} test
 * @return {Object}
 */
function clean(test) {
  var err = test.err || {};
  if (err instanceof Error) {
    err = errorJSON(err);
  }

  var labels = test.ctx?.labels[test.id];
  labels &&
    Object.entries(labels).forEach(([key, value]) => {
      if (key.startsWith('label_')) return;
      labels['label_' + key] = value;
      delete labels[key];
    });

  return {
    ...labels,
    title: test.title,
    fullTitle: test.fullTitle(),
    file: test.file,
    duration: test.duration,
    currentRetry: test.currentRetry(),
    err: err.message || cleanCycles(err),
  };
}

/**
 * Replaces any circular references inside `obj` with '[object Object]'
 *
 * @private
 * @param {Object} obj
 * @return {Object}
 */
function cleanCycles(obj) {
  var cache = [];
  return JSON.parse(
    JSON.stringify(obj, function (key, value) {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Instead of going in a circle, we'll print [object Object]
          return '' + value;
        }
        cache.push(value);
      }

      return value;
    })
  );
}

/**
 * Transform an Error object into a JSON object.
 *
 * @private
 * @param {Error} err
 * @return {Object}
 */
function errorJSON(err) {
  var res = {};
  Object.getOwnPropertyNames(err).forEach(function (key) {
    res[key] = err[key];
  }, err);
  return res;
}

JSONReporter.description = 'single JSON object';
