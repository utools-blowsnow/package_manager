const {exec} = require("child_process");
const fs = require("fs");
const axios = require("axios");
const os = require("os");
const path = require("path");

let apps = []; //require("../winget/winget.json");

const IPackage = require("./IPackage");
const tempPath = os.tmpdir();

class Winget extends IPackage{

    async downloadAppData(wingetJsonPath,wingetUpdatePath){
        // 从网络获取最新的 winget 应用列表
        let res = await this.downloadByGithub("https://raw.githubusercontent.com/utools-blowsnow/package_manager/master/winget.json");
        let data = res.data;

        // 保存到本地
        fs.writeFileSync(wingetJsonPath, JSON.stringify(data));
        fs.writeFileSync(wingetUpdatePath, new Date().getTime().toString());

        return data;
    }

    async initApps() {
        if (apps.length > 0) {
            return apps;
        }
        let wingetUpdatePath = path.join(tempPath, "wingetupdatye.txt");
        let lastUpdate = fs.existsSync(wingetUpdatePath) ? fs.readFileSync(wingetUpdatePath).toString() : "";
        // 判断是否需要强制更新 有效期：1天
        let isNeedForceUpdate = false;
        if (lastUpdate === "" || new Date().getTime() - parseInt(lastUpdate) > 1000 * 60 * 60 * 24 * 1) {
            isNeedForceUpdate = true;
        }

        // 已经存在文件直接读取
        let wingetJsonPath = path.join(tempPath, "winget.json");
        console.log(wingetJsonPath);
        if (fs.existsSync(wingetJsonPath)) {
            // 尝试偷偷更新数据
            if (isNeedForceUpdate){
                this.downloadAppData(wingetJsonPath,wingetUpdatePath);
            }
            const json = fs.readFileSync(wingetJsonPath);
            apps = JSON.parse(json);
            return apps;
        }

        // 正在更新winget数据
        utools.showNotification("正在更新winget数据");

        // 从网络获取最新的 winget 应用列表
        let data = await this.downloadAppData(wingetJsonPath,wingetUpdatePath);

        utools.showNotification("已加载最新的winget数据：" + Object.keys(data).length + "个应用");

        return data;
    }

    async search(word="", page = 1, size = 100){
        apps = await this.initApps();

        const appNames = Object.keys(apps);

        console.log('appNames', appNames);

        let items = [];

        appNames.forEach((appName,index) => {

            let app = apps[appName];
            // console.log(app.version,app.versions);
            let appVersion = app.versions[app.version];
            let locals = appVersion.locals;
            // 优先中文
            let local = locals['zh-CN'] ?? locals[appVersion.DefaultLocale ?? 'en-US'];
            if (!local) {
                return;
            }

            let description = local.Description ?? local.ShortDescription ?? "";

            if (appName.toLowerCase().includes(word.toLowerCase()) || description.toLowerCase().includes(word.toLowerCase()) || word === "") {

                items.push({
                    title: appName + " - v" + app.version + " - #" + (local.Publisher ?? local.Author),
                    description: description,
                    icon: this.icon(local.PublisherUrl),
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
        if (!await this.isInstall()) {
            utools.showNotification('未安装winget');
            return;
        }
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

    async installApp() {
        let command = `Install-Module -Name Microsoft.WinGet.Client`
        return this.execCommand(command, 'powershell');
    }

    async isInstall() {
        return await this.doCheckIsInstall("where winget", "\\winget");
    }
}




module.exports = new Winget();
