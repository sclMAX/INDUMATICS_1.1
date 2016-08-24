import {Component} from '@angular/core';
import {Platform, ionicBootstrap} from 'ionic-angular';
import {StatusBar} from 'ionic-native';
import {HomePage} from './pages/home/home';
import {Estados} from './providers/estados/estados';


@Component({
  template: '<ion-nav [root]="rootPage"></ion-nav>',
  providers: [Estados]
})
export class MyApp {
  rootPage: any = HomePage;

  constructor(platform: Platform, private estadoP: Estados) {
    platform.ready().then(() => {
      estadoP.getServerEstado().subscribe();
      StatusBar.styleDefault();
    });
  }
}

ionicBootstrap(MyApp);
