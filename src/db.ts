import sqlite3 from "sqlite3";

export class ImparcialDb {

    private db: sqlite3.Database;
    private lastId: number = -1;

    constructor() {
        this.db = new sqlite3.Database(process.env.REACT_APP_DB_PATH, function (err) {
            if(err)
                console.log(`ImparcialDb::constructor - ${err}`);
        });
    }

    run(sql: string, params?: any): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const $this = this;
            this.db.run(sql, params, function(err) {
                if(err)
                    reject(err);
                else {
                    $this.lastId = this.lastID;
                    resolve();
                }
            });
        })
    }

    get(sql: string, params?: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            this.db.get(sql, params, function(err, row) {
                if(err)
                    reject(err);
                else
                    resolve(row);
            });
        });
    }

    all(sql: string, params?: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            this.db.all(sql, params, function(err, rows) {
                if(err)
                    reject(err);
                else
                    resolve(rows);
            });
        })
    }

    prepare(sql: string, ...params: any[]) {
        return this.db.prepare(sql, params);
    }

    getLastId(): number {
        return this.lastId;
    }

    exec(sql: string, callback?: (err: any) => any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
          try {
            this.db.exec(sql, function (e: any) {
                if(callback)
                    callback(e);
                resolve();
            });
          }
          catch(ee) {
            reject(ee);
          }
        });
    }

    close() {
        if(this.db)
            this.db.close();
    }
}