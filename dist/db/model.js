"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModel = exports.normalizeError = void 0;
const supabase_1 = require("../config/supabase");
const registry = {};
const normalizeError = (error) => {
    if (!error)
        return error;
    const wrapped = new Error(error.message || 'Database error');
    wrapped.code = error.code;
    wrapped.details = error.details;
    wrapped.hint = error.hint;
    wrapped.statusCode = 500;
    return wrapped;
};
exports.normalizeError = normalizeError;
const normalizeValue = (value) => {
    if (value instanceof Date)
        return value.toISOString();
    if (value && typeof value === 'object' && typeof value.save === 'function')
        return value._id;
    if (Array.isArray(value))
        return value.map(normalizeValue);
    if (value && typeof value === 'object') {
        const out = {};
        for (const [key, nested] of Object.entries(value)) {
            out[key] = normalizeValue(nested);
        }
        return out;
    }
    return value;
};
const columnFor = (config, field) => {
    if (field === '_id')
        return 'id';
    return config.fields?.[field] ?? field;
};
const toDbValues = (doc, config) => {
    const out = {};
    for (const [key, value] of Object.entries(doc)) {
        if (value === undefined || key === '_hidden')
            continue;
        const col = columnFor(config, key);
        out[col] = normalizeValue(value);
    }
    return out;
};
const toDoc = (row, config) => {
    const doc = {};
    for (const [key, value] of Object.entries(row)) {
        if (key === 'id') {
            doc._id = value;
            continue;
        }
        doc[key] = value;
    }
    for (const field of config.dates ?? []) {
        if (doc[field] != null)
            doc[field] = new Date(doc[field]);
    }
    const hidden = {};
    for (const field of config.hidden ?? []) {
        if (doc[field] !== undefined) {
            hidden[field] = doc[field];
            delete doc[field];
        }
    }
    Object.defineProperty(doc, '_hidden', {
        value: hidden,
        enumerable: false,
        writable: true,
        configurable: true,
    });
    doc.save = async function () {
        this.updatedAt = new Date();
        const values = toDbValues(this, config);
        delete values.id;
        const { error } = await supabase_1.supabase
            .from(config.table)
            .update(values)
            .eq('id', this._id)
            .select()
            .single();
        if (error)
            throw (0, exports.normalizeError)(error);
        return this;
    };
    doc.toJSON = function () {
        return { ...this };
    };
    for (const [name, fn] of Object.entries(config.methods ?? {})) {
        doc[name] = fn.bind(doc);
    }
    return doc;
};
const buildFilter = (config, filter = {}) => {
    const clauses = [];
    for (const [field, value] of Object.entries(filter)) {
        const col = columnFor(config, field);
        const isOperator = value &&
            typeof value === 'object' &&
            !(value instanceof Date) &&
            !Array.isArray(value) &&
            typeof value.save !== 'function';
        if (isOperator) {
            for (const [op, opValue] of Object.entries(value)) {
                const opName = op.replace('$', '');
                if (!['eq', 'neq', 'gte', 'lte', 'in'].includes(opName))
                    continue;
                clauses.push({ col, op: opName, value: normalizeValue(opValue) });
            }
        }
        else {
            clauses.push({ col, op: 'eq', value: normalizeValue(value) });
        }
    }
    return clauses;
};
const populateDocs = async (docs, spec, config) => {
    const target = config.populate?.[spec.path];
    if (!target)
        return;
    const targetConfig = registry[target.modelName];
    if (!targetConfig)
        return;
    const ids = Array.from(new Set(docs.map((d) => d[target.key]).filter((id) => id != null)));
    if (ids.length === 0)
        return;
    let columns = '*';
    if (spec.select) {
        const cols = ['id', ...spec.select.split(/[\s,]+/).filter(Boolean)];
        columns = cols.join(',');
    }
    const { data, error } = await supabase_1.supabase.from(targetConfig.table).select(columns).in('id', ids);
    if (error)
        throw (0, exports.normalizeError)(error);
    const byId = new Map((data ?? []).map((row) => [row.id, row]));
    for (const doc of docs) {
        const fk = doc[target.key];
        const row = fk != null ? byId.get(fk) : undefined;
        if (!row) {
            doc[spec.path] = null;
            continue;
        }
        const sub = toDoc(row, targetConfig);
        if (spec.populate)
            await populateDocs([sub], spec.populate, targetConfig);
        doc[spec.path] = sub;
    }
};
class Query {
    config;
    filterClauses = [];
    orderCol;
    orderAscending = false;
    selectList;
    includeHidden = false;
    populateSpecs = [];
    single = false;
    constructor(config) {
        this.config = config;
    }
    where(filter) {
        this.filterClauses.push(...buildFilter(this.config, filter ?? {}));
        return this;
    }
    sort(spec) {
        const entry = Object.entries(spec)[0];
        if (entry) {
            this.orderCol = columnFor(this.config, entry[0]);
            this.orderAscending = entry[1] !== -1;
        }
        return this;
    }
    select(fields) {
        const cols = [];
        for (const field of fields.split(/[\s,]+/)) {
            if (!field)
                continue;
            if (field.startsWith('+')) {
                this.includeHidden = true;
                cols.push(field.slice(1));
            }
            else {
                cols.push(field);
            }
        }
        this.selectList = cols;
        return this;
    }
    populate(path, select) {
        if (typeof path === 'string') {
            this.populateSpecs.push({ path, select });
        }
        else if (path && typeof path === 'object') {
            this.populateSpecs.push(path);
        }
        return this;
    }
    singleMode() {
        this.single = true;
        return this;
    }
    then(onfulfilled, onrejected) {
        return this.exec().then(onfulfilled, onrejected);
    }
    async exec() {
        const { table } = this.config;
        let columns = '*';
        if (this.selectList) {
            const cols = ['id', ...this.selectList];
            if (this.includeHidden)
                cols.push(...(this.config.hidden ?? []));
            columns = cols.join(',');
        }
        let query = supabase_1.supabase.from(table).select(columns);
        for (const clause of this.filterClauses) {
            if (clause.op === 'eq')
                query = query.eq(clause.col, clause.value);
            else if (clause.op === 'neq')
                query = query.neq(clause.col, clause.value);
            else if (clause.op === 'gte')
                query = query.gte(clause.col, clause.value);
            else if (clause.op === 'lte')
                query = query.lte(clause.col, clause.value);
            else if (clause.op === 'in')
                query = query.in(clause.col, clause.value);
        }
        if (this.orderCol)
            query = query.order(this.orderCol, { ascending: this.orderAscending });
        if (this.single)
            query = query.limit(1).maybeSingle();
        const { data, error } = await query;
        if (error)
            throw (0, exports.normalizeError)(error);
        const rows = this.single ? (data ? [data] : []) : (data ?? []);
        const docs = rows.map((row) => toDoc(row, this.config));
        for (const spec of this.populateSpecs) {
            await populateDocs(docs, spec, this.config);
        }
        return (this.single ? (docs[0] ?? null) : docs);
    }
}
const createModel = (config) => {
    registry[config.name] = config;
    const model = {
        config,
        async create(data) {
            if (config.beforeCreate)
                await config.beforeCreate(data);
            const values = toDbValues({ ...data, createdAt: new Date(), updatedAt: new Date() }, config);
            const { data: rows, error } = await supabase_1.supabase.from(config.table).insert(values).select().single();
            if (error)
                throw (0, exports.normalizeError)(error);
            return toDoc(rows, config);
        },
        findById(id) {
            return new Query(config).where({ _id: id }).singleMode();
        },
        findOne(filter) {
            return new Query(config).where(filter).singleMode();
        },
        find(filter) {
            return new Query(config).where(filter);
        },
        async findOneAndUpdate(filter, update, opts = {}) {
            const existing = await new Query(config).where(filter).singleMode().exec();
            if (existing) {
                const before = opts.new === false ? { ...existing } : null;
                Object.assign(existing, update);
                await existing.save();
                return opts.new === false ? before : existing;
            }
            if (opts.upsert) {
                return model.create({ ...filter, ...update });
            }
            return null;
        },
        async findByIdAndUpdate(id, update) {
            return model.findOneAndUpdate({ _id: id }, update);
        },
        async updateMany(filter, update) {
            let query = supabase_1.supabase
                .from(config.table)
                .update(toDbValues({ ...update, updatedAt: new Date() }, config))
                .select('id');
            const clauses = buildFilter(config, filter);
            for (const clause of clauses) {
                if (clause.op === 'eq')
                    query = query.eq(clause.col, clause.value);
                else if (clause.op === 'neq')
                    query = query.neq(clause.col, clause.value);
                else if (clause.op === 'gte')
                    query = query.gte(clause.col, clause.value);
                else if (clause.op === 'lte')
                    query = query.lte(clause.col, clause.value);
                else if (clause.op === 'in')
                    query = query.in(clause.col, clause.value);
            }
            const { data, error } = await query;
            if (error)
                throw (0, exports.normalizeError)(error);
            return { modifiedCount: data?.length ?? 0 };
        },
        async deleteMany(filter = {}) {
            let query = supabase_1.supabase.from(config.table).delete();
            const clauses = buildFilter(config, filter);
            if (clauses.length === 0) {
                query = query.neq('id', '00000000-0000-0000-0000-000000000000');
            }
            else {
                for (const clause of clauses) {
                    if (clause.op === 'eq')
                        query = query.eq(clause.col, clause.value);
                    else if (clause.op === 'neq')
                        query = query.neq(clause.col, clause.value);
                    else if (clause.op === 'gte')
                        query = query.gte(clause.col, clause.value);
                    else if (clause.op === 'lte')
                        query = query.lte(clause.col, clause.value);
                    else if (clause.op === 'in')
                        query = query.in(clause.col, clause.value);
                }
            }
            const { error, count } = await query;
            if (error)
                throw (0, exports.normalizeError)(error);
            return { deletedCount: count ?? 0 };
        },
    };
    return model;
};
exports.createModel = createModel;
