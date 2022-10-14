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


    async search(word = "", page = 1, size = 100) {}

    async install(itemData) {}

}

module.exports = IPackage;
