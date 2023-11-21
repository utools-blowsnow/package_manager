const {exec} = require("child_process");
const axios = require("axios");

class IPackage {
    domain(url) {
        // 从url中提取域名
        let matches = url.match(/^https?:\/\/([^\/]+)/);
        if (matches) {
            return matches[1];
        } else {
            return url;
        }
    }

    icon(url, defaultIcon = './logo.png', size = 32) {
        if (!url) return defaultIcon;
        let domain = this.domain(url);
        return 'https://favicon.yandex.net/favicon/' + domain + '?size=' + size;
    }

    cache(key, data) {
        localStorage.setItem(key, JSON.stringify({
            time: new Date().getTime(),
            data: data
        }));
    }

    /**
     *
     * @param key
     * @param time 毫秒
     * @returns {null|*}
     */
    checkCache(key, time = 1000 * 60 * 60) {
        if (localStorage.getItem(key)) {
            let object = JSON.parse(localStorage.getItem(key));
            // 判断时间是否过期  1小时
            if (object.time + time > new Date().getTime()) {
                return object.data;
            }
        }
        return null;
    }


    async search(word = "", page = 1, size = 100) {

    }

    async install(itemData) {

    }

    async execCommand(command, commandType = 'cmd') {
        return new Promise((resolve, reject) => {
            let commandStr = '';
            if (commandType === 'cmd') {
                commandStr = `start cmd.exe /k  "${command}"`;
            }else if (commandType === 'powershell'){
                commandStr = `start powershell.exe -NoExit -command "${command}"`;
            }
            exec(commandStr, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                resolve(stdout);
            });
        });
    }

    async execCommandNowait(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                resolve(stdout);
            });
        });
    }

    async doCheckIsInstall(cmd,checkStr){
        const exec = require('child_process').exec;

        console.log('doCheckIsInstall',cmd,checkStr);

        return new Promise((resolve, reject) => {
            exec(cmd,function (error, stdout, stderr) {
                console.log("doCheckIsInstall",cmd,stdout);
                if (error) {
                    resolve(false);
                }
                resolve(stdout.includes(checkStr));
            });
        })
    }

    async isInstall(){ return true;}

    async downloadByGithub(githubUrl) {
        return await Promise.race([
            axios.get("https://ghps.cc/" + githubUrl),
            axios.get("https://hub.gitmirror.com/" + githubUrl)
        ]);
    }
}




module.exports = IPackage;
