const os = require('os')
const logger = require('./lib/logger').createLogger(os.tmpdir() + '\\package_manager.log');

const packages = {
    "scoop": require("./pacakage/scoop.js"),
    "winget": require("./pacakage/winget.js"),
    "chocolatey": require("./pacakage/chocolatey.js"),
}

const feture = function(type){
    let helper;
    try {
        helper = packages[type];
    }catch (e) {
        logger.error('error',e);
        throw e;
    }
    return { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list",  // 列表模式
        args: {
            // 进入插件应用时调用（可选）
            enter: async ({ code, type, payload }, callbackSetList) => {
                console.log(code, type, payload);
                let items = (await helper.search()).items;
                // 如果进入插件应用就要显示列表数据
                callbackSetList(items);
            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: async (action, searchWord, callbackSetList) => {
                // 获取一些数据
                let items = (await helper.search(searchWord)).items;
                // 执行 callbackSetList 显示出来
                callbackSetList(items)
            },
            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                // window.utools.hideMainWindow()

                try {
                    helper.install(itemData).then((data)=>{
                        // utools.showNotification("安装成功：" + itemData.title);
                    }).catch((err)=>{
                        utools.showNotification("安装失败：" + err);
                    })
                }catch (e){
                    console.error("安装失败：" + err);
                }


                // window.utools.outPlugin()
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索"
        }
    }
}

window.exports = {
    "scoop": feture("scoop"),
    "winget": feture("winget"),
    "chocolatey": feture("chocolatey"),
}
