console.log('content script');
var AutoLogger = AutoLogger || {};
AutoLogger.DefaultStorategyOpt = 'NAME';

AutoLogger.pathname = new URL(location.href).pathname;

AutoLogger.option = {};

AutoLogger.start = function (option) {
  console.log('loaded option.');
  console.log(option);
  AutoLogger.option = option[AutoLogger.pathname];
  AutoLogger.refreshListen();
}

AutoLogger.refreshListen = function() {
  $(document).off('.autologger');

  var storategyOpt = AutoLogger.option.storategyOpt || AutoLogger.DefaultStorategyOpt;
  var storategy = AutoLogger.Storategies[storategyOpt];
  var listenTargetItemIds = AutoLogger.option.listenTargetItemIds;

  $.each(Object.keys(listenTargetItemIds), (idx, event) => {
    $(document).on(`${event}.autologger`, AutoLogger.ListenTargets, (e) => {
      var $el = $(e.currentTarget);
      var foundItem = listenTargetItemIds[event].find((item) => {
        return storategy.check(e, item.id);
      });
      if (foundItem) {
        $el.addClass('auto-logger-outline');
        setTimeout(()=>{
          chrome.runtime.sendMessage({type:'shot-request',
          message:{
            url:location.href,time:new Date(Date.now()).toLocaleString(),log:`${foundItem.name}に対して${event}が発火されました`
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
}

new Promise(function (resolve, reject) {
  var defaultOpt = {};
  defaultOpt[AutoLogger.pathname] = {listenTargetItemIds:[]};
  // chrome.storage.sync.get(defaultOpt, (res) => resolve(res));
  AutoLogger.ConfigService.getOptionFromContentScript(AutoLogger.pathname,defaultOpt).then((res)=>resolve(res));
}).then(AutoLogger.start);

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
  console.log(request);
  switch (request.type) {
    case 'config':
    if(!AutoLogger.isInDocument_){
      AutoLogger.render(AutoLogger.option);
    } else {
      $(AutoLogger.SELECTOR).trigger('finish');
    }
      sendResponse({message:'ok'});
      break;
    default:
    sendResponse({message:'unknown'});
  }
});


// $(document).on('click',(e)=>{

// });

// TODO refactor...
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

  <div class="form-group">
    <label for="url-matcher">URL Matcher</label>
    <input type="text" class="form-control auto-logger" id="url-matcher">
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

<div id="auto-logger-overlay" style="display:none;background-color:red;opacity:0.5;position:absolute;pointer-events: none;">
  &nbsp
</div>
</div>
`;

AutoLogger.SELECTOR = '#auto-logger-config-panel';
AutoLogger.INPUT_CSS = 'auto-logger';


AutoLogger.ListenTargets = `${[
  'input', 'button'
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

AutoLogger.enterDocument = function (option) {
  var storategyOpt = option.storategyOpt || AutoLogger.DefaultStorategyOpt;
  var storategy = AutoLogger.Storategies[storategyOpt];

  var listenTargetItemIds = AutoLogger.EventTypes.reduce((a, b) => {
    a[b.id] = [];
    return a;
  }, {});

  $.extend(listenTargetItemIds,option.listenTargetItemIds);

  var appendTr = function(eventDef,id,opt_name) {
    var $configView = $('#auto-logger-config-view');
    var $tr = $(`<tr class="auto-logger-config-row" data-id="${id}" data-eventid="${eventDef.id}"><td>${eventDef.name}</td><td>${id}</td><td><input type="text" class="form-control auto-logger auto-logger-name">
    </td><td><button type="button" data-id="${id}" data-eventid="${eventDef.id}" class="auto-logger-config-del-btn btn btn-secondary auto-logger">削除</button></td></tr>`);
    $configView.find('tbody').append($tr);
    $tr.find('.auto-logger-name').val(opt_name || id);
  };

  Object.keys(listenTargetItemIds).forEach((eventId)=>{
    var eventDef = AutoLogger.EventTypes.find((o) => o.id == eventId);
    listenTargetItemIds[eventId].forEach(item=>{
      appendTr(eventDef,item.id,item.name);
    });
  });

  var check = function (e, eventId) {
    return listenTargetItemIds[eventId].some((item) => {
      return storategy.check(e, item.id);
    })
  };

  var configMode = function () {
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

  }

  var handleEventConfigMode = function (mode) {
    var eventDef = AutoLogger.EventTypes.find((o) => o.id == mode);
    var $configView = $('#auto-logger-config-view');
    $(document).on('mouseup.config', AutoLogger.ListenTargets, (e) => {
      if ($(e.currentTarget).hasClass(AutoLogger.INPUT_CSS)) {
        return;
      }
      var id = storategy.createItem(e);
      if (check(e, eventDef.id)) {
        if (confirm(`この要素に対する${eventDef.name}イベントはすでにリッスン対象です。解除しますか？`)) {
          var removeInx = listenTargetItemIds[eventDef.id].findIndex((item) => {
            return id == item.id;
          });
          listenTargetItemIds[eventDef.id].splice(removeInx, 1);
          $configView.find(`tr[data-id="${id}"][data-eventid="${eventDef.id}"]`).remove();
        }
        return;
      }
      if (confirm(`この要素への${eventDef.name}イベントをリッスンしますか？`)) {
        listenTargetItemIds[eventDef.id].push({id,name:id});
        appendTr(eventDef,id);
      }
    });
    configMode();
  }

  $(AutoLogger.SELECTOR).on('click.autologger', '#finish-config', (e) => {
    finishConfig();
  });

  $(AutoLogger.SELECTOR).on('finish.autologger',  (e) => {
    finishConfig();
  });

  var finishConfig = function() {
    $(document).off('.config');
    $(document).off('.autologger');
    $('#auto-logger-overlay').hide();
    var matcher = $(AutoLogger.SELECTOR).find('#url-matcher').val();
    var $configView = $('#auto-logger-config-view');
    $configView.find('tr.auto-logger-config-row').each((inx,tr)=>{
      var data = $(tr).data();
      listenTargetItemIds[data.eventid].find(item=>{
        return item.id == data.id;
      }).name = $(tr).find('.auto-logger-name').val();
    });
    var innerModel = { matcher, listenTargetItemIds,storategyOpt };
    // chrome.storage.sync.set(model);
    AutoLogger.ConfigService.updateOptionFromContentScript(innerModel);
    $(AutoLogger.SELECTOR).remove();
    AutoLogger.option = innerModel;
    AutoLogger.refreshListen();
    AutoLogger.isInDocument_ = false;
  }



  $(AutoLogger.SELECTOR).on('click.autologger', '.auto-logger-config-btn', (e) => {
    $(document).off('.config');
    handleEventConfigMode($(e.currentTarget).data('id'));
  });

  $(AutoLogger.SELECTOR).on('click.autologger', '.auto-logger-config-del-btn', (e) => {
    var data = $(e.currentTarget).data();
    var removeInx = listenTargetItemIds[data.eventid].findIndex((item) => {
      return data.id == item.id;
    });
    listenTargetItemIds[data.eventid].splice(removeInx, 1);
    $(e.currentTarget).parents('tr').remove();
  });

  var url = new URL(location.href);
  $(AutoLogger.SELECTOR).find('#url-matcher').val(`${url.pathname}`);
  AutoLogger.isInDocument_ = true;
}

AutoLogger.render = function (option) {
  $('body').append($(AutoLogger.Template));
  AutoLogger.enterDocument(option);
}

AutoLogger.isInDocument_ = false;