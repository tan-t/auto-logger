console.log('show.js');
var i = 1;

var initialize = function(){
  var Create = AutoLogger.Create;
  alasql(Create.table('AUTOLOGGER_SHOW').column('id','INT').column('time','Date').column('log','STRING').column('url','STRING'));
};

chrome.runtime.sendMessage({type:'greet'},(res)=>{
  $('video').attr('src',res.blobUrl);
});

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
  switch (request.type) {
    case 'shot':
      shot(request);
      sendResponse({message:'shot'});
      break;
    case 'log':
      log(request);
      sendResponse({message:'logged'});
      break;
    default:
    sendResponse({message:'unknown'});
  }
});

var shot = function(request){
  console.log('shot');
  var video = $('video')[0];
  var canvas = $('canvas')[0];
  var ctx = canvas.getContext('2d');
  ctx.drawImage(video,0,0);
  var dataURL = canvas.toDataURL('image/webp');
  var arg = $.extend(request.message,{src:dataURL});
  addRecord(arg);
};

var log = function(request){
  var arg = $.extend({},request.message);
  addRecord(arg);
}

var addRecord = function(arg){
  var record = $.extend({id:i},arg);
  record.time = new Date(Date.parse(record.time));
  delete record.src;
  var insert = AutoLogger.Insert.into('AUTOLOGGER_SHOW').value(record);
  alasql(insert.sql,insert.param);
  console.log('append');
  var img = `<img src="${arg.src}"></img>`;
  if(!'src' in arg){
    img = '<div></div>';
  }
  console.log(arg);
  var tr = $(`<tr data-id="${i}"><td>${arg.time}</td><td>${img}</td><td>${arg.url}</td><td>${arg.log}</td></tr>`);
  console.log(tr);
  $('tbody').append(tr);
  i++;
}

var onChangeSearchInput = function(e) {
  var query = $('#search').val();
  var where = alasql.tables['AUTOLOGGER_SHOW'].columns.reduce((a,b)=>{
    if(b.dbtypeid === 'STRING'){
      a += ` OR (${b.columnid} LIKE '%${query}%')`
    }
    return a;
  },'(1=0)')
  console.log(`SELECT id FROM AUTOLOGGER_SHOW WHERE NOT (${where})`);
  var hideRecords = alasql(`SELECT id FROM AUTOLOGGER_SHOW WHERE NOT (${where})`).map((r)=>r.id);
  $('tr').each((key,tr)=>{
    $(tr).removeClass('hidden');
    if(hideRecords.indexOf(parseInt($(tr).data('id'))) >= 0){
      $(tr).addClass('hidden');
    }
  });
};

var onKeyDownSearchInput = function(e) {
  if(e.keyCode == 46 || e.keyCode == 8 ) {
    onChangeSearchInput();
  }
  if(e.keyCode == 13){
    e.stopPropagation();
    e.preventDefault();
    onChangeSearchInput();
    return false;
  }
}

initialize();

$(document).on('compositionupdate','#search',onChangeSearchInput);
$(document).on('change','#search',onChangeSearchInput);
$(document).on('keydown','#search',onKeyDownSearchInput);