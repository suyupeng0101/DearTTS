export type CloneVoiceAudioRecord = {
  id: string;
  dataUri: string;
};

const dbName = "deartts_voice_assets";
const storeName = "clone_voice_audio";
const dbVersion = 1;

function openCloneVoiceDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB 打开失败。"));
  });
}

export async function saveCloneVoiceAudio(record: CloneVoiceAudioRecord) {
  const db = await openCloneVoiceDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(record);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("复刻音频保存失败。"));
    };
  });
}

export async function getCloneVoiceAudio(id: string) {
  const db = await openCloneVoiceDb();

  return new Promise<string | null>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(id);

    request.onsuccess = () => {
      const record = request.result as CloneVoiceAudioRecord | undefined;
      db.close();
      resolve(record?.dataUri ?? null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error ?? new Error("复刻音频读取失败。"));
    };
  });
}

export async function deleteCloneVoiceAudio(id: string) {
  const db = await openCloneVoiceDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("复刻音频删除失败。"));
    };
  });
}
