import { app } from 'electron';
import { existsSync, mkdirSync, readdirSync, readJsonSync, removeSync, writeJsonSync } from 'fs-extra';
import { join, parse } from 'path';
import * as uuid4 from 'uuid4';

export const USER_DATA_PATH = app.getPath('userData');

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type DataValue = { [p: string]: any };

export class DataGroup {

  readonly path: string = join(USER_DATA_PATH, this.name);

  readonly items = new Map<string, DataItem>();

  constructor(public readonly name: string) {
    this.refresh();
  }

  refresh(): void {
    if (!existsSync(this.path)) {
      mkdirSync(this.path);
    }
    this.items.clear();
    for (const item of readdirSync(this.path)) {
      const parsed = parse(item);
      if (parsed.ext === '.json') {
        new DataItem(this, parsed.name);
      }
    }
  }

  destroy(): void {
    removeSync(this.path);
  }

  loadItems(): DataValue[] {
    const output: DataValue[] = [];
    this.items.forEach((item: DataItem): void => {
      output.push(item.load());
    });
    return output;
  }
}

export class DataItem {

  private readonly path = join(this.group.path, `${this.id}.json`);

  private value?: DataValue;

  constructor(public readonly group: DataGroup,
              public readonly id: string = uuid4()) {
    this.group.items.set(this.id, this);
  }

  load(): DataValue {
    if (this.value) {
      return this.value;
    }
    this.value = readJsonSync(this.path, { throws: false }) as DataValue;
    if (!this.value) {
      this.value = {};
    }
    this.value.id = this.id;
    return this.value;
  }

  save(value: DataValue): DataValue {
    value.id = this.id;
    writeJsonSync(this.path, value);
    this.value = value;
    return value;
  }

  destroy(): void {
    removeSync(this.path);
    this.group.items.delete(this.id);
  }
}
