var AutoLogger = AutoLogger || {};
AutoLogger.ConfigContainer = function(item){
    this.$parent_;
    this.item_ = item;
    this.configService_ = AutoLogger.ConfigService;
    this.isDocument_ = false;
};

AutoLogger.ConfigContainer.prototype.setItem = function(item){
    this.item_ = item;
};

AutoLogger.ConfigContainer.prototype.render = function($parent) {
    this.$parent_ = $parent;
    var div = AutoLogger.ConfigContainer.TEMPLATE;
    this.$element_ = $(div);
    this.item_.dtls.forEach(dtl=>{
        this.appendTr({name:this.configService_.getEventDef()[dtl.event],id:dtl.event},dtl.id,dtl.name);
    });
    this.$element_.find('form').find('input').each((inx,input)=>{
        var value = this.item_[$(input).attr('name')] ;
        $(input).val(value);
        // why do I have to do this man...
        if($(input).attr('type') == 'checkbox') {
            $(input).attr('checked', value === 'on' || value === true);
        }
    });
    this.$parent_.append(this.$element_);
};

AutoLogger.ConfigContainer.prototype.appendTr = function(eventDef,id,opt_name) {
    var $configView = this.getConfigView_();
    var $tr = $(`<tr class="auto-logger-config-row" data-id="${id}" data-eventid="${eventDef.id}"><td>${eventDef.name}</td><td>${id}</td><td><input type="text" class="form-control auto-logger auto-logger-name">
    </td><td><button type="button" data-id="${id}" data-eventid="${eventDef.id}" class="auto-logger-config-del-btn btn btn-secondary auto-logger">削除</button></td></tr>`);
    $configView.find('tbody').append($tr);
    $tr.find('.auto-logger-name').val(opt_name || id);
};

AutoLogger.ConfigContainer.prototype.enterDocument = function() {
    this.bindEvents_();
    this.isDocument_ = true;
};

AutoLogger.ConfigContainer.prototype.getConfigView_ = function() {
    return this.$element_.find('#auto-logger-config-view');
};

AutoLogger.ConfigContainer.prototype.getValues = function() {
    var model = this.$element_.find('form').serializeArray().reduce((a,b)=>{
        a[b.name] = b.value;
        return a;
    },{});

    this.$element_.find('form').find('input[type="checkbox"]').each((inx,checkbox)=>{
        model[$(checkbox).attr('name')] = $(checkbox).is(':checked');
    });
    
    model.dtls = [];
    var $configView = this.getConfigView_();
    $configView.find('tr.auto-logger-config-row').each((inx,tr)=>{
      var data = $(tr).data();
      model.dtls.push({event:data.eventid,name:$(tr).find('.auto-logger-name').val(),id:data.id});
    });
    return model;
};

AutoLogger.ConfigContainer.prototype.deleteItem = function(event,id) {
    this.getConfigView_().find(`tr[data-eventid="${event}"][data-id="${id}"]`).remove();
};

AutoLogger.ConfigContainer.prototype.bindEvents_ = function() {
  this.$element_.on('click.autologger', '.auto-logger-config-del-btn', (e) => {
    var data = $(e.currentTarget).data();
    this.deleteItem(data.eventid,data.id);
  });
};

AutoLogger.ConfigContainer.prototype.unlistenEvents_ = function() {
    this.$element_.off('.autologger');
};

AutoLogger.ConfigContainer.prototype.exitDocument = function() {
    this.unlistenEvents_();
    this.isDocument_ = false;
};

AutoLogger.ConfigContainer.prototype.dispose = function() {
    if(this.isInDocument_) {
        this.exitDocument();
    }
    this.$element_.remove();
};

AutoLogger.ConfigContainer.getDefault = function() {
    return {
        dtls:[],
        auto_log_on_change:true,
        auto_shot_on_button:true
    };
};

AutoLogger.ConfigContainer.TEMPLATE =   `
<div>
<form>
<div class="form-group">
    <label for="url">URL Matcher</label>
    <input type="text" class="form-control auto-logger" id="url" name="url">
</div>
<div class="form-check">
    <input type="checkbox" class="form-check-input" id="auto_log_on_change" name="auto_log_on_change" >
    <label class="form-check-label" for="auto_log_on_change">auto log on change? [default : true]</label>
</div>
<div class="form-check">
    <input type="checkbox" class="form-check-input" id="auto_shot_on_button" name="auto_shot_on_button" >
    <label class="form-check-label" for="auto_shot_on_button">auto shot on click the button? [default : true]</label>
</div>
</form>

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