/**
 *  Name: contentscript.js
 *  Author: Ashish Chopra
 *  Date: 20 Feb, 2017
 *
 *   This script hosts the logic that runs inside the webpage that is being rendered by the browser.
 *   If you do not have need of content scripts, remove this script from manifest.json and src folder.
 */

console.log('content script');
var start = function(option){
  console.log('loaded option.');
  console.log(option);
}
new Promise(function(resolve, reject) {
  chrome.storage.sync.get({input1:'hoge'},(res)=>resolve(res));
}).then(start);

$(document).on('click',(e)=>{
  chrome.runtime.sendMessage({type:'shot-request',
  message:{
    url:location.href,time:new Date(Date.now()).toLocaleString(),log:'クリックイベントが発火されました'
  }
  },(res)=>{
    console.log(res);
  });
});

// console.log($('button'));
