console.log('content script');
var AutoLogger = AutoLogger || {};
AutoLogger.DefaultStorategyOpt = 'NAME';

AutoLogger.pathname = new URL(location.href).pathname;

AutoLogger.option = {};

AutoLogger.configDlg_;

AutoLogger.start = function (option) {
  console.log('loaded option.');
  console.log(option);
  AutoLogger.option = option;
  AutoLogger.configDlg_ = new AutoLogger.ConfigDlg(option);
  AutoLogger.refreshListen();
};

AutoLogger.detectUrlChange = function() {
    chrome.runtime.sendMessage({type:'shot-request',
    message:{
      url:location.href,time:new Date(Date.now()).toLocaleString(),log:`${location.href}に遷移しました。`
    }
  },(res)=>{
    console.log(res);
  });
};


AutoLogger.refreshListen = function() {
  $(document).off('.autologger');
  console.log(AutoLogger.option);
  
  var storategyOpt = AutoLogger.option.storategyOpt || AutoLogger.DefaultStorategyOpt;
  var storategy = AutoLogger.Storategies[storategyOpt];
    
    AutoLogger.option.dtls.forEach(dtl=>{
      let event = dtl.event;
      $(document).on(`${event}.autologger`, AutoLogger.ListenTargets, (e) => {
        var $el = $(e.currentTarget);
        if(storategy.check(e,dtl.id)){
          $el.addClass('auto-logger-outline');
          setTimeout(()=>{
            chrome.runtime.sendMessage({type:'shot-request',
            message:{
              url:location.href,time:new Date(Date.now()).toLocaleString(),log:`${dtl.name}に対して${event}が発火されました`
            }
          },(res)=>{
            setTimeout(()=>{
              $el.removeClass('auto-logger-outline')
            },10);
            console.log(res);
          });
        },20)
      }
    });
  });
  if(AutoLogger.option.auto_log_on_change === 'on' || AutoLogger.option.auto_log_on_change === true) {
    $(document).on('change.autologger','input',(e)=>{
      var id = storategy.createItem(e);
      var value = $(e.currentTarget).val();
      chrome.runtime.sendMessage({type:'log-request',
      message:{
        url:location.href,time:new Date(Date.now()).toLocaleString(),log:`${id}への変更イベント。値は${value}です。`
      }
    },(res)=>{
      console.log(res);
    });
    });
  }

  if(AutoLogger.option.auto_shot_on_button === 'on' || AutoLogger.option.auto_shot_on_button === true) {
    $(document).on('click.autologger','button,input[type="submit"],input[type="button"]',(e)=>{
      var text = $(e.currentTarget).text();
      if(!!$(e.currentTarget).attr('type') && text.length <= 0){
        var text = $(e.currentTarget).val();
      }
      chrome.runtime.sendMessage({type:'shot-request',
      message:{
        url:location.href,time:new Date(Date.now()).toLocaleString(),log:`ボタン「${text}」をクリックしました。`
      }
    },(res)=>{
      console.log(res);
    });
    });
  }
}

new Promise(function (resolve, reject) {
  var defaultOpt = $.extend(AutoLogger.ConfigContainer.getDefault(),{url:AutoLogger.pathname});
      AutoLogger.ConfigService.getConfig(AutoLogger.pathname,defaultOpt).then((res)=>resolve(res));
    }).then(AutoLogger.start);

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
  console.log(request);
  switch (request.type) {
    case 'config':
    if(!AutoLogger.configDlg_.isInDocument_){
      AutoLogger.configDlg_.render($('body'));
    } else {
      AutoLogger.configDlg_.getElement().trigger('finish');
    }
      sendResponse({message:'ok'});
      break;
    default:
    sendResponse({message:'unknown'});
  }
});


AutoLogger.fromArrayToButton = function (arr) {
  return arr.map(opt => {
    return `<button type="button" class="btn btn-secondary auto-logger-config-btn auto-logger" data-id="${opt.id}" id="${opt.id}-mode">${opt.name}</button>`
  }).join('\n');
};

AutoLogger.EventTypes = [
  { id: 'click', name: 'クリック' },
  { id: 'focusout', name: 'フォーカスアウト' }
];


AutoLogger.Template = `
<div>
<div style="position:fixed;top:0" id="auto-logger-config-panel">

<div class="btn-toolbar" role="toolbar">
  <div class="btn-group mr-2" role="group">
    ${AutoLogger.fromArrayToButton(AutoLogger.EventTypes)}
  </div>
  <div class="btn-group" role="group">
    <button type="button" class="btn btn-secondary auto-logger" id="finish-config">設定完了</button>
  </div>
</div>

    <div id="autologger-config-container-container">

    </div>

</div>

<div id="auto-logger-overlay" style="display:none;background-color:red;opacity:0.5;position:absolute;pointer-events: none;">
  &nbsp
</div>
</div>
`;

AutoLogger.SELECTOR = '#auto-logger-config-panel';
AutoLogger.INPUT_CSS = 'auto-logger';


AutoLogger.ListenTargets = `${[
  'input' // , 'button'
].join(',')}`;

AutoLogger.Storategies = {
  ITEM_ID: {
    check: function (e, item) {
      var parent = $(e.currentTarget).closest(`[data-itemid="${item}"]`);
      return parent.length > 0;
    },
    createItem: function (e) {
      var $itemIdContainer = $(e.currentTarget).closest('[data-itemid]');
      var itemId = $itemIdContainer.data('itemid');
      return itemId;
    },
  },
  ID: {

    check: function (e, item) {
      return $(e.currentTarget).attr('id') == item;
    },
    createItem: function (e) {
      return $(e.currentTarget).attr('id');
    },

  },
  NAME: {

    check: function (e, item) {
      return $(e.currentTarget).attr('name') == item;
    },
    createItem: function (e) {
      return $(e.currentTarget).attr('name');
    },

  }

}

AutoLogger.ConfigDlg = function(config) {
    this.isInDocument_ = false;
    this.$element_;
    this.$parent_;
    this.storategyOpt_ = config.storategyOpt || AutoLogger.DefaultStorategyOpt;
    this.storategy_ = AutoLogger.Storategies[this.storategyOpt_];
    this.configContainer_;
    this.children_ = [];
    this.initialize(config);
};

AutoLogger.ConfigDlg.prototype.initialize = function(config) {
    this.configContainer_ = new AutoLogger.ConfigContainer(config);
    this.children_.push(this.configContainer_);
};

AutoLogger.ConfigDlg.prototype.render = function ($parent) {
    this.$parent_ = $parent;
    var div = AutoLogger.Template;
    this.$element_ = $(div);
    this.configContainer_.render(this.$element_.find('#autologger-config-container-container'));
    this.$parent_.append(this.$element_);
    this.enterDocument();
}

AutoLogger.ConfigDlg.prototype.enterDocument = function() {
    this.children_.forEach(child=>child.enterDocument());
    this.bindEvents_();
    var url = new URL(location.href);
    this.$element_.find('#url').val(`${url.pathname}`);
    this.isInDocument_ = true;
};

AutoLogger.ConfigDlg.prototype.getElement = function() {
    return this.$element_;
}

AutoLogger.ConfigDlg.prototype.bindEvents_ = function() {
    this.$element_.on('click.autologger', '#finish-config', (e) => {
        this.finishConfig_();
      });
    
      this.$element_.on('finish.autologger',  (e) => {
        this.finishConfig_();
      });
      
    this.$element_.on('click.autologger', '.auto-logger-config-btn', (e) => {
       $(document).off('.config');
       this.configMode_($(e.currentTarget).data('id'));
    });
}



AutoLogger.ConfigDlg.prototype.check_ = function (e, eventId) {
    return this.configContainer_.getValues().dtls.some((item) => {
      return item.event === eventId && this.storategy_.check(e, item.id);
    })
};

AutoLogger.ConfigDlg.prototype.initializeConfigEl_ = function() {
        var $overlay = $('#auto-logger-overlay');
    
        var ignore = function (e) {
          return $(e.currentTarget).hasClass(AutoLogger.INPUT_CSS);
        }
    
        $(document).on('mouseenter.config', AutoLogger.ListenTargets, (e) => {
          if (ignore(e)) {
            return;
          }
          $overlay.show();
          var $el = $(e.currentTarget);
          var offset = $el.offset();
          $overlay.css('top', offset.top).css('left', offset.left).css('width', $el.width()).css('height', $el.height());
        });
    
        $(document).on('mouseleave.config', AutoLogger.ListenTargets, (e) => {
          if (ignore(e)) {
            return;
          }
          $overlay.hide();
        });
};

AutoLogger.ConfigDlg.prototype.configMode_ = function(mode) {
        var eventDef = AutoLogger.EventTypes.find((o) => o.id == mode);
        $(document).on('mouseup.config', AutoLogger.ListenTargets, (e) => {
          if ($(e.currentTarget).hasClass(AutoLogger.INPUT_CSS)) {
            return;
          }
          var id = this.storategy_.createItem(e);
          if (this.check_(e, eventDef.id)) {
            if (confirm(`この要素に対する${eventDef.name}イベントはすでにリッスン対象です。解除しますか？`)) {
              this.configContainer_.deleteItem(eventDef.id,id);
            }
            return;
          }
          if (confirm(`この要素への${eventDef.name}イベントをリッスンしますか？`)) {
            this.configContainer_.appendTr(eventDef,id);
          }
        });
    this.initializeConfigEl_();
}

AutoLogger.ConfigDlg.prototype.finishConfig_ = function() {
    var model = this.configContainer_.getValues();
    this.dispose();
    AutoLogger.ConfigService.updateAnOption(model);
    AutoLogger.option = model;
    this.configContainer_.setItem(model);
    AutoLogger.refreshListen();
};

AutoLogger.ConfigDlg.prototype.exitDocument = function() {
    this.unlistenEvents_();
    this.isInDocument_ = false;
};

AutoLogger.ConfigDlg.prototype.unlistenEvents_ = function () {
    $(document).off('.config');
    $(document).off('.autologger');
};

AutoLogger.ConfigDlg.prototype.dispose = function() {
    if(this.isInDocument_) {
        this.exitDocument();
    }
    this.children_.forEach(child=>child.dispose());
    this.$element_.remove();
};


AutoLogger.detectUrlChange();