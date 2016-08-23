import { Component } from '@angular/core';
import { ViewController, NavParams} from 'ionic-angular';
import {Perfil} from '../../../providers/perfiles/perfiles';
@Component({
  templateUrl: 'build/pages/catalogo/perfiles-detalle/perfiles-detalle.html',
})
export class PerfilesDetallePage {
  title: string;
  perfil: Perfil;
  isAddPosible: boolean;

  constructor(public viewCtrl: ViewController,
    private parametros: NavParams) {
    this.perfil = this.parametros.get('perfil');
    this.isAddPosible = this.parametros.get('add');
    this.title = 'Perfil ' + this.perfil.idPerfil;
  }

  goClose() {
    this.viewCtrl.dismiss({'ok':false});
  }

  addPedido(perfil: Perfil) {
    this.viewCtrl.dismiss({'ok':true});
  }

}
