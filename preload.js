const feature = function(type){
    let helper = require('./packages/'+type+'.js');
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

const featureInstall = function(type){
    let helper = require('./packages/'+type+'.js');
    return { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "none",  // 列表模式
        args: {
            // 进入插件应用时调用（可选）
            enter: async ({ code, type, payload }) => {
                // action = { code, type, payload }
                utools.hideMainWindow()

                try {
                    await helper.installApp();
                }catch (e){
                    utools.showNotification("安装失败：" + e.message);
                }

                // do some thing
                utools.outPlugin()
            }
        }
    }
}
window.exports = {
    "scoop": feature("scoop"),
    "winget": feature("winget"),
    "chocolatey": feature("chocolatey"),

    "installScoop": featureInstall("scoop"),
    "installChocolatey": featureInstall("chocolatey"),
}
