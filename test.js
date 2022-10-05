const {exec} = require("child_process");
const scoop = require('./lib/scoop');

// let cmdStr = `start cmd /K "scoop bucket add ScoopInstaller_Nonportable https://github.com/ScoopInstaller/Nonportable & scoop install workman-p-uk-np"`;
// console.log(cmdStr);
// exec(cmdStr, function(err,stdout,stderr){
//     console.log(stdout,stderr);
// })


(async () => {
    let list = await scoop.search();
    scoop.install(list.items[0]);
    console.log(list);
})()
