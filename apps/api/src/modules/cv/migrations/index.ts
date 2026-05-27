import { Logger } from '@nestjs/common';

export const CURRENT_SCHEMA_VERSION = 1;

const logger = new Logger('CvMigrations');

/**
 * Type representing CV data at any version.
 */
export type RawCvData = {
  schemaVersion?: number;
  [key: string]: any;
};

/**
 * Individual migration functions mapping old versions to new versions.
 */
const migrations: Record<number, (data: RawCvData) => RawCvData> = {
  // Example of future migration:
  // 1: (data) => {
  //   logger.log('Migrating CV schema from v1 to v2...');
  //   return {
  //     ...data,
  //     schemaVersion: 2,
  //     // perform transformation...
  //   };
  // }
};

/**
 * Orchestrates incremental, sequential migrations on-read.
 * If the CV data's version is older than CURRENT_SCHEMA_VERSION,
 * this function runs all applicable transformations in sequence.
 */
export function migrateCvData(data: RawCvData): {
  migrated: boolean;
  data: RawCvData;
} {
  let version = data.schemaVersion ?? 1;
  let currentData: RawCvData = { ...data, schemaVersion: version };
  let migrated = false;

  while (version < CURRENT_SCHEMA_VERSION) {
    const migrationFn = migrations[version];
    if (!migrationFn) {
      logger.warn(
        `No migration found for schema version v${version}. Stopping migration.`,
      );
      break;
    }

    currentData = migrationFn(currentData);
    version = currentData.schemaVersion ?? version + 1;
    migrated = true;
  }

  // Ensure schemaVersion is locked at current version if updated
  if (currentData.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    currentData.schemaVersion = CURRENT_SCHEMA_VERSION;
  }

  return { migrated, data: currentData };
}
