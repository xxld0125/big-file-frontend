export default class IndexedDBService {
  constructor(dbName, dbVersion) {
    this.dbName = dbName;
    this.dbVersion = dbVersion || 1;
    this.db = null;
  }

  // 打开/新建数据库
  async openDB(stores) {
    const { dbName, dbVersion } = this;
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(dbName, dbVersion);

      request.onerror = () => {
        reject('Error opening IndexedDB database');
      };

      request.onsuccess = event => {
        this.db = event.target.result;
        resolve(true);
      };

      request.onupgradeneeded = event => {
        const db = event.target.result;

        for (const storeName in stores) {
          const { keyPath = 'id', indexList } = stores[storeName];
          if (!db.objectStoreNames.contains(storeName)) {
            // keyPath：主键，主键（key）是默认建立索引的属性；
            // autoIncrement：是否自增；
            // createObjectStore会返回一个对象仓库objectStore(即新建一个表)
            const store = db.createObjectStore(storeName, {
              autoIncrement: true,
              keyPath
            });
            // 创建数据表的索引
            if (indexList && indexList.length) {
              indexList.map(v =>
                // createIndex可以新建索引，unique字段是否唯一
                store.createIndex(v, v, { unique: false })
              );
            }
            store.transaction.oncomplete = () => {
              console.log('创建对象仓库成功');
            };
          }
        }
      };
    });
  }

  // 添加/修改数据
  async updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ ...item, timestamp: new Date().getTime() });

      request.onsuccess = event => {
        resolve(event.target.result);
      };

      request.onerror = () => {
        reject('Error adding item to IndexedDB');
      };
    });
  }

  // 获取单个数据
  async getItem(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName]);
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = event => {
        resolve(event.target.result);
      };

      request.onerror = () => {
        reject('Error getting items from IndexedDB');
      };
    });
  }

  // 批量获取全部数据
  async getAllItems(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName]);
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = event => {
        resolve(event.target.result);
      };

      request.onerror = () => {
        reject('Error getting items from IndexedDB');
      };
    });
  }

  // 删除数据

  async delItem(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve(false);
      };

      request.onerror = event => {
        reject(event);
      };
    });
  }
}
