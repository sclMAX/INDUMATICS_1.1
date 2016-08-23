export const RES_OK: number = 200;
export const RES_ACCESO_DENEGADO: number = 401;
export const RES_SERVER_ERROR: number = 500;
export const RES_DATABASE_ERROR: number = 510;
export const RES_FALTAN_PARAMETROS: number = 422;
export const RES_NO_EN_DB: number = 410;
export const RES_DB_KEY_ERROR: number = 23000;
export const RES_LOCAL_STORAGE_FAIL: number = 100;

export class Response {
    result: any = null;
    response: boolean = false;
    message: string = 'Ocurrio un error inesperado.';
    href: any = null;
    function: any = null;
    filter: any = null;
    code: number = 500;

    /**
     * Creates an instance of Response.
     * 
     * @param {boolean} response
     * @param {number} code
     * @param {string} message
     */
    constructor(response: boolean, code: number, message: string = '') {
        this.response = response;
        this.code = code;
        this.message = message;
    }
}