import { Component } from '@angular/core';
import { ViewController, NavParams, Platform, ToastController } from 'ionic-angular';
import {FormGroup} from '@angular/forms';
import {Pedidos, Item, Pedido} from '../../../providers/pedidos/pedidos';
import {Colores, Color} from '../../../providers/colores/colores';

@Component({
  templateUrl: 'build/pages/pedidos/pedido-add-item/pedido-add-item.html',
  providers: [Colores]
})
export class PedidoAddItemPage {
  addForm: FormGroup;
  title: string;
  pedidoItem: Item;
  pesoTotal: number;
  colores: Array<Color>;
  isPaquetes: boolean = false;
  cantidadPaquetes: number;

  constructor(public viewCtrl: ViewController, private parametros: NavParams, private coloresP: Colores,
    private platform: Platform, private toast: ToastController) {
    this.pedidoItem = new Item();
    this.pedidoItem.perfil = this.parametros.get('perfil');
    this.title = 'Código: ' + this.pedidoItem.perfil.idPerfil;
  }

  add() {
    this.viewCtrl.dismiss({ 'item': this.pedidoItem });
  }

  cancel() {
    this.viewCtrl.dismiss({ 'item': null });
  }

  onChanges() {
    if(this.isPaquetes){
      this.pedidoItem.cantidad = this.pedidoItem.perfil.bxp * this.cantidadPaquetes;
    }
    if ((this.pedidoItem.color) && (this.pedidoItem.cantidad > 0)) {
      let l: number = this.pedidoItem.perfil.largo / 1000;
      let pxm: number = this.pedidoItem.perfil.pxm;
      let inc: number = this.pedidoItem.color.incremento;
      let c: number = this.pedidoItem.cantidad;
      this.pesoTotal = c * ((pxm * l) + ((pxm * l) * (inc / 100)));
    }
  }

  ionViewLoaded() {
    this.platform.ready().then(() => {
      if (!this.colores) {
        this.coloresP.getAll().subscribe(res => {
          this.colores = res;
        }, err => {
          let t = this.toast.create({ duration: 2000, message: 'No se pudo cargar los colores!' });
          t.present();
        })
      }
    });
  }

}
