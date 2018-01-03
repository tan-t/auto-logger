var AutoLogger = AutoLogger || {};

AutoLogger.Create = function(table) {
    this.table_ = table;
    this.columns_ = [];
};

AutoLogger.Create.prototype.column = function(name,type) {
    this.columns_.push({name,type});
    return this;
};

AutoLogger.Create.prototype.toString = function() {
    return `CREATE TABLE ${this.table_} (${this.columns_.map((colDef)=>{return colDef.name + ' ' + colDef.type}).join(',')})`;
};

AutoLogger.Create.table = function(table){
    return new AutoLogger.Create(table);
}