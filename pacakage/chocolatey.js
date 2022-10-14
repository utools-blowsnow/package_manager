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

        const data = {
            total: parseInt(total),
            totalPage: Math.ceil(parseInt(total) / size),
            items: items,
        };

        this.cache("chocolatey_" + word + page, data );

        return data;
    }

    async install(itemData){
        return new Promise((resolve, reject) => {

            utools.showNotification("开始安装：" + itemData.name);

            var cmdStr = itemData.command;

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

module.exports = new Chocolatey();
