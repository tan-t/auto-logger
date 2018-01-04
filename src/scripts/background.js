/**
 *  Name: popup.js
 *  Author: Ashish Chopra
 *  Date: 20 Feb, 2017
 *
 *   This script hosts the logic that runs at the background when Chrome loads the extension.
 *
 *   If you do not have background feature in your extension, remove this script  from manifest.json and src folder.
 */

console.log('background');

streamMap = {};
managedTabMap = {};
blobUrlMap = {};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
      case 'greet':
        var fromTabId = sender.tab.id;
        var blobUrl = blobUrlMap[fromTabId];
        sendResponse({ message: "ok" ,blobUrl});
        break;
        case 'shot-request':
        var fromTabId = sender.tab.id;
        if(!managedTabMap[fromTabId]){
          sendResponse();
          return;
        }
        chrome.tabs.sendMessage(managedTabMap[fromTabId],{type:'shot',message:request.message},(res)=>{
          sendResponse({message:'shot'});
        });
        break;
        case 'log-request':
        var fromTabId = sender.tab.id;
        if(!managedTabMap[fromTabId]){
          sendResponse();
          return;
        }
        chrome.tabs.sendMessage(managedTabMap[fromTabId],{type:'log',message:request.message},(res)=>{
          sendResponse({message:'logged'});
        });
      default:
        sendResponse({ message: "unknown" });
    }
});

chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
    case 'toggle-tab-capture':
      handleToggleTabCapture();
    break;
    case 'shot':
    new Promise(function(resolve, reject) {
      chrome.tabs.query({currentWindow: true, active : true},(tabArray)=>{
        var tab = tabArray[0];
        resolve(tab);
      });
    }).then(tab=>{
      var tabId = tab.id;
      if(!managedTabMap[tabId]){
        return;
      }
      chrome.tabs.sendMessage(managedTabMap[tabId],{type:'shot',time:new Date(Date.now()).toLocaleString(),url:tab.url,log:'ショートカットキーからのキャプチャです。'},(res)=>{
        console.log(res);
      });
    });
    break;
  case 'config':
  new Promise(function(resolve, reject) {
    chrome.tabs.query({currentWindow: true, active : true},(tabArray)=>{
      var tab = tabArray[0];
      resolve(tab.id);
    });
  }).then(tabId=>{
    chrome.tabs.sendMessage(tabId,{type:'config'},(res)=>{
      console.log(res);
    });
  });
  break;
    default:
    console.log('default');
  }
});

var handleToggleTabCapture =   function(){
  new Promise(function(resolve, reject) {
    chrome.tabs.query({currentWindow: true, active : true},(tabArray)=>{
      var tab = tabArray[0];
      resolve(tab.id);
    });
  }).then(tabId=>{
      if(streamMap[tabId]){
        streamMap[tabId].getTracks().forEach(t=>t.stop());
        streamMap[tabId] = null;
        return;
      }

      new Promise(function(resolve, reject) {
        chrome.tabCapture.capture({audio:false,video:true},stream=>resolve(stream));
      }).then(stream=>{
        streamMap[tabId] = stream;
         var blobUrl = window.URL.createObjectURL(stream);
        return new Promise(function(resolve, reject) {
          chrome.tabs.create({url: 'show.html',active:false},openTab=>resolve({openTab,blobUrl}));
        });
      }).then(set=>{
        managedTabMap[tabId] = set.openTab.id;
        blobUrlMap[set.openTab.id] = set.blobUrl;
      });
    });
}
