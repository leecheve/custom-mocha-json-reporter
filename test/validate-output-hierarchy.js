const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');

const outputFile = path.join(process.cwd(), 'mocha-output-hierarchy.json');

describe('reporter - hierarchy mode', function() {
  this.timeout(10000);

  it('reporter outputs json file', () => {
    const res = fs.existsSync(outputFile);
    assert.isTrue(res);
  });

  it('json file formatted as expected', () => {
    const contents = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    const stats = contents.stats;
    delete stats.start;
    delete stats.end;
    delete stats.duration;
    assert.deepEqual(stats, {
      "suites": 4,
      "tests": 7,
      "passes": 4,
      "pending": 1,
      "failures": 2,
    });
    const removeDurations = suite => {
      if (suite.suites && suite.suites.length > 0) {
        suite.suites.map(removeDurations);
      }
      return Object.assign(suite, {
        tests: suite.tests.map(t => {
          delete t.duration;
          return t;
        })
      });
    };
    const suites = contents.suites.map(removeDurations);
    assert.deepEqual(suites, [
      {
        "title": "suite 1",
        "tests": [
          {
            "title": "test pass",
            "result": "passed",
            "err": {}
          },
          {
            "title": "test fail",
            "result": "failed",
            "err": {
              "stack": `AssertionError [ERR_ASSERTION]: null == true\n    at Context.it (${path.join('test','sample-test.js')}:7:32)`,
              "message": "null == true",
              "generatedMessage": true,
              "name": "AssertionError [ERR_ASSERTION]",
              "code": "ERR_ASSERTION",
              "actual": null,
              "expected": true,
              "operator": "=="
            }
          },
          {
            "title": "skipped test",
            "result": "pending",
            "err": {}
          }
        ],
        "suites": [
          {
            "title": "nested describe",
            "tests": [
              {
                "title": "nested test pass",
                "result": "passed",
                "err": {}
              },
              {
                "title": "nested test fail",
                "result": "failed",
                "err": {
                  "stack": `AssertionError [ERR_ASSERTION]: null == true\n    at Context.it (${path.join('test','sample-test.js')}:11:41)`,
                  "message": "null == true",
                  "generatedMessage": true,
                  "name": "AssertionError [ERR_ASSERTION]",
                  "code": "ERR_ASSERTION",
                  "actual": null,
                  "expected": true,
                  "operator": "=="
                }
              }
            ],
            "suites": []
          },
          {
            "title": "nested describe 2",
            "tests": [
              {
                "title": "nested d2 test",
                "result": "passed",
                "err": {}
              }
            ],
            "suites": []
          }
        ]
      },
      {
        "title": "suite 2",
        "tests": [
          {
            "title": "suite2 pass",
            "result": "passed",
            "err": {}
          }
        ],
        "suites": []
      }
    ]);
    assert.deepEqual(contents.pending, [{
      "err": {},
      "result": "pending",
      "title": "skipped test"
    }]);
    const failures = contents.failures.map(f => {
      delete f.duration;
      return f;
    });
    assert.deepEqual(failures, [
      {
        "title": "test fail",
        "result": "failed",
        "err": {
          "stack": `AssertionError [ERR_ASSERTION]: null == true\n    at Context.it (${path.join('test','sample-test.js')}:7:32)`,
          "message": "null == true",
          "generatedMessage": true,
          "name": "AssertionError [ERR_ASSERTION]",
          "code": "ERR_ASSERTION",
          "actual": null,
          "expected": true,
          "operator": "=="
        }
      },
      {
        "title": "nested test fail",
        "result": "failed",
        "err": {
          "stack": `AssertionError [ERR_ASSERTION]: null == true\n    at Context.it (${path.join('test','sample-test.js')}:11:41)`,
          "message": "null == true",
          "generatedMessage": true,
          "name": "AssertionError [ERR_ASSERTION]",
          "code": "ERR_ASSERTION",
          "actual": null,
          "expected": true,
          "operator": "=="
        }
      }
    ]);

    const passes = contents.passes.map(p => {
      delete p.duration;
      return p;
    });;
    assert.deepEqual(passes, [
      {
        "title": "test pass",
        "result": "passed",
        "err": {}
      },
      {
        "title": "nested test pass",
        "result": "passed",
        "err": {}
      },
      {
        "title": "nested d2 test",
        "result": "passed",
        "err": {}
      },
      {
        "title": "suite2 pass",
        "result": "passed",
        "err": {}
      }
    ])
  });
});