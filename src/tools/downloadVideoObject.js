//Link laden
const link = require("./link.js");

//Url aufteilen, damit part-urls erzeugt werden koennen
const urlSplit = (link.url).split(/segment\d{1,}/);

//libraries laden fuer Dateizugriff
const fs = require('fs-extra');
const download = require('download');

//Benennung 003.ts um richtige Reihenfolge sicherzustellen
const padStart = require('lodash.padstart');

//Befehle auf Kommandzeile ausfuehren
const { execSync } = require('child_process');

//Wo sollen Videos gespeichert werden
const downloadDir = "C:/Users/Martin/Desktop/media/down";

//Video-Promises sammeln
videoPromises = [];

//Download-Dir leeren
fs.emptyDirSync(downloadDir);

//Einzelne Teile herunterladen
for (let i = 1; i <= 155; i++) {

    //Videos-Promises sammeln
    videoPromises.push(new Promise((resolve, reject) => {

        //Url mit part-id erstellen
        let partUrl = urlSplit[0] + "segment" + i + urlSplit[1];

        //Download
        download(partUrl).then(data => {

            //Datei speichern
            fs.writeFileSync(downloadDir + "/" + padStart(i, 3, "0") + ".ts", data);
            resolve();
        }, err => {

            //Bei Fehler trotzdem resolven
            console.log(err.statusCode);
            resolve();
        });
    }));
}

//Wenn alle Dateien heruntergeladen wurden
Promise.all(videoPromises).then(() => {
    console.log("download done");

    //in Download-Verzeichnis gehen und ts Dateien zu einer ts-Datei zusammenfuehren
    execSync("cd " + downloadDir + " && copy /b *.ts joined_files.ts");
    console.log("putting single files together done");

    //ts-Datei nach mp4 konvertieren
    execSync("ffmpeg -i " + downloadDir + "/joined_files.ts -acodec copy -vcodec copy " + downloadDir + "/../done/" + link.mode + "-" + link.fileName + ".mp4");
    console.log("creating mp4 file done");

    //Download-Dir leeren
    fs.emptyDirSync(downloadDir);
    console.log("removing downloaded files done");
});