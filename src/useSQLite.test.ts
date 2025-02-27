import { Capacitor } from '@capacitor/core';
import { availableFeatures, useSQLite } from './useSQLite';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';

jest.mock('@capacitor/core', () => {
    let mDatabases: any = {};
    let curDatabase: string = "";
    let curEncrypted: boolean = false;
    let curMode: string = "no-encryption";
    let curTable: string = "";
    var mIsPluginAvailable: boolean = true;
    var platform: string = 'ios';
    return {
        Plugins: {
          CapacitorSQLite: {
            open: async (options: any) => {
                const database = options.database ? options.database : "storage"; 
                const encrypted: boolean = options.encrypted ? options.encrypted : false;
                const mode:string = options.mode ? options.mode : "no-encryption";
                if (!Object.keys(mDatabases).toString().includes(database)) {
                    let mTables: any = {};
                    mDatabases[database] = mTables; 
                }
                curDatabase = database;
                curEncrypted = encrypted;
                curMode = mode;
                return;             
            },
            /* TODO other methods */
  
              
          }
        },
        Capacitor: {
      
            init: (isPluginAvailable: boolean, _platform: string): Promise<void> => {
                mIsPluginAvailable = isPluginAvailable;
                platform = _platform;
                return Promise.resolve();
            },
            isPluginAvailable: () => mIsPluginAvailable,
            getPlatform: () => platform,
            platform: platform
        }
      }
});
jest.mock('@capacitor-community/sqlite', () => {
    var mIsConnection: boolean = false;
    var connDict: Map<string, SQLiteDBConnection> = new Map();
    return {
        SQLiteConnection : jest.fn().mockImplementation(() => { 
            return {
                constructor: () => {
                    return {};
                },
                echo: async (value: string) => { 
                    return {value: value};
                }, 
                createConnection: async (dbName: string,
                                         encrypted?: boolean,
                                         mode?: string,
                                         version?: number): Promise<SQLiteDBConnection> => {
                        let dbConn: SQLiteDBConnection = new 
                                            SQLiteDBConnection(dbName,CapacitorSQLite)
                        if(dbConn != null) {
                            connDict.set(dbName,dbConn)
                            mIsConnection = true;
                            return Promise.resolve(dbConn);    
                        } else {
                            return Promise.reject();
                        }                  
                },
                retrieveConnection: async (dbName: string): Promise<SQLiteDBConnection> => {
                    if(mIsConnection) {
                        if(connDict.has(dbName)) {
                            const conn: any = connDict.get(dbName);
                            return Promise.resolve(conn);
                        } else {
                            return Promise.reject(`Connection ${dbName} does not exist`);
                        }
                    } else {
                        return Promise.reject("No connection available");
                    }
                },
                closeConnection: async (dbName: string): Promise<void> => {
                    if(mIsConnection) {
                        if(connDict.has(dbName)) {
                            connDict.delete(dbName);
                            return Promise.resolve();
                        } else {
                            return Promise.reject();
                        }
                    } else {
                        return Promise.reject();
                    }
                },
                retrieveAllConnections: async (): Promise<Map<string, SQLiteDBConnection>> => {
                    if(mIsConnection) {
                        var conns: any = {};
                        let keys = [...connDict.keys()];
                        if(keys.length > 0) {
                            keys.forEach(key => {
                            conns[key] = connDict.get(key);
                        });
                        return Promise.resolve(conns);
                    } else {
                        return Promise.reject("No connection returned");
                    }
                } else {
                    return Promise.reject("No connection available");
                }
            },
                closeAllConnections: async (): Promise<void> => {
                    if(mIsConnection) {
                        connDict = new Map();
                        return Promise.resolve();
                    } else {
                        return Promise.reject();
                    }
                },
                copyFromAssets: async (): Promise<void> => {
                    return Promise.resolve();
                }

            } 
        }),
        SQLiteDBConnection : jest.fn().mockImplementation(() => { 
            return {
                constructor: () => {
                    return {};
                },
            }
        }),
    }
});
it('Check CapacitorSQLite available for web platform', async () => {
    const capacitorMock = (Capacitor as any);
    await capacitorMock.init(false, 'web')
    const { isAvailable } = useSQLite({});
    expect(isAvailable).toBe(false);   

});

it('Check CapacitorSQLite available for ios platform', async () => {
    const capacitorMock = (Capacitor as any);
    await capacitorMock.init(true,'ios');
    const { isAvailable } = useSQLite({});
    expect(isAvailable).toBe(true);

});

it('Check CapacitorSQLite available for android platform', async () => {
    const capacitorMock = (Capacitor as any);
    await capacitorMock.init(true,'android'); 
    const { isAvailable } = useSQLite({});
    expect(isAvailable).toBe(true);
});
it('Check CapacitorSQLite available for electron platform', async () => {
    const capacitorMock = (Capacitor as any);
    await capacitorMock.init(true, 'electron');
    const { isAvailable } = useSQLite({});
    expect(isAvailable).toBe(true);
});

it('Check CapacitorSQLite echo for ios platform', async () => {
    const capacitorMock = (Capacitor as any);
    await capacitorMock.init(true,'ios');
    
    const { echo } = useSQLite({});
    const res: any = await echo("hello"); 
    expect(res.value).toEqual("hello");
  
});
it('Check CapacitorSQLite createConnection for ios platform', async () => {
    const capacitorMock = (Capacitor as any);
    await capacitorMock.init(true,'ios');
    
    const { createConnection } = useSQLite({});
    const res: any = await createConnection("testDB"); 
    expect(res).not.toBeNull();
  
});
it('Check CapacitorSQLite retrieveConnection for ios platform', async () => {
    const capacitorMock = (Capacitor as any);
    await capacitorMock.init(true,'ios');
    
    const { createConnection, retrieveConnection } = useSQLite({});
    let res: any = await createConnection("testDB"); 
    expect(res).not.toBeNull();
    res = await retrieveConnection("testDB");
    expect(res).not.toBeNull();
  
});
it('Check CapacitorSQLite closeConnection for ios platform', async () => {
    const capacitorMock = (Capacitor as any);
    await capacitorMock.init(true,'ios');
    
    const { createConnection, closeConnection,
    retrieveConnection } = useSQLite({});
    let res: any = await createConnection("testDB"); 
    expect(res).not.toBeNull();
    expect.assertions(2);
    await closeConnection("testDB");
    try {
      res = await retrieveConnection("testDB");
    } catch (e) {
      expect(e).toEqual("Connection testDB does not exist");
    }

});
it('Check CapacitorSQLite create two connections for ios platform', async () => {
    const capacitorMock = (Capacitor as any);
    await capacitorMock.init(true,'ios');
    
    const { createConnection, retrieveAllConnections } = useSQLite({});

    let res: any = await createConnection("testFirstDB"); 
    expect(res).not.toBeNull();
    res = await createConnection("testSecondDB"); 
    expect(res).not.toBeNull();
    res = await retrieveAllConnections();
    let keys = Object.keys(res);
    expect(keys.length).toEqual(2);
    expect(keys[0]).toEqual("testFirstDB");
    expect(keys[1]).toEqual("testSecondDB");
  
});
it('Check CapacitorSQLite close all connections for ios platform', async () => {
    const capacitorMock = (Capacitor as any);
    await capacitorMock.init(true,'ios');
    
    const { createConnection, closeAllConnections,
        retrieveAllConnections } = useSQLite({});

    expect.assertions(6);

    let res: any = await createConnection("testFirstDB"); 
    expect(res).not.toBeNull();
    res = await createConnection("testSecondDB"); 
    expect(res).not.toBeNull();
    res = await retrieveAllConnections();
    let keys = Object.keys(res);
    expect(keys.length).toEqual(2);
    expect(keys[0]).toEqual("testFirstDB");
    expect(keys[1]).toEqual("testSecondDB");
    await closeAllConnections();
    try {
        res = await retrieveAllConnections();
    } catch (e) {
      expect(e).toEqual("No connection returned");
    }
});