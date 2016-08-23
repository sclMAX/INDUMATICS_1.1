import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers } from '@angular/http';
import {Observable} from 'rxjs';
import 'rxjs/add/operator/map';
import * as ResponseClass from '../clases/response';
import * as  PouchDB from 'pouchdb';

const apiUrl: string = 'http://www.indumatics.com.ar/api/lineas/index.php';

export class Linea {
  id: number;
  linea: string;
  descripcion: string;
  isEncatalogo: boolean;
}

@Injectable()
export class Lineas {
  private lineas: Array<Linea>;
  private db: any;

  constructor(private http: Http) { }

  private initDB() { this.db = new PouchDB('lineas', { adapter: 'websql' }) }

  /**
   * Guarda las lineas localmente
   * 
   * @private
   * @param {Array<Linea>} l
   * @returns {Observable<ResponseClass.Response>}
   * Exito: Response.result = {Array<Linea>}
   * Falla: Response.result = error
   */
  private localSaveLineas(l: Array<Linea>): Observable<ResponseClass.Response> {
    return Observable.create(obs => {
      if (!this.db) { this.initDB() };
      let response: ResponseClass.Response;
      this.db.get('linea').then(doc => {
        return this.db.put({
          _id: 'linea',
          doc: l,
          _rev: doc._rev
        });
      }).then(res => {
        response = new ResponseClass.Response(true, ResponseClass.RES_OK, 'Datos actualizados correctamente!');
        response.result = l;
        obs.next(response);
      }).catch(err => {
        this.db.put({
          _id: 'linea',
          doc: l
        }).then(() => {
          response = new ResponseClass.Response(true, ResponseClass.RES_OK, 'Datos ingresados correctamente!');
          response.result = l;
          obs.next(response);
        }).catch(err => {
          response = new ResponseClass.Response(false, ResponseClass.RES_LOCAL_STORAGE_FAIL, 'Error al guardar localmente!');
          response.result = err;
          obs.error(response);
        })
      });
    });
  }

  /**
   * Recupera las lineas gurdadas localmente
   * 
   * @private
   * @returns {Observable<Array<Linea>>}
   * Exito: {Array<Linea>}
   * Falla: Observable.error(error)
   */
  private localGetLineas(): Observable<Array<Linea>> {
    return Observable.create(obs => {
      if (!this.db) { this.initDB(); }
      this.db.get('linea').then(doc => {
        this.lineas = doc.doc;
        obs.next(this.lineas);
      }).catch(err => {
        obs.error(err);
      });
    });
  }

  /**
   * Descarga las lineas del Servidor
   * 
   * @private
   * @returns {Observable<ResponseClass.Response> }
   * Exito/Falla: {Response}
   */
  private serverGetLineas(): Observable<ResponseClass.Response> {
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    let url: string = apiUrl;
    return this.http.get(url, options).map(res => res.json());
  }

  /**
   * Busca las lineas localmente si no las encuentra las busca en el servidor
   * 
   * @returns {Observable}
   * Exito: {Array<Linea>}
   * Falla: {Response} 
   */
  public getAll(): Observable<Array<Linea>> {
    if (this.lineas) {
      return Observable.create(obs => {
        obs.next(this.lineas);
        obs.complete();
      });
    } else {
      return Observable.create(obs => {
        this.localGetLineas().subscribe(res => { //Busca las lineas loaclmente y la retorna
          this.lineas = res;
          obs.next(this.lineas);
          obs.complete();
        }, err => { //Si no encuentra localmente busca en el servidor
          this.serverGetLineas().subscribe(res => {
            if (res.response) { //si se lograron descargar intenta guardarlas localmente y retorna las lineas
              this.lineas = <Array<Linea>>res.result;
              this.localSaveLineas(this.lineas).subscribe(res => {
                obs.next(this.lineas);
                obs.complete();
              }, err => {
                obs.next(this.lineas);
              });
            } else {// en caso de conexion exitosa pero sin datos retorna el error {Response} 
              obs.error(res);
            }
          }, err => {
            let r = new ResponseClass.Response(false, ResponseClass.RES_SERVER_ERROR, 'Sin conexión a internet!');
          })
        })
      });
    }
  }

  public update(): Observable<ResponseClass.Response> {
    let response: ResponseClass.Response;
    response = new ResponseClass.Response(false, ResponseClass.RES_SERVER_ERROR, 'No se pudo Actualizar las Lineas Disponibles!');
    return Observable.create(obs => {
      this.serverGetLineas().subscribe(res => {
        if (res.response) {
          this.lineas = res.result;
          this.localSaveLineas(this.lineas).subscribe(res => {
            response.response = true;
            response.code = ResponseClass.RES_OK;
            response.message = 'Lineas Actualizadas correctamente!';
            response.result = this.lineas;
            obs.next(response);
          }, err => {
            response.code = ResponseClass.RES_LOCAL_STORAGE_FAIL;
            response.result = err;
            obs.error(response)
          })
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

