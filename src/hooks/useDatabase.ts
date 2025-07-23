import { useEffect, useRef, useState, useCallback } from "react";
import Database from "@tauri-apps/plugin-sql";
import { useToast } from "@chakra-ui/react";

export type DatabaseHook = {
  db: Database | null;
  isInitializing: boolean;
  error: string | null;
  resetError: () => void;
  reconnect: () => Promise<void>;
  isConnected: boolean;
  checkConnection: () => Promise<boolean>;
};

// Singleton pattern with connection queue
// to ensure only one instance of the database is used across the app
// This avoids multiple connections and ensures proper resource management.
// As to why I didnt used this before, I forgor 💀
let globalDbInstance: Database | null = null;
let connectionPromise: Promise<Database> | null = null;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * React hook that manages a singleton SQLite database connection with automatic initialization, configuration, health checks, error handling, and reconnection logic.
 *
 * Ensures a single shared database instance across the app, handles connection retries with exponential backoff, and exposes connection status and control functions.
 *
 * @returns An object containing the database instance, connection status, error state, and utility functions for error reset, reconnection, and connection health checks.
 */
export function useDatabase(): DatabaseHook {
  const [isInitializing, setIsInitializing] = useState(!globalDbInstance);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const dbRef = useRef<Database | null>(globalDbInstance);
  const toast = useToast();
  const retryCountRef = useRef(0);

  const configureDatabase = useCallback(async (db: Database) => {
    try {
      await db.execute("PRAGMA journal_mode = WAL;");
      await db.execute("PRAGMA synchronous = NORMAL;");
      await db.execute(`PRAGMA busy_timeout = ${5 * 1000};`);
    } catch (error) {
      console.warn("Failed to configure database pragmas:", error);
    }
  }, []);

  const initializeDB = useCallback(
    async (isRetry = false): Promise<boolean> => {
      try {
        if (!isRetry) {
          setIsInitializing(true);
          setError(null);
        }

        // Use existing connection promise if available
        if (connectionPromise && !isRetry) {
          const db = await connectionPromise;
          dbRef.current = db;
          return true;
        }

        // Close existing connection if retrying
        if (isRetry && globalDbInstance) {
          try {
            await globalDbInstance.close();
          } catch (e) {
            console.warn("Error closing previous connection:", e);
          }
          globalDbInstance = null;
          dbRef.current = null;
        }

        // Create new connection
        connectionPromise = Database.load("sqlite:saresari.db");
        const db = await connectionPromise;

        await configureDatabase(db);

        globalDbInstance = db;
        dbRef.current = db;
        connectionPromise = null;
        setIsConnected(true);
        retryCountRef.current = 0;

        if (!isRetry) {
          setIsInitializing(false);
        }

        return true;
      } catch (err) {
        connectionPromise = null;
        const message = err instanceof Error ? err.message : "Database error";
        setError(message);
        setIsConnected(false);
        retryCountRef.current++;

        if (!isRetry) {
          setIsInitializing(false);
        }

        return false;
      }
    },
    [configureDatabase],
  );

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!dbRef.current) return false;

    try {
      // Simple query to test connection
      await dbRef.current.select("SELECT 1 as test");
      return true;
    } catch {
      return false;
    }
  }, []);

  const reconnect = useCallback(async (): Promise<void> => {
    if (retryCountRef.current >= MAX_RETRIES) {
      setError("Max reconnection attempts reached");
      return;
    }

    const success = await initializeDB(true);
    if (success) {
      toast({
        title: "Database reconnected",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Reconnection failed",
        description: `Attempt ${retryCountRef.current} of ${MAX_RETRIES}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });

      // Auto-retry with backoff
      if (retryCountRef.current < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * retryCountRef.current),
        );
        await reconnect();
      }
    }
  }, [initializeDB, toast]);

  useEffect(() => {
    let isMounted = true;

    const attemptConnection = async () => {
      if (!globalDbInstance) {
        await initializeDB();
      } else if (isMounted) {
        const healthy = await checkConnection();
        if (!healthy) {
          await reconnect();
        } else {
          dbRef.current = globalDbInstance;
          setIsInitializing(false);
          setIsConnected(true);
        }
      }
    };

    attemptConnection();

    return () => {
      isMounted = false;
      // Don't close connection here - keep singleton alive
      // Why are you reading this anyway?
    };
  }, [initializeDB, checkConnection, reconnect]);

  return {
    db: dbRef.current,
    isInitializing,
    error,
    resetError: () => setError(null),
    reconnect,
    isConnected,
    checkConnection,
  };
}
