const fs = require("fs");
const fsPromises = require("fs").promises;

function isObject(input) {
  return (typeof input == "object" && !Array.isArray(input));
}

function catchError(err) {
  let env = process.env.NODE_ENV || "development";

  function unexpectedError(error) {
    console.error(error.message);
  }
  if (env == "development") {
    const expected = ["Not enough args", "Path does not exist", "Second arg not an array", "Second arg not an object", "Second arg is an empty array"];
    for (errMessage of expected) {
      if (err.message === errMessage) throw new Error(err.message);
    }
  }

  unexpectedError(err);
}


// keys need to be an array
// return undefined if not exist
function retrieveJSON(path, keys) {
  const testPromise = new Promise((resolve, reject) => {
    if (!path || !keys) reject(new Error("Not enough args"));
    else if (!fs.existsSync(path)) reject(new Error("Path does not exist"));
    else if (!Array.isArray(keys)) reject(new Error("Second arg not an array"));
    else resolve(undefined);
  })
  return testPromise
    .then(() => fsPromises.readFile(path))
    .then((content) => {
      if (content != "") content = JSON.parse(content);
      else content = {};

      let obj = content;
      for (const key of keys) {
        obj = obj[key];
        if (obj == undefined) return undefined;
      }

      return obj;
    })
    .catch(catchError)
}




function insertJSON(path, obj) {

  function deepMerge(obj1, obj2) {
    for (let prop in obj2) {
      if (isObject(obj2[prop])) {
        // if prop not exists in obj1 or holds primitive val, create or overwrite value in obj1
        // else if prop exists and holds object, go one level deeper and repeat
        if (obj1[prop] == undefined || !isObject(obj1[prop])) obj1[prop] = obj2[prop];
        else deepMerge(obj1[prop], obj2[prop]);
      } else {
        // if prop holds primitive value in obj2, create or overwrite value in obj1 
        obj1[prop] = obj2[prop];
      }
    }
    return obj1;
  }
  
  const testPromise = new Promise((resolve, reject) => {
    if (!path || !obj) reject(new Error("Not enough args"));
    else if (!fs.existsSync(path)) reject(new Error("Path does not exist"));
    else if (!isObject(obj)) reject(new Error("Second arg not an object"));
    else resolve(undefined);
  })

  return testPromise
    .then(() => fsPromises.readFile(path))
    .then((content) => {
      if (content != "") content = JSON.parse(content);
      else content = {};

      let merged = deepMerge(content, obj);

      return JSON.stringify(merged);
    })
    .then((merge) => fsPromises.writeFile(path, merge))
    .catch(catchError)
}

function deleteJSON(path, keys) {
  let resObj = {
    success: true
  }
  const testPromise = new Promise((resolve, reject) => {
    if (!path || !keys) reject(new Error("Not enough args"));
    else if (!fs.existsSync(path)) reject(new Error("Path does not exist"));
    else if (!Array.isArray(keys)) reject(new Error("Second arg not an array"));
    else if (keys.length == 0) reject(new Error("Second arg is an empty array"));
    else resolve(undefined);
  })
  // let removed;
  return testPromise
    .then(() => fsPromises.readFile(path))
    .then((content) => {
      
      if (content != "") content = JSON.parse(content);
      else content = {};
      
      let arr = [];

      let obj = content;
      for (let key = 0; key < keys.length; key++) {
        arr.push(obj);
        obj = obj[keys[key]];
        if (obj == undefined) {
          resObj["success"] = false;
          // unlikely for the whole new file to be undefined
          return;
        }
      }

      if (resObj["success"]) {
        let lastKey = keys[keys.length-1];
        const {[lastKey]: last, ...others} = arr[arr.length-1];
  
        arr[arr.length-1] = others;
  
        for (let i = arr.length-2; i >= 0; i--) {
          arr[i][keys[i]] = arr[i+1];
        }
  
        resObj["removed"] = last; 
        return arr[0];
      }

    })
    .then((res) => {
      if (resObj["success"]) return fsPromises.writeFile(path, JSON.stringify(res));
    }) 
    .then((res) => resObj) 
    .catch(catchError)
}

module.exports = {
  retrieveJSON: retrieveJSON,
  insertJSON: insertJSON,
  deleteJSON: deleteJSON
}