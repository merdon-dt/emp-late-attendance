#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/80767be9ea8498343a752fc7e2c13c7a7e65e571bd729566e080c852ea630d70/contract';
import endContract from '../../snapshots/80767be9ea8498343a752fc7e2c13c7a7e65e571bd729566e080c852ea630d70/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/90bed4a0a01ee7f1054b1a0ccfc1829c313c61b4b9d973d781d21bbaecc0fee3/contract';
import startContract from '../../snapshots/90bed4a0a01ee7f1054b1a0ccfc1829c313c61b4b9d973d781d21bbaecc0fee3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'CleaningRecord',
        column: col('comment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'CleaningRecord',
        column: col('grannyLeave', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'CleaningRecord',
        column: col('officeLeave', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'CleaningRecord',
        column: col('onLeave', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Employee',
        column: col('empId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'Employee',
        constraint: 'Employee_empId_key',
        columns: ['empId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
