const {exec} = require("child_process");
const fs = require("fs");
const axios = require("axios");
const os = require("os");

const apps = require("../winget/winget.json");
const appNames = Object.keys(apps);

class Winget{

    async search(word="", page = 1, size = 100){
        let items = [];

        appNames.forEach((appName,index) => {

            if (appName.toLowerCase().includes(word.toLowerCase()) || word === ""){

                let app = apps[appName];
                // 优先中文
                let local = {};
                if (app.locals){
                    local = app.locals['zh-CN'] ?? app.locals[app.DefaultLocale??'en-US'];
                }

                items.push({
                    title: appName + " - v" + app.version + " - #" + (local.Publisher ?? local.Author),
                    description: local.Description,
                    icon: local.PublisherUrl ? 'https://favicon.yandex.net/favicon/' + local.PublisherUrl + '?size=32' : './logo.png',
                    name: appName
                })
            }
        })


        return {
            total: appNames.length,
            totalPage: Math.ceil(appNames.length / size),
            items: items,
        }
    }

    async install(itemData){
        return new Promise((resolve, reject) => {

            utools.showNotification("开始安装：" + itemData.name);

            var cmdStr = `winget install ${itemData.name}`;

            // 记录一个BUG 同时引用 spawn 和 exec 会导致 utools exec 调用不起来
            exec(`start cmd.exe /k "${cmdStr}"`, function(err,stdout,stderr){
                if(err) {
                    reject(stderr);
                } else {
                    resolve(stdout);
                }
            })
        })
    }
}




module.exports = new Winget();
