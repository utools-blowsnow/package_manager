// https://scoopsearch.search.windows.net/indexes/apps/docs/search

const axios = require('axios');
const {exec} = require("child_process");
const cheerio = require('cheerio');

const IPackage = require("./IPackage");
class Chocolatey extends IPackage{

    async search(word="", page = 1, size = 30){
        if (this.checkCache("chocolatey_" + word + page)) {
            return this.checkCache("chocolatey_" + word + page);
        }
        let items = [];

        let result = await axios({
            url: 'https://community.chocolatey.org/packages?q=' + word + '&page=' + page,
        });

        const $ = cheerio.load(result.data);
        const total = $('#package > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > p').text().replace("Displaying Results 1 - 30 of ", "");
        $(".package-list-view > li").each((index, item) => {
            var children = $(item).find(".align-items-sm-center > a")[0].children;
            var name = $(children[0]).text();
            var version = $(children[1]).text();
            var desc = $(item).find("> div:nth-child(1) > p").text().trim();
            var command = $(item).find("> .package-list-align > div > div > input").val();
            var icon = 'https://community.chocolatey.org' + $(item).find(".package-icon > img").attr("src");
            items.push({
                title: name + " - v" + version,
                description: desc,
                icon: icon,
                name: name,
                command: command,
            })
            console.log(name,version,command);
        });


        // 未安装的话显示安装
        if (!await this.isInstall()){
            items.unshift({
                title: "安装 Chocolatey",
                description: "未安装 Chocolatey，点击安装",
                icon: "https://chocolatey.org/assets/images/global-shared/logo-square.svg",
                name: "chocolatey",
                command: 'install_package'
            })
        }

        const data = {
            total: parseInt(total),
            totalPage: Math.ceil(parseInt(total) / size),
            items: items,
        };

        this.cache("chocolatey_" + word + page, data );

        return data;
    }

    async isInstall(){
        return await this.doCheckIsInstall("where choco", "\\choco.exe");
    }
    getInstallCommand(){
        let installPath = utools.showOpenDialog({
            title: '保存安装位置',
            buttonLabel: '保存',
            properties: ['openDirectory']
        })

        if (!installPath){
            return false;
        }

        let command = `irm "https://community.chocolatey.org/install.ps1" -outfile '${installPath}\\install.ps1';$env:ChocolateyInstall='${installPath}';${installPath}\\install.ps1;`

        return command;
    }

    async install(itemData){
        return new Promise((resolve, reject) => {
            var command = itemData.command;
            var commandType = 'cmd';

            if (!command){
                reject('无可用安装包');
                return;
            }

            if (command === 'install_package'){
                command = this.getInstallCommand();
                commandType = 'powershell';
                if (command === false){
                    reject('取消安装');
                    return;
                }
            }

            utools.showNotification("开始安装：" + itemData.name);

            console.log("开始安装：" + itemData.name + " - " + itemData.command,itemData);

            this.execCommand(command, commandType).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            })
        })
    }

}

module.exports = new Chocolatey();
