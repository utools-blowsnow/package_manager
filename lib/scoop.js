// https://scoopsearch.search.windows.net/indexes/apps/docs/search

const axios = require('axios');
const {exec} = require("child_process");


class Scoop{
    cache(key,data){
        localStorage.setItem(key, JSON.stringify({
            time: new Date().getTime(),
            data: data
        }));
    }
    checkCache(key){
        if (localStorage.getItem(key)) {
            let object =  JSON.parse(localStorage.getItem(key));
            // 判断时间是否过期  1小时
            if (object.time + 3600 * 1000 > new Date().getTime()) {
                return object.data;
            }
        }
        return null;
    }

    async #doSearch(word, page = 1, size = 20) {
        let skip = (page - 1) * size;

        let result = await axios({
            url: 'https://scoopsearch.search.windows.net/indexes/apps/docs/search?api-version=2020-06-30',
            method: 'post',
            responseType: 'json',
            headers:{
                'Referer': 'https://scoop.sh/',
                'api-key': 'DC6D2BBE65FC7313F2C52BBD2B0286ED'
            },
            data: {
                "count": true,
                "search": word,
                "searchMode": "all",
                "filter": "Metadata/OfficialRepositoryNumber eq 1",
                "orderby": "search.score() asc, Metadata/OfficialRepositoryNumber asc, NameSortable desc",
                "skip": skip,
                "top": size,
                "select": "Id,Name,NamePartial,NameSuffix,Description,Homepage,License,Version,Metadata/Repository,Metadata/FilePath,Metadata/AuthorName,Metadata/OfficialRepository,Metadata/RepositoryStars,Metadata/Committed,Metadata/Sha",
                "highlight": "Name,NamePartial,NameSuffix,Description,Version,License,Metadata/Repository,Metadata/AuthorName",
                "highlightPreTag": "<mark>",
                "highlightPostTag": "</mark>"
            }
        });

        return result.data;
    }

    async search(word="", page = 1, size = 100){
        if (this.checkCache("scoop_" + word + page)) {
            return this.checkCache("scoop_" + word + page);
        }

        let data = await this.#doSearch(word, page, size);
        let items = [];

        for (const item of data.value) {
            items.push({
                title: item.Name + " - v" + item.Version + " - #" + item.Metadata.AuthorName,
                description: item.Description,
                icon: item.Homepage ? 'https://favicon.yandex.net/favicon/' + item.Homepage + '?size=32' : './logo.png',
                info: item
            })
        }

        let rdata = {
            total: data["@odata.count"],
            totalPage: Math.ceil(data["@odata.count"] / size),
            items: items,
        };

        this.cache("scoop_" + word + page, rdata);

        return rdata;
    }

    async install(itemData){
        return new Promise((resolve, reject) => {
            let repository = itemData.info.Metadata.Repository;
            let bucketName = null;
            let name = itemData.info.Name;

            if (repository.includes("https://github.com/")){
                bucketName = repository.replace("https://github.com/","").replace("/","_");
            }

            if (!bucketName){
                reject("无法识别的仓库地址");
                return;
            }

            utools.showNotification("开始安装：" + name);

            var cmdStr = `scoop bucket add ${bucketName} ${repository} & scoop install ${name}`;

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




module.exports = new Scoop();
