// https://scoopsearch.search.windows.net/indexes/apps/docs/search

const axios = require('axios');
const {exec} = require("child_process");
const IPackage = require("./IPackage");


class Scoop extends IPackage{

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
        if (this.checkCache("scoop2_" + word + page)) {
            return this.checkCache("scoop2_" + word + page);
        }

        let data = await this.#doSearch(word, page, size);
        let items = [];

        for (const item of data.value) {
            let repository = item.Metadata.Repository;
            let bucketName = null;
            let name = item.Name;

            if (repository.includes("https://github.com/")){
                bucketName = repository.replace("https://github.com/","").replace("/","_");
            }
            let cmdStr = `scoop bucket add ${bucketName} ${repository} & scoop install ${name}`;

            items.push({
                title: item.Name + " - v" + item.Version + " - #" + item.Metadata.AuthorName,
                description: item.Description,
                icon: this.icon(item.Homepage),
                name: item.Name,
                command: cmdStr
            })
        }

        let rdata = {
            total: data["@odata.count"],
            totalPage: Math.ceil(data["@odata.count"] / size),
            items: items,
        };

        this.cache("scoop2_" + word + page, rdata);

        return rdata;
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

        let installScriptPath = utools.getPath('downloads') + '/install.ps1';
        let command = `irm "https://ghproxy.com/https://raw.githubusercontent.com/scoopinstaller/install/master/install.ps1" -outfile '${installScriptPath}';${installScriptPath} -ScoopDir '${installPath}' -ScoopGlobalDir '${installPath}\\Apps';`

        return this.execCommand(command, 'powershell');
    }

    async install(itemData){
        return new Promise((resolve, reject) => {
            let name = itemData.name;

            var command = itemData.command;
            var commandType = 'cmd';

            utools.showNotification("开始安装：" + name);

            this.execCommand(command, commandType).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            })
        })
    }

    async isInstall(){
        return await this.doCheckIsInstall("where scoop", "\\shims\\scoop");
    }
}




module.exports = new Scoop();
