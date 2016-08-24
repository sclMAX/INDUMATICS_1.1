import { Component } from '@angular/core';
import { ViewController, NavParams, ToastController} from 'ionic-angular';
import {Pedidos, Pedido} from '../../../providers/pedidos/pedidos';
import {RegistroPage} from '../../usuario/registro/registro';
import {FormGroup} from '@angular/forms';

@Component({
  templateUrl: 'build/pages/pedidos/pedido-config/pedido-config.html',
  providers: [Pedidos],
})
export class PedidoConfigPage {
  title: string;
  pedido: Pedido;
  pedidoForm: FormGroup;

  constructor(public viewCtrl: ViewController, private parametros: NavParams,
    private pedidosP: Pedidos, private toast: ToastController) {
    this.pedido = this.parametros.get('pedido');
    this.title = 'Enviar Pedido Actual';
  }
  cancel() {
    this.viewCtrl.dismiss({ 'pedido': null });
  }
  savePedido() {
    this.viewCtrl.dismiss({ 'pedido': this.pedido });
  }

}
