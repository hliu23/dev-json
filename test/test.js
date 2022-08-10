const path = require("path");
const mock = require("mock-fs");
const assert = require("assert").strict;
const devJSON = require("../src/dev-json.js");

describe("dev-json", function () {
  const testObj = {
    "test1": {
      "test2": "test3",
      "test4": {
        "test5": "test6"
      },
      "test7": ["test8", "test9"]
    },
    "test10": "test11",
    "test12": {
      "test13": {
        "test14": {
          "test15": "test16"
        }
      }
    }
  }
  const testFile = "test.json";
  var ENV_ERR_MESSAGE = "";

  function checkErrMessage(err) {
    assert.strictEqual(err.message, ENV_ERR_MESSAGE);
    return true;
  }

  function catchError(err) {
    console.error(err)
  }

  beforeEach("setup mock file system", function () {
    mock({
      "test.json": mock.load(path.resolve(__dirname, "example.json"))
    })
  });

  afterEach("restore original file system and env variables", function () {
    mock.restore();
    ENV_ERR_MESSAGE = "";
  });


  describe("#retrieveJSON()", function () {

    it("should reject if not enough args", function () {
      ENV_ERR_MESSAGE = "Not enough args";
      return assert.rejects(devJSON.retrieveJSON(), checkErrMessage)
        .then(() => assert.rejects(devJSON.retrieveJSON(testFile), checkErrMessage));
    })

    it("should reject if path does not exist", function () {
      ENV_ERR_MESSAGE = "Path does not exist";
      return assert.rejects(devJSON.retrieveJSON("not-exist", []), checkErrMessage);
    })

    it("should reject if second arg not an array", function () {
      ENV_ERR_MESSAGE = "Second arg not an array";
      return assert.rejects(devJSON.retrieveJSON(testFile, "test1"), checkErrMessage);
    })

    it("should resolve with undefined if any key cannot be found", function () {
      function checkUndefined(res) {
        assert.strictEqual(res, undefined);
      }
      devJSON.retrieveJSON(testFile, ["test2", "test4", "test5"])
        .then(checkUndefined)
        .then(() => devJSON.retrieveJSON(testFile, ["test1", "test3", "test5"]))
        .then(checkUndefined)
        .then(() => devJSON.retrieveJSON(testFile, ["test1", "test4", "test6"]))
        .then(checkUndefined)
        .catch(catchError)
    })

    it("should resolve with all the data if provided empty array", function () {
      devJSON.retrieveJSON(testFile, [])
        .then((res) => {
          assert.deepEqual(res, testObj);
        }).catch(catchError);
    })

    it("should resolve with string if provided necessary keys", function () {
      devJSON.retrieveJSON(testFile, ["test10"])
        .then((res) => {
          assert.strictEqual(res, testObj["test10"]);
        })
        .then(() => devJSON.retrieveJSON(testFile, ["test1", "test2"])
          .then((res) => {
            assert.strictEqual(res, testObj["test1"]["test2"]);
          }))
        .catch(catchError);
    })


    it("should resolve with array if provided necessary keys", function () {
      devJSON.retrieveJSON(testFile, ["test1", "test7"])
        .then((res) => {
          assert.deepEqual(res, testObj["test1"]["test7"]);
        }).catch(catchError);
    })

    it("should resolve with object if provided necessary keys", function () {
      devJSON.retrieveJSON(testFile, ["test1", "test4"])
        .then((res) => {
          assert.deepEqual(res, testObj["test1"]["test4"]);
        }).catch(catchError);
    })

  });

  describe("#insertJSON()", function () {
    it("should reject if not enough args", function () {
      ENV_ERR_MESSAGE = "Not enough args";
      return assert.rejects(devJSON.insertJSON(), checkErrMessage)
        .then(() => assert.rejects(devJSON.insertJSON(testFile), checkErrMessage));
    })

    it("should reject if path does not exist", function () {
      ENV_ERR_MESSAGE = "Path does not exist";
      return assert.rejects(devJSON.insertJSON("not-exist", []), checkErrMessage);
    })

    it("should reject if second arg not an object", function () {
      ENV_ERR_MESSAGE = "Second arg not an object";
      return assert.rejects(devJSON.insertJSON(testFile, "test1"), checkErrMessage);
    })

    // no overwrite
    it("should create new property to store value if none existed", function () {
      // nested one level, insert an array
      devJSON.insertJSON(testFile, { "test17": ["test18", "test19"] })
        .then(() => (devJSON.retrieveJSON(testFile, ["test17"])))
        .then((res) => {
          assert.deepEqual(res, ["test18", "test19"]);
        })
        // nested three levels, insert number
        .then(() => devJSON.insertJSON(testFile, { "test12": { "test13": { "test16": 1 } } }))
        .then(() => (devJSON.retrieveJSON(testFile, ["test12", "test13", "test16"])))
        .then((res) => {
          assert.strictEqual(res, 1);
        })
        // nested three levels, insert object (nested four levels, insert string)
        .then(() => devJSON.insertJSON(testFile, { "test10": { "test11": { "test12": { "test13": "test18" } } } }))
        .then(() => (devJSON.retrieveJSON(testFile, ["test10", "test11", "test12"])))
        .then((res) => {
          assert.deepEqual(res, { "test13": "test18" });
        })
        .catch(catchError);
    })

    it("should overwrite existing property if primitive value or array inserted", function () {
      // nested one level, overwrite an object, insert an array
      devJSON.insertJSON(testFile, { "test1": [1, 2] })
        .then(() => (devJSON.retrieveJSON(testFile, ["test1"])))
        .then((res) => {
          assert.deepEqual(res, [1, 2]);
        })
        // nested two levels, overwrite an array, insert an array
        .then(() => devJSON.insertJSON(testFile, { "test1": { "test7": [1, 2] } }))
        .then(() => (devJSON.retrieveJSON(testFile, ["test1", "test7"])))
        .then((res) => {
          assert.deepEqual(res, [1, 2]);
        })
        // nested four levels, overwrite string, insert string
        .then(() => devJSON.insertJSON(testFile, { "test12": { "test13": { "test14": { "test15": "test17" } } } }))
        .then(() => (devJSON.retrieveJSON(testFile, ["test12", "test13", "test14", "test15"])))
        .then((res) => {
          assert.strictEqual(res, "test17");
        })
        .catch(catchError);

    })


    // object does not include array
    it("should overwrite existing property that does not contain an object if object inserted", function () {
      devJSON.insertJSON(testFile, { "test1": { "test7": { "test17": "test18" } } })
        .then(() => (devJSON.retrieveJSON(testFile, ["test1", "test7"])))
        .then((res) => {
          assert.deepEqual(res, { "test17": "test18" });
        })
        .catch(catchError);
    })


    it("should merge properties of two objects", function () {
      // not overwriting properties
      devJSON.insertJSON(testFile, { "test1": { "test4": { "test17": "test18" } } })
        .then(() => (devJSON.retrieveJSON(testFile, ["test1", "test4"])))
        .then((res) => {
          assert.deepEqual(res, { "test5": "test6", "test17": "test18" });
        })
        // overwriting properties
        .then(() => devJSON.insertJSON(testFile, { "test12": { "test13": { "test14": [1, 2], "test17": "test18" } } }))
        .then(() => (devJSON.retrieveJSON(testFile, ["test12", "test13"])))
        .then((res) => {
          assert.deepEqual(res, { "test14": [1, 2], "test17": "test18" });
        })
        .catch(catchError)

    })
  });

  describe("#deleteJSON()", function () {
    it("should reject if not enough args", function () {
      ENV_ERR_MESSAGE = "Not enough args";
      return assert.rejects(devJSON.deleteJSON(), checkErrMessage)
        .then(() => assert.rejects(devJSON.deleteJSON(testFile), checkErrMessage));
    })

    it("should reject if path does not exist", function () {
      ENV_ERR_MESSAGE = "Path does not exist";
      return assert.rejects(devJSON.deleteJSON("not-exist", []), checkErrMessage);
    })

    it("should reject if second arg not an array", function () {
      ENV_ERR_MESSAGE = "Second arg not an array";
      return assert.rejects(devJSON.deleteJSON(testFile, "test1"), checkErrMessage);
    })

    it("should reject if second arg is an empty array", function () {
      ENV_ERR_MESSAGE = "Second arg is an empty array";
      return assert.rejects(devJSON.deleteJSON(testFile, []), checkErrMessage);
    })

    it("should indicate failure in object if any key invalid", function () {
      devJSON.deleteJSON(testFile, ["test2"])
        .then((res) => {
          assert.strictEqual(res["success"], false);
          assert.strictEqual(res["deleted"], undefined);
        })
        .then(() => (devJSON.deleteJSON(testFile, ["test1", "test7", "test8"])))
        .then((res) => {
          assert.strictEqual(res["success"], false);
          assert.strictEqual(res["deleted"], undefined);
        })
        // file unchanged as a whole
        .then(() => (devJSON.retrieveJSON(testFile, [])))
        .then((retrieved) => {
          assert.deepEqual(retrieved, testObj);
        })
        .catch(catchError)
    })

    it("should resolve with deleted value if successful", function () {
      devJSON.deleteJSON(testFile, ["test1", "test4"])
        .then((res) => {
          assert.strictEqual(res["success"], true);
          assert.deepEqual(res["deleted"], {"test5": "test6"});
        })
        .then(() => (devJSON.retrieveJSON(testFile, ["test1", "test4"])))
        .then((res) => {
          assert.strictEqual(res, undefined);
        })
        .then(() => (devJSON.retrieveJSON(testFile, ["test1"])))
        .then((res) => {
          let resObj = {
            "test2": "test3",
            "test7": ["test8", "test9"]
          }
          assert.deepEqual(res, resObj);
        })
        .then(() => devJSON.deleteJSON(testFile, ["test10"]))
        .then((res) => {
          assert.strictEqual(res["success"], true);
          assert.strictEqual(res["deleted"], "test11");
        })
        .then(() => (devJSON.retrieveJSON(testFile, ["test10"])))
        .then((res) => {
          assert.strictEqual(res, undefined);
        })
        .then(() => (devJSON.retrieveJSON(testFile, [])))
        .then((res) => {
            resObj = {
            "test1": {
              "test2": "test3",
              "test7": ["test8", "test9"]
            },
            "test12": {
              "test13": {
                "test14": {
                  "test15": "test16"
                }
              }
            }
          }
          assert.deepEqual(res, resObj);
        })
        .catch(catchError)
    })
  });
})
