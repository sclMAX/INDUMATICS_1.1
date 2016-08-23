import { Component } from '@angular/core';
import { NavController, Platform, AlertController, ToastController } from 'ionic-angular';
import {Pedidos, Pedido} from '../../providers/pedidos/pedidos';
import {PedidoDetallePage} from './pedido-detalle/pedido-detalle';
import {Usuarios, Usuario} from '../../providers/usuarios/usuarios';

@Component({
  templateUrl: 'build/pages/pedidos/pedidos.html',
  providers: [Pedidos, Usuarios],
})
export class PedidosPage {
  title: string;
  pedidoActual: Pedido;
  pedidosEnviados: Array<Pedido> = [];

  constructor(private navCtrl: NavController, private pedidosP: Pedidos,
    private platform: Platform, private usuariosP: Usuarios, private alert: AlertController,
    private toast: ToastController) {
    this.title = 'Pedidos';
  }

  goPedidoActual() {
    this.navCtrl.push(PedidoDetallePage, { 'pedido': this.pedidoActual, 'edit': true });

  }

  goPedido(pedido: Pedido) {
    this.navCtrl.push(PedidoDetallePage, { 'pedido': pedido, 'edit': false });
  }

  removeItem(pedido: Pedido) {
    let confirm = this.alert.create({
      title: 'Quitar de historial...',
      message: 'Esta seguro que desea quitar el pedido Nro:000' + pedido.id + '?. Solo elimina el pedido del historial local (no lo anula en el servidor).',
      buttons: [{ text: 'Cancelar' },
        {
          text: 'Aceptar',
          handler: () => {
            this.pedidosEnviados.splice((this.pedidosEnviados.findIndex(value => value === pedido)), 1);
            this.pedidosP.localSaveEnviados(this.pedidosEnviados).subscribe(() => {
              let t = this.toast.create({ duration: 2000, message: 'Pedido eliminado!' });
              t.present();
            });
          }
        }]
    });
    confirm.present();
  }

  ionViewWillEnter() {
    this.platform.ready().then(() => {
      this.pedidosP.getActual().subscribe(pedido => {
        this.pedidoActual = pedido;
        this.usuariosP.getUsuario().subscribe(usuario => {
          this.pedidoActual.idUsuario = usuario.id;
        });
      });
      this.pedidosP.getEnviados().subscribe(res => {
        this.pedidosEnviados = res;
      });
    });
  }

}
