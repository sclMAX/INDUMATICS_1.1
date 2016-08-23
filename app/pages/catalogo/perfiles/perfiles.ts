import { Component } from '@angular/core';
import { NavController, ModalController, NavParams, Platform, Loading, LoadingController, ToastController} from 'ionic-angular';
import {Linea} from '../../../providers/lineas/lineas';
import {HomePage} from '../../home/home';
import {Perfiles, Perfil} from '../../../providers/perfiles/perfiles';
import {Pedidos} from '../../../providers/pedidos/pedidos';
import {PerfilesDetallePage} from '../perfiles-detalle/perfiles-detalle';
import {PedidoAddItemPage} from '../../pedidos/pedido-add-item/pedido-add-item';
import {PedidosPage} from '../../pedidos/pedidos';


@Component({
  templateUrl: 'build/pages/catalogo/perfiles/perfiles.html',
  providers: [Perfiles, Pedidos],
})
export class PerfilesPage {
  title: string;
  linea: Linea;
  perfiles: Array<Perfil>;
  private perfilesTmp: Array<Perfil>;
  constructor(private navCtrl: NavController, public modal: ModalController, private parametros: NavParams,
    private platform: Platform, private perfilesP: Perfiles, private loading: LoadingController, private toast: ToastController,
    private pedidosP: Pedidos) {
    this.linea = this.parametros.get('linea');
    this.title = "Perfiles: " + this.linea.linea;
  }

  goHome() {
    this.navCtrl.popToRoot();
  }

  goPedidos() {
    this.navCtrl.popToRoot().then(() => {
      this.navCtrl.push(PedidosPage);
    });
  }

  goPerfil(perfil: Perfil) {
    let modal = this.modal.create(PerfilesDetallePage, { 'perfil': perfil, 'add': true });
    modal.onDidDismiss(data => {
      if (data.ok) {
        this.addPedido(perfil);
      }
    })
    modal.present();
  }

  addPedido(perfil: Perfil) {
    let modal = this.modal.create(PedidoAddItemPage, { 'perfil': perfil });
    modal.onDidDismiss(data => {
      if (data.item) {
        this.pedidosP.addItem(data.item).subscribe(() => {
          let t = this.toast.create({ duration: 2000, message: 'Item agregado correctamente!' });
          t.present();
        }, err => {
          let t = this.toast.create({ duration: 2000, message: 'No se pudo agregar el item!' });
          t.present();
        })
      }
    });
    modal.present();
  }

  filtrar(ev) {
    this.perfiles = this.perfilesTmp;
    let val = ev.target.value;
    if (val && val.trim() != '') {
      this.perfiles = this.perfiles.filter((perfil) => {
        return ((perfil.idPerfil + perfil.descripcion).toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    }
  }

  ionViewLoaded() {
    this.platform.ready().then(() => {
      if (!this.perfiles) {
        let load = this.loading.create({
          content: 'Cargando perfiles de la linea: ' + this.linea.linea
        });
        load.present().then(() => {
          this.perfilesP.getPerfilesLinea(this.linea).subscribe(value => {
            this.perfiles = this.perfilesTmp = value;
          }, err => {
            load.dismiss().then(() => {
              let t = this.toast.create({ duration: 2000, message: err.message });
              t.present();
            });
          }, () => {
            load.dismiss();
          });
        });
      }
    });
  }

}
