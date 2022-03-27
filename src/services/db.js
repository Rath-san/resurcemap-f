import PouchDB from 'pouchdb-browser';

const errors = {
  notFound: 404,
};

export default (dbName) => {
  const db = new PouchDB(dbName, {
      auto_compaction: true
  });

  const sync = () =>
    PouchDB.sync(dbName, `http://localhost:5984/${dbName}`, {
      live: true,
      retry: true,
    });

  const initialize = () => {
    // sync();
  };

  const createOrUpdate = async (id, data) => {
    try {
      // find
      const existingEntry = await db.get(id);

      // update
      const updatedEntry = await db.put({
        _id: id,
        _rev: existingEntry._rev,
        marker: { ...existingEntry.marker, ...data },
      });

      return db.get(updatedEntry.id);
    } catch (error) {
      if (error.status === 404) {
        try {
          // create
          const newEntry = await db.put({
            _id: id,
            marker: data,
          });

          return db.get(newEntry.id);
        } catch (error) {
          // error
          console.error(error);
        }
      }
    }
  };

  const getById = async (id) => {
    return db.get(id);
  };

  const get = async (ids = []) => {
    try {
      const allEntries = await db.allDocs({
        include_docs: true,
      });

      if (allEntries.rows.length) {
        return allEntries.rows.map((row) => ({
          id: row.id,
          ...row.doc.marker,
        }));
      }

      return [];
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const remove = async (id) => {
    try {
      const removedEntry = await getById(id);

      if (removedEntry) {
        db.remove(removedEntry);
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  initialize();

  return {
    createOrUpdate,
    get,
    getById,
    remove,
  };
};
