const {exec} = require("child_process");

function substr(str,start,end,out=false){
    // 中文是2个长度的
    let realIndex = 0;
    let tempLength = 0;

    let realStart = null;
    let realEnd = null;

    for(let index = 0; index < str.length; index++){
        let indexChar = str.charAt(index);
        // 判断是不是中文
        if(indexChar.match(/[\u4e00-\u9fa5]/)){
            realIndex+=2;
        }else{
            realIndex+=1;
        }

        if (realIndex >= start){
            if (realStart === null) realStart = index;

            if(indexChar.match(/[\u4e00-\u9fa5]/)){
                tempLength+=2;
            }else{
                tempLength++;
            }
        }
        if(tempLength - 1 >= end - start){
            realEnd = index;
            break;
        }
    }
    if (realEnd === null) realEnd = str.length - 1;
    return str.substring(realStart,realEnd);
}
function matchWingetList(line,cmdLength){
    // 119

    return {
        name: substr(line,0,40).trim(),
        id: substr(line,41,89).trim(),
        version: substr(line,90,104).trim(),
        newVersion: substr(line,105,113).trim(),
        source: substr(line,113,120).trim(),
    }
}


// exec('winget list', function(err,stdout,stderr) {
//     // console.log(stdout, stderr);
//     // 按长度分割 stdout
//     let lines = stdout.split("\n");
//     lines.shift();
//     let cmdLength = lines.shift().trim().length;
//     console.log(cmdLength);
//     let items = [];
//     for (const line of lines) {
//         items.push(matchWingetList(line,cmdLength));
//     }
//     console.log(items);
//
// })
