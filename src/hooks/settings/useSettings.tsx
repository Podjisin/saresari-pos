import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { useDatabase } from "../../hooks/useDatabase";

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
  setMultipleSettings(
    settings: Array<{
      key: string;
      value: SettingValue;
      type?: SettingValueType;
      description?: string;
    }>,
  ): Promise<void>;
  getAllSettings(): Promise<Record<string, Setting>>;
  resetSetting(key: string): Promise<void>;
  getPageSize(viewKey?: string): Promise<number>;
  setPageSize(size: number, viewKey?: string): Promise<void>;
  getPaginationConfig(): Promise<PaginationConfig>;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  resetError(): void;
  reconnect(): Promise<void>;
}
interface DefaultSetting {
  key: string;
  value: SettingValue;
  type: SettingValueType;
  description?: string;
}
const defaultSettings: DefaultSetting[] = [
  {
    key: "shop_name",
    value: "My Retail Store",
    type: "string",
    description: "Name of the shop/business",
  },
  {
    key: "shop_address",
    value: "123 Main Street",
    type: "string",
    description: "Shop physical address",
  },
  {
    key: "pagination_enabled",
    value: true,
    type: "boolean",
    description: "Whether pagination is enabled",
  },
  {
    key: "default_page_size",
    value: 5,
    type: "number",
    description: "Default number of items per page",
  },
  {
    key: "page_size_options",
    value: [5, 10, 20, 50, 100],
    type: "json",
    description: "Available page size options",
  },
  {
    key: "remember_page_size",
    value: true,
    type: "boolean",
    description: "Remember last used page size per view",
  },
  {
    key: "receipt_footer",
    value: "Thank you for shopping with us!",
    type: "string",
    description: "Footer text for receipts",
  },
  {
    key: "theme",
    value: "light",
    type: "string",
    description: "UI theme (light/dark/system)",
  },
];
// band-aid for write mutex to prevent concurrent writes
let writeMutex = false;

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
    } catch {
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
        const result = await db.select<Setting[]>(
          "SELECT * FROM settings WHERE key = ? LIMIT 1",
          [key],
        );
        if (!result.length) {
          if (defaultValue !== undefined) return defaultValue;
          throw new Error(`Setting "${key}" not found`);
        }
        return parseSettingValue(result[0]) as T;
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

      while (writeMutex) await new Promise((r) => setTimeout(r, 50));
      writeMutex = true;

      try {
        setIsLoading(true);
        const type = options.type || inferValueType(value);
        const stringValue =
          type === "json" ? JSON.stringify(value) : String(value);

        await db.execute("BEGIN");
        await db.execute(
          `INSERT OR REPLACE INTO settings (key, value, value_type, description, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [key, stringValue, type, options.description || null],
        );
        await db.execute("COMMIT");

        if (!options.silent) {
          toast({
            title: "Setting updated",
            status: "success",
            duration: 2000,
          });
        }
      } catch (err) {
        await db.execute("ROLLBACK");
        toast({
          title: "Failed to update setting",
          description: err instanceof Error ? err.message : String(err),
          status: "error",
          duration: 5000,
        });
        throw err;
      } finally {
        writeMutex = false;
        setIsLoading(false);
      }
    },
    [db, inferValueType, toast],
  );

  const setMultipleSettings = useCallback(
    async (
      settings: Array<{
        key: string;
        value: SettingValue;
        type?: SettingValueType;
        description?: string;
      }>,
    ): Promise<void> => {
      if (!db) throw new Error("Database not connected");

      while (writeMutex) await new Promise((r) => setTimeout(r, 50));
      writeMutex = true;

      try {
        setIsLoading(true);
        await db.execute("BEGIN");

        for (const { key, value, type, description } of settings) {
          const actualType = type || inferValueType(value);
          const stringValue =
            actualType === "json" ? JSON.stringify(value) : String(value);

          await db.execute(
            `INSERT OR REPLACE INTO settings (key, value, value_type, description, updated_at)
             VALUES (?, ?, ?, ?, datetime('now'))`,
            [key, stringValue, actualType, description || null],
          );
        }

        await db.execute("COMMIT");
      } catch (err) {
        await db.execute("ROLLBACK");
        toast({
          title: "Failed to update settings",
          description: err instanceof Error ? err.message : String(err),
          status: "error",
          duration: 5000,
        });
        throw err;
      } finally {
        writeMutex = false;
        setIsLoading(false);
      }
    },
    [db, inferValueType, toast],
  );

  const resetSetting = useCallback(
    async (key: string): Promise<void> => {
      const def = defaultSettings.find((s) => s.key === key);
      if (!def) throw new Error(`No default found for ${key}`);
      await setSetting(key, def.value, {
        type: def.type,
        description: def.description,
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
            return await getSetting<number>(`page_size_${viewKey}`);
          } catch (err) {
            if (err instanceof Error && err.message.includes("not found")) {
              return await getSetting<number>("default_page_size", 20);
            }
            throw err;
          }
        }
        return await getSetting<number>("default_page_size", 20);
      } catch {
        return 20;
      }
    },
    [getSetting],
  );

  const setPageSize = useCallback(
    async (size: number, viewKey?: string): Promise<void> => {
      const options = await getSetting<number[]>(
        "page_size_options",
        [5, 10, 20, 50, 100],
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
      } else {
        await setSetting("default_page_size", size, { type: "number" });
      }
    },
    [getSetting, setSetting],
  );

  const getPaginationConfig =
    useCallback(async (): Promise<PaginationConfig> => {
      return {
        enabled: await getSetting("pagination_enabled", true),
        defaultSize: await getSetting("default_page_size", 20),
        options: await getSetting("page_size_options", [5, 10, 20, 50, 100]),
        rememberPerView: await getSetting("remember_page_size", true),
      };
    }, [getSetting]);

  const getAllSettings = useCallback(async (): Promise<
    Record<string, Setting>
  > => {
    const rows = (await db?.select<Setting[]>("SELECT * FROM settings")) || [];
    return Object.fromEntries(rows.map((s) => [s.key, s]));
  }, [db]);

  return {
    getSetting,
    setSetting,
    setMultipleSettings,
    getAllSettings,
    resetSetting,
    getPageSize,
    setPageSize,
    getPaginationConfig,
    isLoading: isLoading || isInitializing,
    error,
    isInitializing,
    resetError,
    reconnect,
  };
}
