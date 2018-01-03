var AutoLogger = AutoLogger || {};
AutoLogger.ConfigContainer = function(item){
    this.$parent_;
    this.item_ = item;
    this.configService_ = AutoLogger.ConfigService;
};

AutoLogger.ConfigContainer.prototype.render = function($parent) {
    this.$parent_ = $parent;
    var div = AutoLogger.ConfigContainer.TEMPLATE;
    this.$element_ = $(div);
    this.item_.dtls.forEach(dtl=>{
        this.appendTr_(this.$element_,{name:this.configService_.getEventDef()[dtl.event],id:dtl.event},dtl.id,dtl.name);
    });
    this.$element_.find('#url').val(this.item_.url);
    this.$parent_.append(this.$element_);
    this.enterDocument();
};

AutoLogger.ConfigContainer.prototype.appendTr_ = function($elem,eventDef,id,opt_name) {
    var $configView = $elem.find('#auto-logger-config-view');
    var $tr = $(`<tr class="auto-logger-config-row" data-id="${id}" data-eventid="${eventDef.id}"><td>${eventDef.name}</td><td>${id}</td><td><input type="text" class="form-control auto-logger auto-logger-name">
    </td><td><button type="button" data-id="${id}" data-eventid="${eventDef.id}" class="auto-logger-config-del-btn btn btn-secondary auto-logger">削除</button></td></tr>`);
    $configView.find('tbody').append($tr);
    $tr.find('.auto-logger-name').val(opt_name || id);
};

AutoLogger.ConfigContainer.prototype.enterDocument = function() {
    this.bindEvents_();
};

AutoLogger.ConfigContainer.prototype.bindEvents_ = function() {
    console.log('bind events stub');
};

AutoLogger.ConfigContainer.TEMPLATE =   `

<div>
<div class="form-group">
    <label for="url">URL Matcher</label>
    <input type="text" class="form-control auto-logger" id="url">
  </div>

<div class="container" id="auto-logger-config-view">
<table class="table">
  <tbody>
    <tr>
      <td>
        イベント
      </td>
      <td>
        data-itemid
      </td>
    </tr>
  </tbody>
</table>
</div>
</div>
`