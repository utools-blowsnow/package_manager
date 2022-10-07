// https://scoopsearch.search.windows.net/indexes/apps/docs/search

const axios = require('axios');
const {exec} = require("child_process");


async function search(word, page = 1, size = 20) {
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

async function buildSearch(word="", page = 1, size = 100){
    let data = await search(word, page, size);
    let items = [];


    for (const item of data.value) {
        items.push({
            title: item.Name + " - v" + item.Version + " - #" + item.Metadata.AuthorName,
            description: item.Description,
            info: item
        })
    }


    return {
        total: data["@odata.count"],
        totalPage: Math.ceil(data["@odata.count"] / size),
        items: items,
    }
}

async function install(itemData){

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

        var cmdStr = `scoop bucket add ${bucketName} ${repository} && scoop install ${name}`;

        utools.copyText(cmdStr);

        resolve();
        // exec(cmdStr, function(err,stdout,stderr){
        //     console.log(stdout,stderr);
        //     if(err) {
        //         reject(stderr);
        //     } else {
        //         resolve(stdout);
        //     }
        // })
    })


}



async function search(word = "", page = 1, size = 100) {
    let result = await exec(`winget search ${word} --source winget --id --name --moniker --tag --command --count ${size} --page ${page}`);
    if (result.code !== 0) {
        throw new Error(result.stderr);
    }

    let items = result.stdout.split("\n").filter(item => item.trim() !== "").map(item => {
        let [id, name, moniker, tag, command] = item.split(" | ");
        return {
            title: name,
            description: tag,
            info: {
                id: id,
                name: name,
                moniker: moniker,
                tag: tag,
                command: command
            }
        }
    });

    return {
        total: items.length,
        totalPage: 1,
        items: items,
    }
}

async function install(itemData) {

    return new Promise((resolve, reject) => {
        let cmdStr = `winget install ${itemData.info.id}`;

        utools.copyText(cmdStr);

        resolve();
    })
}


exports.buildSearch = buildSearch;
exports.install = install;
