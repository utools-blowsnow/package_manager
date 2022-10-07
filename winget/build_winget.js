// 生成winget的json列表
const {exec} = require("child_process");
const fs = require("fs");
const path = require("path");
const yaml = require('js-yaml')

let manifestArray = [];

/**
 * 枚举目录文件
 * @param dir
 */
function traverseDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file)
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverseDir(fullPath)
        } else if(file.endsWith(".yml") || file.endsWith(".yaml")){  // 判断是否是yml文件
            manifestArray.push(fullPath)
        }
    })
}
/**
 * 添加应用
 * 应用名称 应用介绍 应用作者
 */
function traverseApps(list){

    console.log('traverseApps',list.length);

    let apps = {};
    let lastPackageIdentifier = null;
    // 加载yml
    for (const path of list) {
        //console.log('traverseApps',path);
        let data = loadYamlData(path);
        let currentPackage = data.PackageIdentifier;
        let currentVersion = data.PackageVersion;

        let versions = apps[currentPackage] !== undefined ? apps[currentPackage] : {};
        let version = versions[currentVersion] !== undefined ? versions[currentVersion] : {};

        // 获取当前版本内容
        // 判断是不是语言文件
        if(path.includes(".locale.")){
            if (version.locals === undefined) version.locals = {};
            version.locals[data.PackageLocale] = {
                Tags: data.Tags??[],
                Publisher: data.Publisher??null,
                PublisherUrl: data.PublisherUrl??null,
                Description: data.Description??data.ShortDescription??null,
                License: data.License??null,
                ReleaseNotes: data.ReleaseNotes??[],
                ReleaseNotesUrl: data.ReleaseNotesUrl??null,
            }

        }else{
            version = mergeVersionInfo(version,data);
        }

        versions[currentVersion] = version;

        // 包数据
        apps[currentPackage] = versions;

    }

    return apps;
}

function mergeVersionInfo(version,data){
    if (data.DefaultLocale !== undefined) version.DefaultLocale = data.DefaultLocale;
    // if (data.ManifestType !== undefined) version.ManifestType = data.ManifestType;
    // if (data.ManifestVersion !== undefined) version.ManifestVersion = data.ManifestVersion;
    // if (data.Installers !== undefined) version.Installers = data.Installers;
    if (data.InstallerType !== undefined) version.InstallerType = data.InstallerType;
    if (data.ReleaseDate !== undefined) version.ReleaseDate = data.ReleaseDate;
    if (data.Platform !== undefined) version.Platform = data.Platform;
    return version;
}

function loadYamlData(path){
    try {
        return yaml.load(fs.readFileSync(path, 'utf8'));
    }catch (e){
        return false;
    }
}

function cloneManifestRepository(tempDir){
    return new Promise((resolve, reject) => {
      if (fs.existsSync(tempDir)){
          console.log('cloneManifestRepository pull');
          // 直接 git pull
          exec(`git pull`, {cwd: tempDir},function (err,stdout,stderr) {
              if(err) {
                  reject(stderr);
              }else{
                  resolve(tempDir);
              }
          })
      }else{
          console.log('cloneManifestRepository clone');
          exec('git clone https://github.com/microsoft/winget-pkgs ' + tempDir,function (err,stdout,stderr) {
              console.log(stdout,stderr);
              if(err) {
                  reject(stderr);
              }else{
                  resolve(tempDir);
              }
          })
      }
    })
}

function versionCode(version) {
    if (!version) return null;
    version = version.replace(".","");
    version = version.replace(" ","");

    let num = "0";
    for (let i = 0; i < version.length; i++) {
        num = num + "" + version.charCodeAt(i);
    }

    return parseInt(num);
}

function handleAppVersion(apps){
    let newApps = {};

    for (const [name, versions] of Object.entries(apps)) {
        let lastVersion = null;
        let lastVersionItem = null;
        Object.keys(versions).forEach(function(version,index) {
            let item = versions[version];

            if(versionCode(version) > versionCode(lastVersion)){
                lastVersion = version;
                lastVersionItem = {
                    version: version,
                    ...item
                };
            }

            if (lastVersionItem == null) {
                lastVersion = version;
                lastVersionItem = {
                    version: version,
                    ...item
                };
            }
        })

        newApps[name] = lastVersionItem;
    }


    return newApps;
}

async function mainTest() {

    const tempDir = require('os').tmpdir() + "\\winget-pkgs";
    console.log(tempDir);

    await cloneManifestRepository(tempDir );

    console.log('cloneManifestRepository done');

    traverseDir(tempDir + '\\manifests');

    let apps = traverseApps(manifestArray);

    apps = handleAppVersion(apps);

    fs.writeFileSync('./winget.json', JSON.stringify(apps));

}


mainTest();





