import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers} from '@angular/http';
import {Observable} from 'rxjs';
import 'rxjs/add/operator/map';
import * as ResponseClass from '../clases/response';
import * as  PouchDB from 'pouchdb';

const apiUrl: string = 'http://www.indumatics.com.ar/api/estado/';
const idL: string = 'local';
const idS: string = 'server';

export class Estado {
  catalogoVersion: Date;
  appVersion: number;
  novedades: string;
  isLeido: boolean;

  constructor() {
    this.isLeido = false;
    this.catalogoVersion = new Date();
    this.appVersion = 1;
    this.novedades = '';
  }
}

export class EstadoResult {
  isUpdate: boolean;
  estado: Estado;
  constructor() {
    this.isUpdate = false;
    this.estado = new Estado();
  }
}

@Injectable()
export class Estados {
  private db: any;
  private localEstado: Estado;
  private serverEstado: Estado;

  constructor(private http: Http) { }

  private initDB() { this.db = new PouchDB('estado', { adapter: 'websql' }); }

  private serverGetEstado(): Observable<ResponseClass.Response> {
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    let url: string = apiUrl;
    return this.http.get(url, options).map(res => res.json());
  }

  private localSave(id: string, estado: Estado): Observable<Estado> {
    return Observable.create(obs => {
      if (!this.db) { this.initDB(); }
      this.db.get(id).then(doc => {
        return this.db.put({
          _id: id,
          _rev: doc._rev,
          doc: estado
        });
      }).then(() => {
        obs.next(estado);
      }).catch(() => {
        this.db.put({
          _id: id,
          doc: estado
        }).then(() => {
          obs.next(estado);
        }).catch(err => {
          obs.error(err);
        });
      });
    });
  }

  private localGet(id: string): Observable<Estado> {
    return Observable.create(obs => {
      if (!this.db) { this.initDB(); }
      this.db.get(id).then(doc => {
        obs.next(<Estado>JSON.parse(JSON.stringify(doc.doc)));
      }).catch(err => {
        obs.error(err);
      });
    });
  }

  private genResult(): EstadoResult {
    let r = new EstadoResult();
    if (this.localEstado) {
      r.estado.catalogoVersion = this.localEstado.catalogoVersion;
      r.isUpdate = (this.serverEstado.catalogoVersion > this.localEstado.catalogoVersion);
      if (this.serverEstado.novedades != this.localEstado.novedades) {
        r.estado.novedades = this.serverEstado.novedades;
        r.estado.isLeido = false;
      } else {
        r.estado.novedades = this.localEstado.novedades;
        r.estado.isLeido = this.localEstado.isLeido;
      }
    } else {
      r.isUpdate = true;
      r.estado.catalogoVersion = new Date(0);
      r.estado.novedades = this.serverEstado.novedades;
      r.estado.isLeido = false;
    }
    return r;
  }

  public setCatalogoVersionNow(): Observable<boolean> {
    return Observable.create(obs => {
      this.localGet(idL).subscribe(estado => {
        estado.catalogoVersion = new Date();
        this.updateLocalEstado(estado).subscribe(res => {
          this.localEstado = estado;
          obs.next(res.response);
        }, err => {
          obs.error(err);
        });
      }, err => {
        this.updateLocalEstado(new Estado()).subscribe(res => {
          this.localEstado = new Estado();
          obs.next(res.response);
        }, err => {
          obs.error(err);
        });
      })
    });
  }

  public updateLocalEstado(estado: Estado): Observable<ResponseClass.Response> {
    return Observable.create(obs => {
      this.localSave(idL, estado).subscribe(() => {
        this.localEstado = estado;
        obs.next(new ResponseClass.Response(true, ResponseClass.RES_OK, 'Se actualizao correctamente el estado local'));
        obs.complete();
      }, err => {
        obs.error(new ResponseClass.Response(false, ResponseClass.RES_LOCAL_STORAGE_FAIL, 'No se pudo guardar el estado local'));
      });
    });
  }

  public getServerEstado(): Observable<Estado> {
    return Observable.create(obs => {
      this.serverGetEstado().subscribe(res => {
        if (res.response) {
          this.serverEstado = <Estado>JSON.parse(JSON.stringify(res.result[0]));
          this.localSave(idS, this.serverEstado).subscribe(() => {
            obs.next(this.serverEstado);
            obs.complete();
          }, err => {
            obs.error(new ResponseClass.Response(false, ResponseClass.RES_LOCAL_STORAGE_FAIL, 'No se pudo guardar localmente'))
          })
        } else {
          obs.error(res);
        }
      }, err => {
        obs.error(err);
      });
    });
  }

  /**
   * Chequea el estado de actualizacion localmente
   * 
   * @returns {Observable<EstadoResult>}
   */
  public chkEstado(): Observable<EstadoResult> {
    return Observable.create(obs => {
      this.localGet(idS).subscribe(se => {
        this.serverEstado = se;
        this.localGet(idL).subscribe(le => {
          this.localEstado = le;
          let r = this.genResult();
          obs.next(r);
          obs.complete();
        }, err => {
          let r = this.genResult();
          obs.next(r);
          obs.complete();
        })
      }, err => {
        obs.error(err);
      })
    });
  }

}

