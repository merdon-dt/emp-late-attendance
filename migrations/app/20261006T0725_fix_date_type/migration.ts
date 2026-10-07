#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/945b3dc878f38eac619249953813aa06df9fc46d2cd3c80e878b8392cfcec069/contract';
import startContract from '../../snapshots/945b3dc878f38eac619249953813aa06df9fc46d2cd3c80e878b8392cfcec069/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c155836e79f9b8909542b096e9b2afeb2c9f7c36cbb4d268c098d7c51b2551d0/contract';
import endContract from '../../snapshots/c155836e79f9b8909542b096e9b2afeb2c9f7c36cbb4d268c098d7c51b2551d0/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, placeholder } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [

      this.alterColumnType({
        schema: 'public',
        table: 'Attendance',
        column: 'date',
        options: {
          qualifiedTargetType: 'date',
          formatTypeExpected: 'date',
          rawTargetTypeForLabel: 'date',
        },
      }),

      this.alterColumnType({
        schema: 'public',
        table: 'CleaningRecord',
        column: 'date',
        options: {
          qualifiedTargetType: 'date',
          formatTypeExpected: 'date',
          rawTargetTypeForLabel: 'date',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
