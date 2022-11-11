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
        } else if (file.endsWith(".yml") || file.endsWith(".yaml")) {  // 判断是否是yml文件
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

    for (const path of list) {
        //console.log('traverseApps',path);
        let data = loadYamlData(path);
        let currentPackage = data.PackageIdentifier;
        let currentVersion = data.PackageVersion;

        let appData = apps[currentPackage] = apps[currentPackage] || {versions: {}};
        apps[currentPackage].versions[currentVersion] = appData.versions[currentVersion] || {locals: {}};

        let versionData = apps[currentPackage].versions[currentVersion];

        if (path.includes(".locale.")) {
            versionData.locals[data.PackageLocale] = _resolveVersionLocalData(data);
        } else {
            let newData = _resolveVersionAppData(data);
            versionData = {...versionData, ...newData};
        }

        apps[currentPackage].versions[currentVersion] = versionData;
    }

    // 处理获取最后一个版本
    resolveAppLastVersion(apps);

    return apps;
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

function _resolveVersionAppData(data) {
    let newData = {};

    if (data.DefaultLocale !== undefined) newData.DefaultLocale = data.DefaultLocale;
    // if (data.ManifestType !== undefined) version.ManifestType = data.ManifestType;
    // if (data.ManifestVersion !== undefined) version.ManifestVersion = data.ManifestVersion;
    // if (data.Installers !== undefined) version.Installers = data.Installers;
    if (data.InstallerType !== undefined) newData.InstallerType = data.InstallerType;
    if (data.ReleaseDate !== undefined) newData.ReleaseDate = data.ReleaseDate;
    if (data.Platform !== undefined) newData.Platform = data.Platform;

    return newData;
}

function _resolveVersionLocalData(data) {
    return {
        Publisher: data.Publisher ?? null,
        PublisherUrl: data.PublisherUrl ?? null,
        Description: data.Description ?? data.ShortDescription ?? null,
        License: data.License ?? null,
        ReleaseNotes: data.ReleaseNotes ?? [],
        ReleaseNotesUrl: data.ReleaseNotesUrl ?? null,
    }
}

function resolveAppLastVersion(apps) {

    for (const name in apps) {
        let app = apps[name];
        let lastVersion = null;
        for (const version in app.versions) {

            if (lastVersion == null) {
                lastVersion = version;
            } else if (versionCode(version) > versionCode(lastVersion)) {
                lastVersion = version;
            }
        }

        apps[name].version = lastVersion;
    }

}

function versionCode(version) {
    if (!version) return null;
    version = version.replace(".", "");
    version = version.replace(" ", "");

    // 1.0.1.1  1.0.0.100
    let num = "0";
    for (let i = 0; i < version.length; i++) {
        num = num + "" + version.charCodeAt(i);
    }

    return parseInt(num);
}

function writeJson(apps) {
    fs.writeFileSync('./winget.json', JSON.stringify(apps));
}


async function mainTest() {


    const tempDir = path.join(require('os').tmpdir(), "winget-pkgs");
    console.log(tempDir);

    // await cloneManifestRepository(tempDir );

    console.log('cloneManifestRepository done');

    traverseDir(path.join(tempDir,"manifests"));

    let apps = traverseApps(manifestArray);


    writeJson(apps);

}


mainTest();





