import {Component} from '@angular/core';
import {NavController, Platform, Loading, LoadingController, ToastController, AlertController} from 'ionic-angular';
import {Usuarios, Usuario} from '../../providers/usuarios/usuarios';
import {Estados, Estado} from '../../providers/estados/estados';
import {Lineas} from '../../providers/lineas/lineas';
import {Perfiles} from '../../providers/perfiles/perfiles';
import {Colores} from '../../providers/colores/colores';
import {ContactoPage} from '../contacto/contacto';
import {RegistroPage} from '../usuario/registro/registro';
import {CatalogoPage} from '../catalogo/catalogo';
import {PedidosPage} from '../pedidos/pedidos';
import {Observable} from 'rxjs';


@Component({
  templateUrl: 'build/pages/home/home.html',
  providers: [Usuarios, Estados, Lineas, Perfiles, Colores],
})
export class HomePage {
  title: string;
  isRegistrado: boolean = false;
  isUpdateAvailable: boolean;
  novedades: string;

  constructor(public navCtrl: NavController, private platform: Platform,
    private usuariosP: Usuarios, private estadosP: Estados, private lineasP: Lineas,
    private perfilesP: Perfiles, private coloresP: Colores, private loading: LoadingController,
    private toast: ToastController, private alert: AlertController) {
    this.title = "INDUMATICS S.A.";
    this.novedades = '';
  }

  goContacto() {
    this.navCtrl.push(ContactoPage);
  }

  goRegistro() {
    this.navCtrl.push(RegistroPage);
  }

  goPedidos() {
    this.navCtrl.push(PedidosPage);
  }

  goCatalogo() {
    this.navCtrl.push(CatalogoPage);
  }

  goUpdate() {
    let load: Loading;
    let t = this.toast.create({ duration: 2000 });
    Observable.create(obs => {
      load = this.loading.create({ content: 'Actualizando...' });
      load.present().then(() => {
        this.lineasP.update().subscribe(res => {
          this.perfilesP.update().subscribe(res => {
            this.coloresP.update().subscribe(res => {
              obs.next(res);
              obs.complete();
            }, err => {
              obs.error(err);
            });
          }, err => {
            obs.error(err);
          });
        }, err => {
          obs.error(err);
        });
      });
    }).subscribe(res => {
      this.estadosP.updateLocalEstado(new Estado()).subscribe(res => {
        this.navCtrl.setRoot(HomePage);
      }, err => {
        console.error.bind(err);
      });
      t.setMessage('Actualizacion exitosa!');
      load.dismiss().then(() => {
        t.present();
      });
    }, err => {
      t.setMessage('No se pudo actualiuzar');
      load.dismiss().then(() => {
        t.present();
      });
    }, () => {
      load.dismiss();
    });
  }

  ionViewWillEnter() {
    this.platform.ready().then(() => {
      this.usuariosP.getUsuario().subscribe(u => {
          this.isRegistrado = (u.id > 0);
        });
      this.estadosP.chkEstado().subscribe(res => {
        this.isUpdateAvailable = res.isUpdate;
        if (!res.estado.isLeido) {
          this.novedades = res.estado.novedades;
          if (this.novedades) {
            let showNovedades = this.toast.create({
              message: 'Novedades: ' + this.novedades,
              showCloseButton: true,
              closeButtonText: 'Ok',
            });
            showNovedades.onWillDismiss(btn => {
              res.estado.isLeido = true;
              this.estadosP.updateLocalEstado(res.estado).subscribe();
            });
            showNovedades.present();
          }
        }
      });
    });
  }
}
