console.log('show.js');
var i = 1;
chrome.runtime.sendMessage({type:'greet'},(res)=>{
  $('video').attr('src',res.blobUrl);
});

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
  switch (request.type) {
    case 'shot':
      shot(request);
      sendResponse({message:'shot'});
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
  console.log('append');
  var tr = $(`<tr><td>${arg.time}</td><td><img src="${arg.src}"></img></td><td>${arg.url}</td><td>${arg.log}</td></tr>`);
  console.log(tr);
  $('tbody').append(tr);
  i++;
  // $('.images').append($('<img></img>').attr('src',));
};
