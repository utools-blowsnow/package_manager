const {exec} = require("child_process");

async function execCommand(command, commandType = 'cmd') {
    return new Promise((resolve, reject) => {
        let commandStr = '';
        if (commandType === 'cmd') {
            commandStr = `start cmd.exe /k  "${command}"`;
        } else if (commandType === 'powershell') {
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


function parseWingetSearch(out){
    let rawOutput = "";
    let hasShownId = false;
    let noSourcesAvailable = false;
    let idPosition, versionPosition, sourcePosition;
    let packages = [];

    out.split("\n").forEach((line) => {
        if (line) {
            rawOutput += line;

            if (!hasShownId) {
                if (line.includes(" Id ")) {
                    line = line.substring(line.indexOf("Name"))

                    hasShownId = true;

                    idPosition = line.split("Id")[0].length;
                    versionPosition = line.split("Version")[0].length;
                    sourcePosition = line.split("Source")[0].length;

                    if (line.length === sourcePosition) {
                        noSourcesAvailable = true;
                        console.log("🟡 Winget reported no sources on getPackagesForQuery");
                    }
                }else if (line.includes(" ID ")) {
                    line = line.substring(line.indexOf("名称"))

                    hasShownId = true;

                    idPosition = line.split("ID")[0].length;
                    versionPosition = line.split("版本")[0].length;
                    sourcePosition = line.split("源")[0].length;

                    if (line.length === sourcePosition) {
                        noSourcesAvailable = true;
                        console.log("🟡 Winget reported no sources on getPackagesForQuery");
                    }
                }
            } else if (line.includes("---")) {
                // Do nothing for lines containing "---"
            } else {
                try {
                    let name = line.slice(0, idPosition).trim();
                    let idVersionSubstr = line.slice(idPosition).trim();

                    if (name.includes("  ")) {
                        let oName = name;

                        while (oName.includes("  ")) {
                            oName = oName.replace("  ", " ");
                        }

                        idVersionSubstr = oName.split(" ").pop() + idVersionSubstr;
                        name = oName.split(" ").slice(0, -1).join(" ");
                    }

                    idVersionSubstr = idVersionSubstr.replace(/\t/g, " ");

                    while (idVersionSubstr.includes("  ")) {
                        idVersionSubstr = idVersionSubstr.replace("  ", " ");
                    }

                    let iOffset = 0;
                    let id = idVersionSubstr.split(" ")[iOffset];
                    let ver = idVersionSubstr.split(" ")[iOffset + 1];
                    let source = "";
                    let tag = "";

                    if (!noSourcesAvailable) {
                        source = idVersionSubstr.split(" ")[iOffset + 2];
                    }

                    if (id.length === 1) {
                        iOffset += 1;
                        id = idVersionSubstr.split(" ")[iOffset];
                        ver = idVersionSubstr.split(" ")[iOffset + 1];

                        if (!noSourcesAvailable) {
                            source = idVersionSubstr.split(" ")[iOffset + 2];
                        }
                    }

                    if (ver.trim() === "<" || ver.trim() === "-") {
                        iOffset += 1;
                        ver = idVersionSubstr.split(" ")[iOffset + 1];

                        if (!noSourcesAvailable) {
                            source = idVersionSubstr.split(" ")[iOffset + 2];
                        }
                    }

                    if (noSourcesAvailable) {
                        source = "Winget";
                    } else if (source.trim() === "") {
                        source = "Winget";
                    }

                    if (source.includes("Tag") || source.includes("Moniker") || source.includes("Command")) {
                        source = "Winget";
                    }

                    source = source.trim();

                    if (!name.includes("  ")) {
                        packages.push({name, id, ver, source});
                    } else {
                        name = name.replace(/  /g, "#").replace(/# /g, "#").replace(/ #/g, "#");

                        while (name.includes("##")) {
                            name = name.replace("##", "#");
                        }

                        console.log(`🟡 package ${name} failed parsing, going for method 2...`);
                        packages.push({name, id, ver, source});
                    }
                } catch (e) {
                    packages.push({name: line.slice(0, idPosition).trim(), id: line.slice(idPosition, versionPosition).trim(), ver: line.slice(versionPosition, sourcePosition).trim(), source: `Winget: ${line.slice(sourcePosition).trim()}`});

                }
            }

        }
    });

    return packages;
}

exec("winget search test", function (error, stdout, stderr) {
    console.log(stdout, stderr);
    let rawOutput = "";
    let hasShownId = false;
    let noSourcesAvailable = false;
    let idPosition, versionPosition, sourcePosition;
    let packages = [];

    stdout.split("\n").forEach((line) => {
        if (line) {
            rawOutput += line;

            if (!hasShownId) {
                if (line.includes(" Id ")) {
                    line = line.substring(line.indexOf("Name"))

                    hasShownId = true;

                    idPosition = line.split("Id")[0].length;
                    versionPosition = line.split("Version")[0].length;
                    sourcePosition = line.split("Source")[0].length;

                    if (line.length === sourcePosition) {
                        noSourcesAvailable = true;
                        console.log("🟡 Winget reported no sources on getPackagesForQuery");
                    }
                }else if (line.includes(" ID ")) {
                    line = line.substring(line.indexOf("名称"))

                    hasShownId = true;

                    idPosition = line.split("ID")[0].length;
                    versionPosition = line.split("版本")[0].length;
                    sourcePosition = line.split("源")[0].length;

                    if (line.length === sourcePosition) {
                        noSourcesAvailable = true;
                        console.log("🟡 Winget reported no sources on getPackagesForQuery");
                    }
                }
            } else if (line.includes("---")) {
                // Do nothing for lines containing "---"
            } else {
                try {
                    let name = line.slice(0, idPosition).trim();
                    let idVersionSubstr = line.slice(idPosition).trim();

                    if (name.includes("  ")) {
                        let oName = name;

                        while (oName.includes("  ")) {
                            oName = oName.replace("  ", " ");
                        }

                        idVersionSubstr = oName.split(" ").pop() + idVersionSubstr;
                        name = oName.split(" ").slice(0, -1).join(" ");
                    }

                    idVersionSubstr = idVersionSubstr.replace(/\t/g, " ");

                    while (idVersionSubstr.includes("  ")) {
                        idVersionSubstr = idVersionSubstr.replace("  ", " ");
                    }

                    let iOffset = 0;
                    let id = idVersionSubstr.split(" ")[iOffset];
                    let ver = idVersionSubstr.split(" ")[iOffset + 1];
                    let source = "";
                    let tag = "";

                    if (!noSourcesAvailable) {
                        source = idVersionSubstr.split(" ")[iOffset + 2];
                    }

                    if (id.length === 1) {
                        iOffset += 1;
                        id = idVersionSubstr.split(" ")[iOffset];
                        ver = idVersionSubstr.split(" ")[iOffset + 1];

                        if (!noSourcesAvailable) {
                            source = idVersionSubstr.split(" ")[iOffset + 2];
                        }
                    }

                    if (ver.trim() === "<" || ver.trim() === "-") {
                        iOffset += 1;
                        ver = idVersionSubstr.split(" ")[iOffset + 1];

                        if (!noSourcesAvailable) {
                            source = idVersionSubstr.split(" ")[iOffset + 2];
                        }
                    }

                    if (noSourcesAvailable) {
                        source = "Winget";
                    } else if (source.trim() === "") {
                        source = "Winget";
                    }

                    if (source.includes("Tag") || source.includes("Moniker") || source.includes("Command")) {
                        source = "Winget";
                    }

                    source = source.trim();

                    if (!name.includes("  ")) {
                        packages.push({name, id, ver, source});
                    } else {
                        name = name.replace(/  /g, "#").replace(/# /g, "#").replace(/ #/g, "#");

                        while (name.includes("##")) {
                            name = name.replace("##", "#");
                        }

                        console.log(`🟡 package ${name} failed parsing, going for method 2...`);
                        packages.push({name, id, ver, source});
                    }
                } catch (e) {
                    packages.push({name: line.slice(0, idPosition).trim(), id: line.slice(idPosition, versionPosition).trim(), ver: line.slice(versionPosition, sourcePosition).trim(), source: `Winget: ${line.slice(sourcePosition).trim()}`});

                }
            }

        }
    });

    return packages;
})
