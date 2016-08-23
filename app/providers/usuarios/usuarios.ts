import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers } from '@angular/http';
import * as ResponseClass from '../clases/response';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import * as PouchDB from'pouchdb';
let apiUrl: string = 'http://www.indumatics.com.ar/api/usuarios/';

export class Usuario {
  id: number = 0;
  idLocal: number = 0;
  razonSocial: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  localidad: string = 'Paraná';
  provincia: string = 'Entre Ríos';
  pais: string = 'Argentina';
}


@Injectable()
export class Usuarios {
  private usuario: Usuario;
  private db: any;
  constructor(private http: Http) {
  }

  private initDB() {
    this.db = new PouchDB('usuarios', { adapter: 'websql' });
  }

  private localGetUsuario(): Observable<Usuario> {
    return Observable.create(obs => {
      if (!this.db) { this.initDB() };
      this.db.get('usuario').then(value => {
        this.usuario = <Usuario>value.doc;
        obs.next(this.usuario);
        obs.complete();
      }).catch(() => {
        this.usuario = new Usuario();
        obs.next(this.usuario);
        obs.complete();
      });
    });
  }

  /**
   * Intenta gruardar el usuario localmente
   * 
   * @private
   * @param {Usuario} u
   * @returns {Observable<ResponseClass.Response>}
   * 
   */
  private localSaveUsuario(u: Usuario): Observable<ResponseClass.Response> {
    return Observable.create(obs => {
      if (!this.db) { this.initDB() };
      this.db.get('usuario').then(doc => {
        return this.db.put({
          _id: 'usuario',
          _rev: doc._rev,
          doc: u
        });
      }).then(doc => {
        let response = new ResponseClass.Response(true, ResponseClass.RES_OK, 'Usuario Actualizado Correctamente!');
        response.result = u;
        obs.next(response);
      }).catch(err => {
        this.db.put({
          _id: 'usuario',
          doc: u,
        }).then(() => {
          let response = new ResponseClass.Response(true, ResponseClass.RES_OK, 'Usuario Ingresado Correctamente!');
          response.result = u;
          obs.next(response);
        }).catch(err => {
          obs.error(err);
        })
      });
    });
  }

  /**
   * Registra un Usuario en el Servidor
   * 
   * @private
   * @param {Usuario} u
   * @returns {Observable<ResponseClass.Response>}
   * result: id generado en el servidor / null ,
   *  response = true/false,
   *  message = string descriptivo,
   *  code = RES_OK = 200/RES_ACCESO_DENEGADO = 401;RES_SERVER_ERROR = 500;
   *     RES_DATABASE_ERROR = 510;RES_FALTAN_PARAMETROS = 422;RES_NO_EN_DB = 410;RES_DB_KEY_ERROR = 23000;
   * 
   */
  private serverRegitrarUsuario(u: Usuario): Observable<ResponseClass.Response> {
    let usuario = JSON.stringify(u);
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    let url: string = apiUrl + '?usuario=' + encodeURI(usuario) + '&apikey=30708166614';
    return this.http.post(url, {}, options).map(res => res.json());
  }

  /**
   * Actualiza los datos del Usuario en el Servidor
   * 
   * @private
   * @param {Usuario} u
   * @returns {Observable<ResponseClass.Response>}
   */
  private serverUpdateUsuario(u: Usuario): Observable<ResponseClass.Response> {
    let usuario = JSON.stringify(u);
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    let url: string = apiUrl + '?usuario=' + encodeURI(usuario) + '&apikey=30708166614';
    return this.http.put(url, {}, options).map(res => res.json());
  }

  /**
   * Intenta registrar un usuario en el servidor, si lo logra lo guarda localmente
   * 
   * @param {Usuario} u
   * @returns Observable<ResponseClass.Response>
   * Exito: {Response.result = Usuario} con el id del servido incorporado
   * Falla: {Response} del servidor
   * code = RES_OK = 200/RES_ACCESO_DENEGADO = 401;RES_SERVER_ERROR = 500;
   *     RES_DATABASE_ERROR = 510;RES_FALTAN_PARAMETROS = 422;RES_NO_EN_DB = 410;RES_DB_KEY_ERROR = 23000;
   */
  public registrarUsuario(u: Usuario): Observable<ResponseClass.Response> {
    return Observable.create(obs => {
      this.serverRegitrarUsuario(u).subscribe(value => {
        if (value.response) {
          u.id = <number>value.result;
          if (u.id) {
            this.localSaveUsuario(u).subscribe(res => {
              let response = new ResponseClass.Response(true, ResponseClass.RES_OK, 'Registro realizado correctamente en el servidor');
              response.result = u;
              obs.next(response);
              obs.complete();
            }, err => {
              let res = new ResponseClass.Response(false, ResponseClass.RES_LOCAL_STORAGE_FAIL, 'Registro realizado correctamente en el servidor, pero no se pudieron gurdara los cambios localmente!');
              obs.error(res);
            });
          } else {
            obs.error(value);
          }
        } else {
          obs.error(value);
        }
      }, err => {
        let res = new ResponseClass.Response(false, ResponseClass.RES_SERVER_ERROR, "Sin conexion");
        obs.error(res);
      });
    });
  }

  /**
   * Actualiza los datos del usuario en el servidor
   * 
   * @param {Usuario} u
   * @returns Observable<ResponseClass.Response>
   * Exito:  {Response.result = Usuario}
   * Falla: {Response}
   */
  public updateUsuario(u: Usuario): Observable<ResponseClass.Response> {
    return Observable.create(obs => {
      this.serverUpdateUsuario(u).subscribe(res => {
        if (res.response) {
          this.localSaveUsuario(u).subscribe(value => {
            obs.next(value);
          }, err => {
            let r = new ResponseClass.Response(false, ResponseClass.RES_LOCAL_STORAGE_FAIL, 'Error al gurdar los datos localmente');
            obs.error(r);
          });
        } else {
          obs.error(res)
        }
      }, err => {
        let r = new ResponseClass.Response(false, ResponseClass.RES_SERVER_ERROR, 'Sin Conexión');
        obs.error(r);
      });
    });
  }

  /**
     * Chequea el codigo de recuperacion y actualiza los datos en el servidor
     * 
     * @param {Usuario} u ,
     * {number} codigo = Codigo de recuperacion,
     * {number} id = id de la cuenta asociada al email en el servidor
     * @returns Observable<ResponseClass.Response>
     * Exito:  {Response.result = Usuario}
     * Falla: {Response}
     */
  public recuperarCuenta(u: Usuario, codigo: number, id: number): Observable<ResponseClass.Response> {
    return Observable.create(obs => {
      let c: number = codigo * 1;
      if (c == id) {//Si el codigo es correcto se guardan los cambios con el ID recibido
        u.id = id;
        this.updateUsuario(u).subscribe(res => {
          obs.next(res);
        }, err => {
          obs.error(err);
        }, () => { obs.complete(); });
      } else {
        let r = new ResponseClass.Response(false, ResponseClass.RES_ACCESO_DENEGADO, 'Codigo Incorrecto');
        obs.error(r);
      }
    });
  }

  public getUsuario(): Observable<Usuario> {
    return Observable.create(obs => {
      this.localGetUsuario().subscribe(value => {
        this.usuario = value;
        obs.next(this.usuario);
        obs.complete();
      }, err => {
        obs.error(err);
      });
    });
  }

}



