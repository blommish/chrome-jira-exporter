function save_options() {
    var separator = document.getElementById('separator').value;
    var commaColumns = document.getElementById('commaColumns').value;
    chrome.storage.sync.set({
        likesColor: separator,
        commaColumns: commaColumns || ''
    }, function() {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 1000);
    });
}

function restore_options() {
    chrome.storage.sync.get({
        separator: ';',
        commaColumns: 'Custom field (Story Points)'
    }, function(items) {
        console.log('loaded');
        document.getElementById('separator').value = items.separator;
        document.getElementById('commaColumns').value = items.commaColumns;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);