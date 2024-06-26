// https://scoopsearch.search.windows.net/indexes/apps/docs/search

const axios = require('axios');
const {exec} = require("child_process");
const cheerio = require('cheerio');

const IPackage = require("./IPackage");
class Chocolatey extends IPackage{
    constructor() {
        super();
    }

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

    async installApp(){
        let installPath = utools.showOpenDialog({
            title: '保存安装位置',
            buttonLabel: '保存',
            properties: ['openDirectory']
        })

        if (!installPath){
            return false;
        }
        let installScriptPath = utools.getPath('downloads') + '/chocolateyInstall.ps1';
        let command = `irm "https://community.chocolatey.org/install.ps1" -outfile '${installScriptPath}';$env:ChocolateyInstall='${installPath}';${installScriptPath};`

        return this.execCommand(command, 'powershell');
    }

    async install(itemData){
        if (!await this.isInstall()) {
            utools.showNotification('未安装Choco，请点我安装', 'installChocolatey');
            return;
        }
        return new Promise(async (resolve, reject) => {
            var command = itemData.command;
            var commandType = 'cmd';

            if (!command) {
                reject('无可用安装包');
                return;
            }


            utools.showNotification("开始安装：" + itemData.name);

            console.log("开始安装：" + itemData.name + " - " + itemData.command, itemData);

            this.execCommand(command, commandType).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            })
        })
    }

}

module.exports = new Chocolatey();
