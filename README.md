## Spotify Secret

Add the file `./src/services/spotify.secret.js` with:

```
export const clientId = '<YOUR_CLIENT_ID>';
export const clientSecret = '<YOUR_CLIENT_SECRET>';
```

## ytdl-core bugfix

```
    error evalmachine.<anonymous>:426
    Ama=function(a,b,c,d){var e=null;switch(b){case "JSON":try{var f=c.responseText}catch(h){throw d=Error("Error reading responseText"),d.params=a,oC(d),h;}a=c.getResponseHeader("Content-Type")||"";f&&0<=a.indexOf("json")&&(")]};Ila(ncode);

                                                                                                                       ^^^^^^^^^^^^^^^^
     SyntaxError: Invalid or unexpected token
       at new Script (node:vm:100:7)
        at Object.exports.decipherFormats (/root/site/api/node_modules/ytdl-core/lib/sig.js:116:51)
       at runMicrotasks (<anonymous>)
        at processTicksAndRejections (node:internal/process/task_queues:96:5)
        at async Promise.all (index 0)
         at async exports.getInfo (/root/site/api/node_modules/ytdl-core/lib/info.js:401:17)
     error evalmachine.<anonymous>:426
     Ama=function(a,b,c,d){var e=null;switch(b){case "JSON":try{var f=c.responseText}catch(h){throw d=Error("Error reading responseText"),d.params=a,oC(d),h;}a=c.getResponseHeader("Content-Type")||"";f&&0<=a.indexOf("json")&&(")]};Ila(ncode);

                                                                                                                       ^^^^^^^^^^^^^^^^
     SyntaxError: Invalid or unexpected token
       at new Script (node:vm:100:7)
        at Object.exports.decipherFormats (/root/site/api/node_modules/ytdl-core/lib/sig.js:116:51)
        at runMicrotasks (<anonymous>)
        at processTicksAndRejections (node:internal/process/task_queues:96:5)
        at async Promise.all (index 0)
       at async exports.getInfo (/root/site/api/node_modules/ytdl-core/lib/info.js:401:17)
     error evalmachine.<anonymous>:426
     Ama=function(a,b,c,d){var e=null;switch(b){case "JSON":try{var f=c.responseText}catch(h){throw d=Error("Error reading responseText"),d.params=a,oC(d),h;}a=c.getResponseHeader("Content-Type")||"";f&&0<=a.indexOf("json")&&(")]};Ila(ncode);
```

To solve the problem: updating the sig.js code by this Pr: https://github.com/khlevon/node-ytdl-core/blob/fix/youtube-issue-2/lib/sig.js

## Run

Fill the file `./src/info.json`:
```json
{
  "videoId": "",
  "artist": "",
  "title": "",
  "album": ""
}
```

Run the following command:
```
node ./src/index.js
```
