import { Component } from '@angular/core';
import { BackendService } from '../../services/backend.service';

@Component({
    selector: 'playercontrol',
    templateUrl: './playercontrol.component.html',
    styleUrls: ['./playercontrol.component.scss']
})

export class PlayercontrolComponent {

    //aktueller Pausenzustand
    paused: boolean;

    //aktueller Index in Titellsite
    position: number;

    //aktuelle Liste der abgespielten files
    files: any[] = [];

    //Services injecten
    constructor(private bs: BackendService) { }

    //Beim Init
    ngOnInit() {

        //aktuellen Pausenzustand abonnieren und in Variable schreiben (fuer CSS-Klasse)
        this.bs.getPaused().subscribe(paused => this.paused = paused);

        //aktuellen Index der Titelliste abonnieren und in Variable schreiben (fuer disabled der Buttons)
        this.bs.getPosition().subscribe(position => this.position = position);

        //aktuelle Liste der Files abbonieren und in Variable schreiben (fuer disabled der Buttons)
        this.bs.getFiles().subscribe(files => this.files = files);
    }

    //Paused-Zustand toggeln oder Playlist nochmal neu starten
    togglePausedRestart() {
        this.bs.sendMessage({ type: "toggle-play-pause", value: "" });
    }

    //innerhalb des Items spulen
    seek(forward: boolean) {
        this.bs.sendMessage({ type: "seek", value: forward });
    }

    //Playback stoppen und Playlist leeren
    stopAndResetPlaylist() {

        //Stop-Befehl an Server schicken
        this.bs.sendMessage({ type: "stop", value: "" });
    }
}