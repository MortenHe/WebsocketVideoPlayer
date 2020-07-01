//Ermitteln fuer welche Videos auf dem lokalen System es noch keinen JSON-Eintrag gibt und die zugehoerigen JSON-Eintraege erstellen und ausgeben
//libraries laden fuer Dateizugriff
//ffprobe.exe muss vorhanden und im Path sein (z.B. im ffmpeg-bundle)
const fs = require('fs-extra')
const glob = require("glob");
const path = require("path");
const { getVideoDurationInSeconds } = require('get-video-duration')

//Zeit Formattierung laden: [5, 13, 22] => 05:13:22
const timelite = require('timelite');

//Pfade wo die Dateien lokal liegen 
const config = fs.readJSONSync("config.json");
const localVideoDir = config["localVideoDir"];
const localJsonDir = config["localJsonDir"];

//Benennung des Titels
naming = [];
naming["conni"] = "Conni - ";
naming["bibi"] = "Bibi Blocksberg - ";
naming["bibi-tina"] = "Bibi und Tina - ";
naming["maus"] = "Die Maus - ";
naming["2015"] = "2015-";
naming["2016"] = "2016-";
naming["2017"] = "2017-";
naming["2018"] = "2018-";
naming["2019"] = "2019-";
naming["pippi"] = "Pippi - ";
naming["pumuckl"] = "Pumuckl - ";
naming["bob"] = "Bob der Baumeister - ";
naming["bebl"] = "Benjamin Bl�mchen - ";
naming["lieselotte"] = "Lieselotte - ";

//Video-Infos sammeln
outputArray = [];

//Promises bei Laenge-Ermittlung sammeln
durationPromises = [];

//Lokale Videodateien sammeln
const mp4VideoFiles = new Set();
const mp4Files = glob.sync(localVideoDir + "/*/*/*.mp4");
for (const mp4File of mp4Files) {

    //kinder
    const topFolder = path.basename(path.dirname(path.dirname(mp4File)));

    //maus
    const subFolder = path.basename(path.dirname(mp4File));

    //maus-pauke.mp4
    const filename = path.basename(mp4File);

    //kinder/maus/maus-pauke.mp4
    mp4VideoFiles.add(topFolder + "/" + subFolder + "/" + filename)
}

//Video-Infos aus JSON-Config-Dateien sammeln
const jsonVideoFiles = new Set();
const jsonFiles = glob.sync(localJsonDir + "/*/*.json");
for (const jsonFile of jsonFiles) {

    //kinder
    const topFolder = path.basename(path.dirname(jsonFile));

    //maus
    const subFolder = path.basename(jsonFile, ".json");

    //Ueber Videos in maus.json gehen
    const jsonData = fs.readJsonSync(jsonFile);
    for (const jsonObj of jsonData) {

        //kinder/maus/maus-pauke.mp4
        jsonVideoFiles.add(topFolder + "/" + subFolder + "/" + jsonObj.file);
    }
}

//Promises bei Laenge-Ermittlung sammeln
durationPromises = [];

//Ueber Videos gehen, fuer die es noch keinen JSON-Eintrag gibt und den JSON-Eintrag erstellen
missingJsonFiles = [...mp4VideoFiles].filter(videoFile => !jsonVideoFiles.has(videoFile));
for (missingJsonFile of missingJsonFiles) {

    //D:/Nextcloud/*/kinder/maus/maus-post.mp4
    const filePath = localVideoDir + "/" + missingJsonFile;

    //Promises sammeln, da Zeit-Ermittlung asynchron laeuft
    durationPromises.push(new Promise((resolve, reject) => {

        //Laenge errechnen fuer Datei
        getVideoDurationInSeconds(filePath).then((duration) => {

            //maus-post.mp4
            const file = path.basename(filePath);

            //maus
            const mode = path.basename(path.dirname(filePath));

            //Gesamtzeit als formattierten String. Zunaechst Float zu int: 13.4323 => 13
            let totalSeconds = Math.trunc(duration);

            //Umrechung der Sekunden in [h, m, s] fuer formattierte Darstellung
            const hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            //h, m, s-Werte in Array packen
            const timeOutput = [hours, minutes, seconds];

            //[2,44,1] => 02:44:01
            const timeOutputString = timelite.time.str(timeOutput);

            //bibi-mamis-neuer-besen.mp4 -> mamis-neuer-besen
            let name = file.replace(mode + "-", "");
            name = name.replace(".mp4", "");

            //mamis-neuer-besen -> mamis neuer besen
            name = name.replace(/-/g, ' ');

            //mamis neuer besen -> Bibi Blocksberg - mamis neuer besen
            name = naming[mode] ? naming[mode] + name : " - ";

            //Bibi Blocksberg - mamis neuer besen -> Bibi Blocksberg - Mamis Neuer Besen
            name = name.replace(/\b[a-z]/g, (chr) => {
                return chr.toUpperCase();
            });

            //Video-Objekt erstellen und sammeln
            outputArray.push({
                "name": name,
                "file": file,
                "length": timeOutputString,
                "active": true,
                "added": new Date().toISOString().slice(0, 10)
            });
            resolve();
        });
    }));
}

//warten bis alle Promises abgeschlossen sind
Promise.all(durationPromises).then(() => {

    //Liste nach Dateiname (pippi-01-fest.mp4, pippi-02-freunde.mp4) sortieren, da Promises unterschiedlich schnell zureuckkommen koennen
    outputArray.sort((a, b) => a.file.localeCompare(b.file));

    //Video-Array ausgeben
    console.log(JSON.stringify(outputArray, null, 2));
}).catch((err) => {
    console.log('error:', err);
});