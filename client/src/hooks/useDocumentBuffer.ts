import { useState, useEffect, useCallback } from "react";

interface DocumentBuffer {
  id: string;
  content: string;
  format: string;
  lastSaved: number;
  module: string;
}

const DB_NAME = "StefanDocumentBuffer";
const STORE_NAME = "documents";
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function saveDocument(doc: DocumentBuffer): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(doc);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function loadDocument(id: string): Promise<DocumentBuffer | null> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

async function deleteDocument(id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export function useDocumentBuffer(
  documentId: string,
  module: string,
  initialContent: string = ""
) {
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load document from buffer on mount
  useEffect(() => {
    const loadBuffer = async () => {
      try {
        const doc = await loadDocument(documentId);
        if (doc) {
          setContent(doc.content);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load document buffer:", error);
        setIsLoading(false);
      }
    };

    loadBuffer();
  }, [documentId]);

  // Auto-save every 5 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      if (content && content !== initialContent) {
        try {
          setIsSaving(true);
          await saveDocument({
            id: documentId,
            content,
            format: "text",
            lastSaved: Date.now(),
            module,
          });
          setIsSaving(false);
        } catch (error) {
          console.error("Failed to auto-save document:", error);
          setIsSaving(false);
        }
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(autoSaveInterval);
  }, [content, documentId, initialContent, module]);

  const saveManually = useCallback(async () => {
    try {
      setIsSaving(true);
      await saveDocument({
        id: documentId,
        content,
        format: "text",
        lastSaved: Date.now(),
        module,
      });
      setIsSaving(false);
      return true;
    } catch (error) {
      console.error("Failed to save document:", error);
      setIsSaving(false);
      return false;
    }
  }, [content, documentId, module]);

  const clearBuffer = useCallback(async () => {
    try {
      await deleteDocument(documentId);
      setContent("");
      return true;
    } catch (error) {
      console.error("Failed to clear document buffer:", error);
      return false;
    }
  }, [documentId]);

  return {
    content,
    setContent,
    isLoading,
    isSaving,
    saveManually,
    clearBuffer,
  };
}
