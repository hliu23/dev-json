# dev-json
## Why?
- Manipulate objects instead of entire files in your code
- Avoid `Cannot read properties of undefined` errors and return `undefined` instead
- Reduce chance of overwriting data accidentally with deep merge



## Install
```
npm install dev-json --save-dev
```



## Examples
- [`retrieveJSON(path, [keys])`](#retrievejsonpath-keys)  
- [`insertJSON(path, obj)`](#insertjsonpath-obj)
- [`deleteJSON(path, [keys])`](#deletejsonpath-keys)


test.json
```json
{
   "test1": {
      "test2": {
         "test3": "test4"
      }
   }
}
```


### retrieveJSON(path, [keys])
Resolve to `undefined` if any key does not exist

```js
const devJSON = require("dev-json");
devJSON.retrieveJSON("./test.json", ["test1", "test2"])
.then((res) => console.dir(res))
.catch((err) => console.error(err))

// console
// { test3: 'test4' }
```



### insertJSON(path, obj)
Insert `obj` into file using deep merge

```js
const devJSON = require("dev-json");
const obj = {
   "test1": {
      "test2": {
         "test5": "test6"
      }
   }
}
devJSON.insertJSON("./test.json", obj)
.then((res) => console.dir(res))
.catch((err) => console.error(err))

// test.json
// {
//   "test1": {
//     "test2": {
//       "test3": "test4",
//       "test5": "test6"
//     }
//   }
// }
```



### deleteJSON(path, [keys])
Resolve to an object, with properties `success` and `deleted`

```js
const devJSON = require("dev-json");
devJSON.deleteJSON("./test.json", ["test1", "test2"])
.then((res) => console.dir(res))
.catch((err) => console.error(err))

// console
// { success: true, deleted: { test3: 'test4', test5: 'test6' } }
```


## Warning
The package is intended to be used in development only. For production or writing large amount of data, use a database like [MongoDB](https://www.mongodb.com/)

