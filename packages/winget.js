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

    icon(url, defaultIcon = './logo.png', size = 32) {
        if (!url) return defaultIcon;
        if (url.toLowerCase() === 'winget'){
            return 'https://favicon.yandex.net/favicon/microsoft.com?size=' + size;
        }else if (url.toLowerCase() === 'localpc'){
            return 'https://favicon.yandex.net/favicon/microsoft.com?size=' + size;
        }else if (url.toLowerCase() === 'msstore'){
            return 'https://favicon.yandex.net/favicon/microsoft.com?size=' + size;
        }else if (url.toLowerCase() === 'android'){
            return 'https://favicon.yandex.net/favicon/android.com?size=' + size;
        }else if (url.toLowerCase() === 'steam'){
            return 'https://favicon.yandex.net/favicon/steam.com?size=' + size;
        }else if (url.toLowerCase() === 'gog'){
            return 'https://favicon.yandex.net/favicon/google.com?size=' + size;
        }else if (url.toLowerCase() === 'uplay'){
            return 'https://favicon.yandex.net/favicon/uplay.com?size=' + size;
        }
        return defaultIcon;
    }

    parseWingetSearch(out){
        let rawOutput = "";
        let hasShownId = false;
        let noSourcesAvailable = false;
        let idPosition, versionPosition, sourcePosition;
        let packages = [];

        out.split("\n").forEach((line) => {
            if (line) {
                rawOutput += line;

                if (!hasShownId) {
                    if (line.includes(" Id ")) {
                        line = line.substring(line.indexOf("Name"))

                        hasShownId = true;

                        idPosition = line.split("Id")[0].length;
                        versionPosition = line.split("Version")[0].length;
                        sourcePosition = line.split("Source")[0].length;

                        if (line.length === sourcePosition) {
                            noSourcesAvailable = true;
                            console.log("🟡 Winget reported no sources on getPackagesForQuery");
                        }
                    }else if (line.includes(" ID ")) {
                        line = line.substring(line.indexOf("名称"))

                        hasShownId = true;

                        idPosition = line.split("ID")[0].length;
                        versionPosition = line.split("版本")[0].length;
                        sourcePosition = line.split("源")[0].length;

                        if (line.length === sourcePosition) {
                            noSourcesAvailable = true;
                            console.log("🟡 Winget reported no sources on getPackagesForQuery");
                        }
                    }
                } else if (line.includes("---")) {
                    // Do nothing for lines containing "---"
                } else {
                    try {
                        let name = line.slice(0, idPosition).trim();
                        let idVersionSubstr = line.slice(idPosition).trim();

                        if (name.includes("  ")) {
                            let oName = name;

                            while (oName.includes("  ")) {
                                oName = oName.replace("  ", " ");
                            }

                            idVersionSubstr = oName.split(" ").pop() + idVersionSubstr;
                            name = oName.split(" ").slice(0, -1).join(" ");
                        }

                        idVersionSubstr = idVersionSubstr.replace(/\t/g, " ");

                        while (idVersionSubstr.includes("  ")) {
                            idVersionSubstr = idVersionSubstr.replace("  ", " ");
                        }

                        let iOffset = 0;
                        let id = idVersionSubstr.split(" ")[iOffset];
                        let ver = idVersionSubstr.split(" ")[iOffset + 1];
                        let source = "";
                        let tag = "";

                        if (!noSourcesAvailable) {
                            source = idVersionSubstr.split(" ")[iOffset + 2];
                        }

                        if (id.length === 1) {
                            iOffset += 1;
                            id = idVersionSubstr.split(" ")[iOffset];
                            ver = idVersionSubstr.split(" ")[iOffset + 1];

                            if (!noSourcesAvailable) {
                                source = idVersionSubstr.split(" ")[iOffset + 2];
                            }
                        }

                        if (ver.trim() === "<" || ver.trim() === "-") {
                            iOffset += 1;
                            ver = idVersionSubstr.split(" ")[iOffset + 1];

                            if (!noSourcesAvailable) {
                                source = idVersionSubstr.split(" ")[iOffset + 2];
                            }
                        }

                        if (noSourcesAvailable) {
                            source = "Winget";
                        } else if (source.trim() === "") {
                            source = "Winget";
                        }

                        if (source.includes("Tag") || source.includes("Moniker") || source.includes("Command")) {
                            source = "Winget";
                        }

                        source = source.trim();

                        if (!name.includes("  ")) {
                            packages.push({name, id, ver, source});
                        } else {
                            name = name.replace(/  /g, "#").replace(/# /g, "#").replace(/ #/g, "#");

                            while (name.includes("##")) {
                                name = name.replace("##", "#");
                            }

                            console.log(`🟡 package ${name} failed parsing, going for method 2...`);
                            packages.push({name, id, ver, source});
                        }
                    } catch (e) {
                        packages.push({name: line.slice(0, idPosition).trim(), id: line.slice(idPosition, versionPosition).trim(), ver: line.slice(versionPosition, sourcePosition).trim(), source: `Winget: ${line.slice(sourcePosition).trim()}`});

                    }
                }

            }
        });

        return packages;
    }

    async search(word="", page = 1, size = 100){
        if (!await this.isInstall()) {
            utools.showNotification('未安装winget');
            return;
        }
        if (word === "") word = "google";
        if (this.checkCache("winget_" + word + page)) {
            return this.checkCache("winget_" + word + page);
        }
        let command = `winget search ${word} --exact --accept-source-agreements`;
        let out = await this.execCommandNowait(command);
        let packages = this.parseWingetSearch(out);

        let items = [];
        packages.forEach((item,index) => {
            items.push({
                title: item.name + " - " + item.ver + " - #" + item.source,
                description: item.id,
                icon: this.icon(item.source),
                name: item.name
            })
        })

        let rdata = {
            total: items.length,
            totalPage: 1,
            items: items,
        }

        this.cache("winget_" + word + page, rdata);

        return rdata;
    }

    async install(itemData){
        if (!await this.isInstall()) {
            utools.showNotification('未安装winget');
            return;
        }
        return new Promise((resolve, reject) => {

            let installPath = utools.showOpenDialog({
                title: '保存程序安装位置',
                buttonLabel: '保存',
                properties: ['openDirectory']
            })

            if (!installPath){
                return false;
            }

            utools.showNotification("开始安装：" + itemData.name);

            var cmdStr = `winget install ${itemData.name} -i -l "${installPath}"`;

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
