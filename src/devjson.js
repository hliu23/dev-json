const fs = require("fs");
const fsPromises = require("fs").promises;


function insertJSON(path, obj) {
  try {
    if (!fs.existsSync(path)) throw Error("Path does not exist");
  } catch (err) {
    catchError(err);
  }

  return fsPromises.readFile(path)
    .then((content) => {
      if (content != "") content = JSON.parse(content);
      else content = {};

      let merged = {...content, ...obj}; 

      return fsPromises.writeFile(path, JSON.stringify(merged))
    })
    .catch((err) => {
      catchError(err);
    })
}


// keys need to be an array
// return undefined if not exist
function retrieveJSON(path, keys) {
  try {
    if (!fs.existsSync(path)) throw Error("Path does not exist");
  } catch (err) {
    catchError(err);
  }
  return fsPromises.readFile(path)
    .then((content) => {
      if (content != "") content = JSON.parse(content);
      else content = {};
      
      let obj = content;
      for (const key of keys) {
        obj = obj[key];
        if (obj == undefined) return undefined;
        // obj = {};
      }

      return obj;
    })
    .catch((err) => {
      catchError(err);
    })
}

function deleteJSON(path, name) {
  try {
    if (!fs.existsSync(path)) throw Error("Path does not exist");
  } catch (err) {
    catchError(err);
  }
  return fsPromises.readFile(path)
    .then((content) => {
      if (content != "") content = JSON.parse(content);
      else content = {};

      if (content[name] != undefined) delete content[name];
      return fsPromises.writeFile(path, JSON.stringify(content));
    })
    .catch((err) => {
      catchError(err);
    })
}



module.exports = {
  insertJSON: insertJSON,
  retrieveJSON: retrieveJSON,
  deleteJSON: deleteJSON
}