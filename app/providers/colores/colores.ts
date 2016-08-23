import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import {Observable} from 'rxjs';
import * as ResponseClass from '../clases/response';
import * as  PouchDB from 'pouchdb';

const apiUrl: string = 'http://www.indumatics.com.ar/api/colores/index.php';

export class Color {
  id: number;
  color: string;
  incremento: number;
}

@Injectable()
export class Colores {
  private colores: Array<Color>;
  private db: any;

  constructor(private http: Http) { }

  private initDB() { this.db = new PouchDB('colores', { adapter: 'websql' }); }


  /**
   * Guarda los Colores en le cache local
   * 
   * @private
   * @param {Array<Color>} data
   * @returns {Observable<ResponseClass.Response> }
   * Exito: {Array<Color>}
   * Falla: Observable.error(error)
   */
  private localSaveColores(data: Array<Color>): Observable<ResponseClass.Response> {
    let response: ResponseClass.Response;
    return Observable.create(obs => {
      if (!this.db) { this.initDB(); }
      this.db.get('color').then(doc => {
        return this.db.put({
          _id: 'color',
          _rev: doc._rev,
          doc: data
        });
      }).then(res => {
        response = new ResponseClass.Response(true, ResponseClass.RES_OK, 'Datos actualizados correctamente');
        response.result = data;
        obs.next(response);
      }).catch(err => {
        this.db.put({
          _id: 'color',
          doc: data
        }).then(() => {
          response = new ResponseClass.Response(true, ResponseClass.RES_OK, 'Datos ingresados correctamente');
          response.result = data;
          obs.next(response);
        }).catch(err => {
          response = new ResponseClass.Response(false, ResponseClass.RES_LOCAL_STORAGE_FAIL, 'Error al guardar localmente');
          response.result = err;
          obs.error(response);
        })
      });
    });
  }

  /**
   * Busca Colores en el cache local
   * 
   * @private
   * @returns {Observable<Array<Color>>}
   * Exito: {Array<Color>}
   * Falla: Observable.error(error)
   */
  private localGetAll(): Observable<Array<Color>> {
    return Observable.create(obs => {
      if (!this.db) { this.initDB(); }
      this.db.get('color').then(doc => {
        obs.next(doc.doc);
      }).catch(err => {
        obs.error(err);
      })
    });
  }

  /**
   * Descarga los Colores del servidor
   * 
   * @private
   * @returns {Observable<ResponseClass.Response>}
   * Exito/Falla: {Response}
   */
  private serverGetAll(): Observable<ResponseClass.Response> {
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    let url: string = apiUrl;
    return this.http.get(url, options).map(res => res.json());
  }

  /**
   * Retorna los Colores 
   * 
   * @returns {Observable<Array<Color>> }
   * Exito: {Array<Color>}
   * Falla: {Rosponse}
   */
  public getAll(): Observable<Array<Color>> {
    if (this.colores) {
      return Observable.create(obs => {
        obs.next(this.colores);
        obs.complete();
      });
    } else {
      return Observable.create(obs => {
        this.localGetAll().subscribe(doc => {
          this.colores = doc;
          obs.next(this.colores);
          obs.complete();
        }, err => {
          this.serverGetAll().subscribe(res => {
            if (res.response) {
              this.colores = res.result;
              this.localSaveColores(this.colores).subscribe(doc => {
                obs.next(this.colores);
              })
              obs.next(this.colores);
              obs.complete();
            } else {
              obs.error(res);
            }
          }, err => {
            let r = new ResponseClass.Response(false, ResponseClass.RES_SERVER_ERROR, 'Sin Conexión');
            obs.error(r);
          });
        })
      });
    }
  }

  public update(): Observable<ResponseClass.Response> {
    return Observable.create(obs => {
      let response: ResponseClass.Response;
      response = new ResponseClass.Response(false, ResponseClass.RES_SERVER_ERROR, 'No se pudos actualizar el listado de colores!');
      this.serverGetAll().subscribe(res => {
        if (res.response) {
          this.colores = res.result;
          this.localSaveColores(this.colores).subscribe(res => {
            response.response = true;
            response.code = ResponseClass.RES_OK;
            response.message = 'Colores Actualizadas correctamente!';
            response.result = this.colores;
            obs.next(response);
          }, err => {
            response.code = ResponseClass.RES_LOCAL_STORAGE_FAIL;
            response.result = err;
            obs.error(response);
          });
        } else {
          response.result = res;
          obs.error(response);
        }
      }, err => {
        response.result = err;
        obs.error(response);
      })
    });
  }


}

