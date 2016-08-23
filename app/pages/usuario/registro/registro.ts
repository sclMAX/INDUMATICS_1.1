import {Component} from '@angular/core';
import {NavController, Loading, LoadingController, ToastController, AlertController} from 'ionic-angular';
import {Platform} from 'ionic-angular';
import {FormGroup} from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import {Usuarios, Usuario} from '../../../providers/usuarios/usuarios';
import {HomePage} from '../../home/home';
import * as ResponseClass from '../../../providers/clases/response';

@Component({
  templateUrl: 'build/pages/usuario//registro/registro.html',
  providers: [Usuarios]
})
export class RegistroPage {
  usuarioForm: FormGroup;
  title: string;
  usuario: Usuario;
  isChange: boolean = false;


  constructor(public navCtrl: NavController,
    private usuariosP: Usuarios, private platform: Platform, private loading: LoadingController,
    private toast: ToastController, private alert: AlertController) {
    this.title = "Registro de Usuario";
    this.usuario = new Usuario();
  }


  registrarUsuario() {
    let t = this.toast.create({ duration: 2000 });
    this.isChange = false;
    if (this.usuario.id > 0) { //si tiene un id actualiza los cambios en el servidor 
      let load = this.loading.create({
        content: 'Guardando datos del usuario...'
      });
      load.present().then(() => {
        this.usuariosP.updateUsuario(this.usuario).subscribe(value => {
          load.dismiss().then(() => {
            this.navCtrl.pop();
            t.setMessage('Usuario actualizado correctamente');
            t.present();
          });
        }, err => {
          load.dismiss().then(() => {
            t.setMessage('Error al actualizar los datos ERROR:' + err);
            t.present();
          });
        }, () => {
          load.dismiss();
        });
      });
    } else { //si no, registra el usuario en el servidor
      let load = this.loading.create({
        content: 'Registrar usuario...'
      });
      load.present().then(() => {
        this.usuariosP.registrarUsuario(this.usuario).subscribe(value => {
          this.usuario = value.result;
          load.dismiss().then(() => {
            t.setMessage('Usuario registrado correctamente con el ID:' + this.usuario.id);
            this.navCtrl.setRoot(HomePage);
            t.present();
          });
        }, err => {
          load.dismiss().then(() => {
            if (err.code == ResponseClass.RES_DB_KEY_ERROR) { //Email ya registrado
              let id: number = <number>err.result;
              let alert = this.alert.create({
                title: 'Recuperar cuenta...',
                subTitle: 'Email ya registrado. Ingrese el codigo que se envio a esa direccion de Email para recuperar la cuenta.',
                inputs: [{ name: 'codigo', type: 'number', placeholder: 'Ingrese el codigo' }],
                buttons: [
                  {
                    text: 'Cancelar',
                    role: 'cancel',
                    handler: data => { this.navCtrl.setRoot(HomePage); }
                  },
                  {
                    text: 'Aceptar',
                    handler: data => {
                      this.usuariosP.recuperarCuenta(this.usuario, data.codigo, id).subscribe(() => {
                        t.setMessage('Datos guardados correctamente!');
                        this.navCtrl.setRoot(HomePage);
                        t.present();
                      }, err => {
                        if (err.code == ResponseClass.RES_ACCESO_DENEGADO) {
                          t.setMessage('Codigo Incorrecto!');
                        } else {
                          t.setMessage('Error: ' + err.message);
                        }
                        t.present();
                      }, () => {
                        this.navCtrl.setRoot(HomePage);
                      });
                    }
                  }
                ]
              });
              alert.present();
            } else {
              t.setMessage('Error al intentar registrar el ususario ERROR: ' + err.message);
              t.present();
            }
          });
        }, () => {
          load.dismiss();
        })
      });
    }
  }

  ionViewLoaded() {
    this.platform.ready().then(() => {
      let load = this.loading.create({
        content: 'Cargando datos...',
        showBackdrop: false,
        dismissOnPageChange: true,
      });
      load.present().then(() => {
        this.usuariosP.getUsuario()
          .subscribe(value => {
            this.usuario = value;
            if (this.usuario.id > 0) { this.title = 'Modificar datos...' };
          }, err => {
            console.error.bind(err);
          }, () => {
            load.dismiss();
          });
      });
    });
  }

  onChange() {
    this.isChange = true;
  }

}
