import { supabase } from '../config/supabase';

// Lightweight Mongoose-like data layer over Supabase (PostgREST).
// Supports the subset of the API used across the Centric MVP:
// create / find / findOne / findById / findOneAndUpdate / findByIdAndUpdate /
// updateMany / deleteMany, plus chained .sort() .select() .populate() and .save().

const NEVER_UUID = '00000000-0000-0000-0000-000000000000';

export interface PopulateSpec {
  path: string;
  select?: string;
  populate?: PopulateSpec;
}

export interface ModelConfig {
  table: string;
  dates?: string[];
  hidden?: string[];
  beforeCreate?: (doc: any) => Promise<any> | any;
  methods?: Record<string, (...args: any[]) => any>;
}

export type Doc = Record<string, any>;

const POPULATE_TABLE: Record<string, string> = {
  package: 'packages',
  journey: 'journeys',
  delivery: 'deliveries',
  user: 'users',
  traveler: 'users',
  sender: 'users',
};

const toDb = (value: any): any => {
  if (value instanceof Date) return value.toISOString();
  return value;
};

const toDbValues = (doc: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (['_id', 'id', 'save', 'toJSON', 'then'].includes(key)) continue;
    // Populated relation docs (attached via .populate) collapse back to their id
    if (value && typeof value === 'object' && typeof value.save === 'function') {
      out[key] = value._id;
      continue;
    }
    out[key] = toDb(value);
  }
  return out;
};

export const normalizeError = (error: any): Error => {
  const err: any = new Error(error?.message || 'Supabase request failed');
  err.statusCode = 400;
  if (error?.code === '23505') {
    err.message = 'Duplicate field value entered';
  } else if (error?.code === '42501') {
    err.message = 'Permission denied by database policy';
    err.statusCode = 403;
  } else if (error?.code === 'PGRST106') {
    err.message =
      'Supabase table does not exist. Run supabase/migrations/0001_init.sql in the Supabase SQL editor first.';
    err.statusCode = 500;
  } else if (error?.code === 'PGRST116') {
    err.statusCode = 404;
  } else {
    err.statusCode = 400;
  }
  return err;
};

const decorate = (config: ModelConfig, row: Record<string, any>, includeHidden = false): Doc => {
  const doc: Doc = { ...row };
  if (config.dates) {
    for (const field of config.dates) {
      if (typeof doc[field] === 'string' || doc[field] instanceof Date) {
        doc[field] = new Date(doc[field]);
      }
    }
  }
  doc.id = row.id;
  doc._id = row.id;
  doc.toJSON = () => {
    const json: Record<string, any> = {};
    for (const [key, value] of Object.entries(doc)) {
      if (['save', 'toJSON', 'then'].includes(key)) continue;
      json[key] = value;
    }
    return json;
  };
  doc.save = async () => {
    const { error } = await supabase
      .from(config.table)
      .update(toDbValues(doc))
      .eq('id', doc.id);
    if (error) throw normalizeError(error);
  };
  if (config.methods) {
    for (const [name, fn] of Object.entries(config.methods)) {
      doc[name] = fn.bind(doc);
    }
  }
  if (config.hidden && !includeHidden) {
    for (const field of config.hidden) {
      delete doc[field];
    }
  }
  return doc;
};

const matchesFilter = (doc: Record<string, any>, filter: Record<string, any>): boolean => {
  for (const [key, expected] of Object.entries(filter)) {
    const actual = key === '_id' ? doc.id : doc[key];
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      if ('$gte' in expected && !(actual >= expected.$gte)) return false;
      if ('$ne' in expected && actual === expected.$ne) return false;
      if ('$in' in expected && !expected.$in.includes(actual)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
};

const applyPopulates = async (doc: Doc, populates: PopulateSpec[]): Promise<void> => {
  for (const spec of populates) {
    const table = POPULATE_TABLE[spec.path];
    if (!table || doc[spec.path] == null) continue;
    const id = typeof doc[spec.path] === 'object' ? doc[spec.path]?.id : doc[spec.path];
    const selectCols = spec.select
      ? `id,${spec.select.split(/[\s,]+/).filter(Boolean).join(',')}`
      : '*';
    const { data, error } = await supabase
      .from(table)
      .select(selectCols)
      .eq('id', id)
      .maybeSingle();
    if (error) throw normalizeError(error);
    if (data) {
      const populated = decorate({ table, dates: ['createdAt', 'updatedAt', 'departureTime'] }, data);
      if (spec.populate) {
        await applyPopulates(populated, [spec.populate]);
      }
      doc[spec.path] = populated;
    }
  }
};

class Query {
  private selectFields = '*';
  private includeHidden = false;
  private orderField?: string;
  private orderAscending = true;
  private populates: PopulateSpec[] = [];

  constructor(
    private config: ModelConfig,
    private filter: Record<string, any>,
    private single: boolean
  ) {}

  select(fields: string): this {
    this.selectFields = fields || '*';
    if (fields.includes('+')) this.includeHidden = true;
    return this;
  }

  sort(spec: Record<string, 1 | -1>): this {
    const entry = Object.entries(spec)[0];
    if (entry) {
      this.orderField = entry[0] === '_id' ? 'id' : entry[0];
      this.orderAscending = entry[1] >= 0;
    }
    return this;
  }

  populate(spec: PopulateSpec | string, fields?: string): this {
    const pop: PopulateSpec =
      typeof spec === 'string'
        ? fields
          ? { path: spec, select: fields }
          : { path: spec }
        : spec;
    this.populates.push(pop);
    return this as any;
  }

  async run(): Promise<any> {
    let query = supabase.from(this.config.table).select(this.selectFields);
    for (const [key, value] of Object.entries(this.filter)) {
      const col = key === '_id' ? 'id' : key;
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        if ('$gte' in value) query = query.gte(col, toDb(value.$gte));
        else if ('$ne' in value) query = query.neq(col, toDb(value.$ne));
        else if ('$in' in value) query = query.in(col, value.$in);
        else query = query.eq(col, toDb(value));
      } else {
        query = query.eq(col, toDb(value));
      }
    }
    if (this.orderField) {
      query = query.order(this.orderField, { ascending: this.orderAscending });
    }

    let data: any;
    if (this.single) {
      const { data: row, error } = await query.single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw normalizeError(error);
      data = row;
    } else {
      const { data: rows, error } = await query;
      if (error) throw normalizeError(error);
      data = rows || [];
    }

    if (this.single) {
      const doc = decorate(this.config, data, this.includeHidden);
      await applyPopulates(doc, this.populates);
      return doc;
    }
    const docs = (data as any[]).map((row) => decorate(this.config, row, this.includeHidden));
    for (const doc of docs) {
      await applyPopulates(doc, this.populates);
    }
    return docs;
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: (value: any) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

class ModelHandle {
  constructor(private config: ModelConfig) {}

  async create(doc: Record<string, any>): Promise<Doc> {
    let input = { ...doc };
    if (this.config.beforeCreate) {
      input = (await this.config.beforeCreate(input)) || input;
    }
    const now = new Date();
    input.createdAt = input.createdAt ?? now;
    input.updatedAt = input.updatedAt ?? now;
    const { data, error } = await supabase
      .from(this.config.table)
      .insert(toDbValues(input))
      .select('*')
      .single();
    if (error) throw normalizeError(error);
    return decorate(this.config, data);
  }

  find(filter: Record<string, any> = {}): Query {
    return new Query(this.config, filter, false);
  }

  findOne(filter: Record<string, any> = {}): Query {
    return new Query(this.config, filter, true);
  }

  findById(id: string): Query {
    return this.findOne({ id });
  }

  async findOneAndUpdate(
    filter: Record<string, any>,
    update: Record<string, any>,
    opts: { new?: boolean; upsert?: boolean } = {}
  ): Promise<Doc | null> {
    const existing = await this.findOne(filter).run();
    if (existing) {
      Object.assign(existing, update);
      await existing.save();
      return opts.new === false ? null : existing;
    }
    if (opts.upsert) {
      const merged: Record<string, any> = {};
      for (const [key, value] of Object.entries(filter)) {
        merged[key === '_id' ? 'id' : key] = value;
      }
      return this.create({ ...merged, ...update });
    }
    return null;
  }

  async findByIdAndUpdate(id: string, update: Record<string, any>): Promise<Doc | null> {
    const existing = await this.findOne({ id }).run();
    if (!existing) return null;
    Object.assign(existing, update);
    await existing.save();
    return existing;
  }

  async updateMany(filter: Record<string, any>, update: Record<string, any>): Promise<void> {
    const { data } = await supabase.from(this.config.table).select('*');
    const rows = (data || []).filter((row: any) => matchesFilter(row, filter));
    for (const row of rows) {
      const doc = decorate(this.config, row);
      Object.assign(doc, update);
      await doc.save();
    }
  }

  async deleteMany(filter: Record<string, any> = {}): Promise<void> {
    let query = supabase.from(this.config.table).delete();
    if (Object.keys(filter).length === 0) {
      query = query.neq('id', NEVER_UUID);
    } else {
      for (const [key, value] of Object.entries(filter)) {
        query = query.eq(key === '_id' ? 'id' : key, toDb(value));
      }
    }
    const { error } = await query;
    if (error) throw normalizeError(error);
  }
}

export const createModel = (config: ModelConfig): ModelHandle => new ModelHandle(config);