import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  templateUrl: 'build/pages/contacto/contacto.html',
})
export class ContactoPage {
  title: string;

  constructor(private nav: NavController) {
    this.title = 'Medios de contacto';
  }

  goCall(nro) {
    let n = 'tel:' + nro;
    document.location.href = n;
  }
  goMail(email) {
    let e = 'mailto:' + email + '?subject=Consulta desde IndumaticsApp';
    document.location.href = e;
  }
}
