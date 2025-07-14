import { useState, useCallback, useMemo } from "react";
import { useToast } from "@chakra-ui/react";
import { useDatabase } from "./useDatabase";

type SettingValueType = "string" | "number" | "boolean" | "json";
type SettingValue = string | number | boolean | object;

interface Setting {
  id: number;
  key: string;
  value: string;
  value_type: SettingValueType;
  description?: string;
  updated_at: string;
}

interface QueryOptions<T = any> {
  params?: unknown[];
  skip?: boolean;
  initialData?: T[];
}

interface PaginationConfig {
  enabled: boolean;
  defaultSize: number;
  options: number[];
  rememberPerView: boolean;
}

interface SettingsHook {
  getSetting<T extends SettingValue>(key: string, defaultValue?: T): Promise<T>;
  setSetting<T extends SettingValue>(
    key: string,
    value: T,
    options?: {
      type?: SettingValueType;
      description?: string;
      silent?: boolean;
    },
  ): Promise<void>;
  getAllSettings(): Promise<Record<string, Setting>>;
  resetSetting(key: string): Promise<void>;
  getPageSize(viewKey?: string): Promise<number>;
  setPageSize(size: number, viewKey?: string): Promise<void>;
  getPaginationConfig(): Promise<PaginationConfig>;
  query<T = unknown>(sql: string, options?: QueryOptions<T>): Promise<T[]>;
  mutate(sql: string, params?: unknown[]): Promise<number>;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  resetError(): void;
  reconnect(): Promise<void>;
}

interface DefaultSetting<T extends SettingValue = SettingValue> {
  key: string;
  value: T;
  type: SettingValueType;
  description?: string;
}

const defaultSettings: DefaultSetting[] = [
  {
    key: "shop_name",
    value: "My Retail Store",
    type: "string" as const,
    description: "Name of the shop/business",
  },
  {
    key: "shop_address",
    value: "123 Main Street",
    type: "string" as const,
    description: "Shop physical address",
  },
  {
    key: "pagination_enabled",
    value: true,
    type: "boolean" as const,
    description: "Whether pagination is enabled",
  },
  {
    key: "default_page_size",
    value: 5,
    type: "number" as const,
    description: "Default number of items per page",
  },
  {
    key: "page_size_options",
    value: [10, 20, 50, 100],
    type: "json" as const,
    description: "Available page size options",
  },
  {
    key: "remember_page_size",
    value: true,
    type: "boolean" as const,
    description: "Remember last used page size per view",
  },
  {
    key: "receipt_footer",
    value: "Thank you for shopping with us!",
    type: "string" as const,
  },
  {
    key: "theme",
    value: "light",
    type: "string" as const,
    description: "UI theme (light/dark/system)",
  },
] as const;

export function useSettings(): SettingsHook {
  const { db, isInitializing, error, reconnect, resetError } = useDatabase();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const parseSettingValue = useCallback((setting: Setting): SettingValue => {
    try {
      switch (setting.value_type) {
        case "number":
          return parseFloat(setting.value);
        case "boolean":
          return setting.value.toLowerCase() === "true";
        case "json":
          return JSON.parse(setting.value);
        default:
          return setting.value;
      }
    } catch (e) {
      console.error(`Error parsing setting ${setting.key}`, e);
      return setting.value;
    }
  }, []);

  const inferValueType = useCallback(
    (value: SettingValue): SettingValueType => {
      if (typeof value === "number") return "number";
      if (typeof value === "boolean") return "boolean";
      if (typeof value === "object") return "json";
      return "string";
    },
    [],
  );

  const ensureDefaultSettings = useCallback(async () => {
    if (!db) throw new Error("Database not connected");

    try {
      await db.execute("BEGIN TRANSACTION");
      for (const setting of defaultSettings) {
        await db.execute(
          `INSERT OR IGNORE INTO settings (key, value, value_type, description, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [
            setting.key,
            typeof setting.value === "object"
              ? JSON.stringify(setting.value)
              : String(setting.value),
            setting.type,
            setting.description || null,
          ],
        );
      }
      await db.execute("COMMIT");
    } catch (error) {
      await db.execute("ROLLBACK");
      console.error("Failed to ensure default settings:", error);
      throw error;
    }
  }, [db]);

  const getSetting = useCallback(
    async <T extends SettingValue>(
      key: string,
      defaultValue?: T,
    ): Promise<T> => {
      if (!db) {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error("Database not connected");
      }

      try {
        setIsLoading(true);
        const results = await db.select<Setting[]>(
          "SELECT * FROM settings WHERE key = ? LIMIT 1",
          [key],
        );

        if (!results?.length) {
          if (defaultValue !== undefined) return defaultValue;
          throw new Error(`Setting ${key} not found`);
        }

        return parseSettingValue(results[0]) as T;
      } catch (err) {
        console.error(`Failed to get setting ${key}:`, err);

        if (defaultValue !== undefined) return defaultValue;
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, parseSettingValue],
  );

  const setSetting = useCallback(
    async <T extends SettingValue>(
      key: string,
      value: T,
      options: {
        type?: SettingValueType;
        description?: string;
        silent?: boolean;
      } = {},
    ): Promise<void> => {
      if (!db) throw new Error("Database not connected");

      try {
        setIsLoading(true);
        const type = options.type || inferValueType(value);
        const stringValue =
          type === "json" ? JSON.stringify(value) : String(value);

        await db.execute(
          `INSERT OR REPLACE INTO settings (
            key, value, value_type, description, updated_at
          ) VALUES (?, ?, ?, ?, datetime('now'))`,
          [key, stringValue, type, options.description || null],
        );

        if (!options.silent) {
          toast({
            title: "Setting updated",
            status: "success",
            duration: 2000,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        toast({
          title: "Failed to update setting",
          description: message,
          status: "error",
          duration: 5000,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, inferValueType, toast],
  );

  const resetSetting = useCallback(
    async (key: string): Promise<void> => {
      const defaultSetting = defaultSettings.find((s) => s.key === key);
      if (!defaultSetting) {
        throw new Error(`No default value found for setting ${key}`);
      }
      await setSetting(key, defaultSetting.value, {
        type: defaultSetting.type,
        description: defaultSetting.description,
        silent: true,
      });
    },
    [setSetting],
  );

  const getPageSize = useCallback(
    async (viewKey?: string): Promise<number> => {
      try {
        const rememberPerView = await getSetting<boolean>(
          "remember_page_size",
          true,
        );
        if (rememberPerView && viewKey) {
          try {
            const viewSize = await getSetting<number>(`page_size_${viewKey}`);
            if (viewSize) return viewSize;
          } catch {}
        }
        return await getSetting<number>("default_page_size", 20);
      } catch (err) {
        console.error("Failed to get page size, using default", err);
        return 20;
      }
    },
    [getSetting],
  );

  const setPageSize = useCallback(
    async (size: number, viewKey?: string): Promise<void> => {
      try {
        const options = await getSetting<number[]>(
          "page_size_options",
          [10, 20, 50, 100],
        );
        if (!options.includes(size)) {
          throw new Error(
            `Invalid page size. Allowed values: ${options.join(", ")}`,
          );
        }

        const rememberPerView = await getSetting<boolean>(
          "remember_page_size",
          true,
        );
        if (rememberPerView && viewKey) {
          await setSetting(`page_size_${viewKey}`, size, { type: "number" });
        }
        if (!viewKey) {
          await setSetting("default_page_size", size, { type: "number" });
        }
      } catch (err) {
        console.error("Failed to set page size:", err);
        throw err;
      }
    },
    [getSetting, setSetting],
  );

  const getPaginationConfig =
    useCallback(async (): Promise<PaginationConfig> => {
      try {
        return {
          enabled: await getSetting<boolean>("pagination_enabled", true),
          defaultSize: await getSetting<number>("default_page_size", 20),
          options: await getSetting<number[]>(
            "page_size_options",
            [10, 20, 50, 100],
          ),
          rememberPerView: await getSetting<boolean>(
            "remember_page_size",
            true,
          ),
        };
      } catch (err) {
        console.error("Failed to get pagination config, using defaults", err);
        return {
          enabled: true,
          defaultSize: 20,
          options: [10, 20, 50, 100],
          rememberPerView: true,
        };
      }
    }, [getSetting]);

  const query = useCallback(
    async <T = unknown,>(
      sql: string,
      options: QueryOptions<T> = {},
    ): Promise<T[]> => {
      if (options.skip || isInitializing) return options.initialData || [];
      if (!db) throw new Error("Database not connected");

      try {
        setIsLoading(true);
        const results = await db.select<T[]>(sql, options.params || []);
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Database error";
        toast({
          title: "Query failed",
          description: message,
          status: "error",
          duration: 5000,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, isInitializing, toast],
  );

  const mutate = useCallback(
    async (sql: string, params: unknown[] = []): Promise<number> => {
      if (!db) throw new Error("Database not connected");

      try {
        setIsLoading(true);
        const result = await db.execute(sql, params);
        toast({
          title: "Operation successful",
          status: "success",
          duration: 3000,
        });
        return result.rowsAffected;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Mutation failed";
        toast({
          title: "Operation failed",
          description: message,
          status: "error",
          duration: 5000,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [db, toast],
  );

  const getAllSettings = useCallback(async (): Promise<
    Record<string, Setting>
  > => {
    const settings = await query<Setting>("SELECT * FROM settings");
    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting;
        return acc;
      },
      {} as Record<string, Setting>,
    );
  }, [query]);

  // Initialize default settings on first connection
  // useState(() => {
  //   if (db && !isInitializing) {
  //     ensureDefaultSettings().catch(console.error);
  //   }
  // });

  return {
    getSetting,
    setSetting,
    getAllSettings,
    resetSetting,
    getPageSize,
    setPageSize,
    getPaginationConfig,
    query,
    mutate,
    isLoading: isLoading || isInitializing,
    error,
    isInitializing,
    resetError,
    reconnect,
  };
}
