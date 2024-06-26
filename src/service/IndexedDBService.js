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

  // 批量添加/修改数据
  async batchUpdateItem(storeName, itemList) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      itemList.forEach(item => {
        const request = store.put({ ...item, timestamp: new Date().getTime() });
        request.onerror = () => {
          reject(false);
        };
      });

      transaction.oncomplete = () => {
        resolve(true);
      };
    });
  }

  // 通过主键获取单个数据
  async getItemByKey(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName]);
      const store = transaction.objectStore(storeName);
      const request = store.store(key);

      request.onsuccess = event => {
        resolve(event.target.result);
      };

      request.onerror = () => {
        reject('Error getting items from IndexedDB');
      };
    });
  }

  // 通过指定索引获取数据
  async getItemByIndex(storeName, indexKey, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName]);
      const store = transaction.objectStore(storeName);
      const index = store.index(indexKey);
      const request = index.get(value);

      request.onsuccess = event => {
        resolve(event.target.result);
      };

      request.onerror = () => {
        reject('Error getting items from IndexedDB');
      };
    });
  }

  // 通过条件批量获取数据
  async getItemsByFilter(storeName) {
    return new Promise(resolve => {
      const transaction = this.db.transaction([storeName]);
      const store = transaction.objectStore(storeName);

      // 使用游标直接在对象存储上执行条件搜索
      var request = store.openCursor();

      const result = [];
      request.onsuccess = event => {
        var cursor = event.target.result;
        if (cursor) {
          result.push(cursor.value);

          // 移动游标到下一个数据项
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        resolve(result);
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
  async delItem(storeName, key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index(key);
      const request = index.delete(value);

      request.onsuccess = () => {
        resolve(false);
      };

      request.onerror = event => {
        reject(event);
      };
    });
  }

  // 批量删除数据
  async batchDelItem(storeName, key, value) {
    return new Promise(resolve => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // 使用游标直接在对象存储上执行条件搜索
      var request = store.openCursor();

      request.onsuccess = event => {
        var cursor = event.target.result;
        if (cursor) {
          if (cursor.value?.[key] === value) {
            // 删除满足条件的数据项
            cursor.delete();
          }

          // 移动游标到下一个数据项
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        resolve(true);
      };
    });
  }
}
