var AutoLogger = AutoLogger || {};
AutoLogger.Select = function(table) {
    this.table_ = table;
    this.columns_ = alasql.tables[table].columns;
};

AutoLogger.Select.from = function(table) {
    return new AutoLogger.Select(table);
}

AutoLogger.Select.prototype.where = function(whereObj) {
    var queriableObj = {};
    Object.keys(whereObj).forEach(key=>{
        queriableObj[key.toUpperCase()] = whereObj[key];
    });

    var queryColumns = this.columns_.filter(colDef=>{
        return colDef.columnid.toUpperCase() in queriableObj;
    });

    this.where_ = queryColumns.map(colDef=>{
        return `(${colDef.columnid.toUpperCase()} = ${AutoLogger.Select.ColFunc[colDef.dbtypeid.toUpperCase()](queriableObj[colDef.columnid.toUpperCase()])})`;
    }).join(' AND ');

    return this;
};

AutoLogger.Select.prototype.toString = function() {
    return `SELECT * FROM ${this.table_} WHERE ${this.where_}`;
}

AutoLogger.Select.ColFunc = {
    INT: function (value) {
        return parseInt(value);
    },
    STRING: function (value) {
        return `'${String(value)}'`;
    },
    BOOLEAN: function (value) {
        return value === true;
    }
};