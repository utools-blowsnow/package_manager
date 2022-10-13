const axios = require('axios');
const cheerio = require('cheerio');
(async () => {
    let result = await axios({
        url: 'https://community.chocolatey.org/packages?q=' + '&page=' + 1,
    });

    const $ = cheerio.load(result.data);
    const total = $('#package > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > p').text().replace("Displaying Results 1 - 30 of ", "");
    $(".package-list-view > li").each((index, item) => {
        var children = $(item).find(".align-items-sm-center > a")[0].children;
        var name = $(children[0]).text();
        var version = $(children[1]).text();
        var desc = $(item).find("> div:nth-child(1) > p").text().trim();
        var icon = $(item).find(".package-icon > img").attr("src");
        var command = $(item).find("> .package-list-align > div > div > input").val();
        console.log(name,version,command);
    });

})()
