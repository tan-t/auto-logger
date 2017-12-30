// Saves options to chrome.storage
function save_options() {
  var optionsArray = $('form').serializeArray();
  var option = {};
  console.log(optionsArray);
  for(item of optionsArray){
    option[item.name] = item.value;
  }
  console.log(option);
  chrome.storage.sync.set(option, function() {
    var status = $('#status').find('.alert');
    status.text('Options saved.');
    status.addClass('alert-success');
    setTimeout(function() {
      status.text('');
      status.removeClass('alert-success');
    }, 1750);
  });
}

function restore_options() {
  chrome.storage.sync.get(
    {input1:'hoge'}
    , function(option) {
    for(key in option){
      $('form').find(`[name="${key}"]`).val(option[key]);
    }
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
