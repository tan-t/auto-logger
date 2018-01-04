var AutoLogger = AutoLogger || {};

AutoLogger.Insert = function (table) {
    this.table_ = table;
    this.columns_ = alasql.tables[table].columns;
};

AutoLogger.Insert.prototype.value = function (valueObj) {
    var insertableObj = {};
    Object.keys(valueObj).forEach(key => {
        insertableObj[key.toUpperCase()] = valueObj[key];
    });
    var givenColumns = this.columns_.filter(colDef => {
        return colDef.columnid.toUpperCase() in insertableObj;
    });
    return {sql:`INSERT INTO ${this.table_} (${givenColumns.map(colDef => colDef.columnid).join(',')}) 
        VALUES (${givenColumns.map((col)=>'?').join(',')})`,param:givenColumns.map(colDef => AutoLogger.Insert.ColFunc[colDef.dbtypeid](insertableObj[colDef.columnid.toUpperCase()]))};
};

AutoLogger.Insert.ColFunc = {
    INT: function (value) {
        return parseInt(value);
    },
    STRING: function (value) {
        return `'${String(value)}'`;
    },
    BOOLEAN: function (value) {
        return value === true;
    },
    Date : function(value) {
        return value;
    }
};

AutoLogger.Insert.into = function (table) {
    return new AutoLogger.Insert(table);
};