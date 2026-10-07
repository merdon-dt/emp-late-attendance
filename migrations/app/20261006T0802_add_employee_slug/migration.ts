#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/90bed4a0a01ee7f1054b1a0ccfc1829c313c61b4b9d973d781d21bbaecc0fee3/contract';
import endContract from '../../snapshots/90bed4a0a01ee7f1054b1a0ccfc1829c313c61b4b9d973d781d21bbaecc0fee3/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c155836e79f9b8909542b096e9b2afeb2c9f7c36cbb4d268c098d7c51b2551d0/contract';
import startContract from '../../snapshots/c155836e79f9b8909542b096e9b2afeb2c9f7c36cbb4d268c098d7c51b2551d0/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, placeholder, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Employee',
        column: col('slug', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      rawSql({
        id: 'backfill-Employee-slug',
        label: 'Backfill employee slug',
        operationClass: 'data',
        target: 'postgres',
        execute: [{
          description: 'Backfill slug using row_number',
          sql: `
            UPDATE "Employee"
            SET slug = subquery.new_slug
            FROM (
              SELECT id,
                lower(regexp_replace(name, '\\s+', '-', 'g')) || 
                CASE 
                  WHEN ROW_NUMBER() OVER (PARTITION BY lower(regexp_replace(name, '\\s+', '-', 'g')) ORDER BY "createdAt") > 1 
                  THEN '-' || ROW_NUMBER() OVER (PARTITION BY lower(regexp_replace(name, '\\s+', '-', 'g')) ORDER BY "createdAt")
                  ELSE ''
                END as new_slug
              FROM "Employee"
            ) AS subquery
            WHERE "Employee".id = subquery.id AND "Employee".slug IS NULL
          `
        }],
        precheck: [],
        postcheck: []
      }),
      this.setNotNull({ schema: 'public', table: 'Employee', column: 'slug' }),
      this.addUnique({
        schema: 'public',
        table: 'Employee',
        constraint: 'Employee_slug_key',
        columns: ['slug'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
