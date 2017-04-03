/**
 <li class="aui-list-item">'
 +  '<a class="aui-list-item-link " id="currentCsvFields"'
 +      'href="/sr/jira.issueviews:searchrequest-csv-current-fields/temp/SearchRequest.csv?jqlQuery=order+by+created+DESC&amp;tempMax=1000">'
 +       'Export Excel CSV (current fields) (plugin)'
 +   '</a>'
 +'</li>'
 */
(function (chrome) {

    'use strict';

    var added = false;
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var observer = new MutationObserver(function (mutations, observer) {
        var current = document.getElementById('currentCsvFields');
        if (!added && current) {
            added = true;
            var all = document.getElementById('allCsvFields');
            current.parentElement.parentElement.appendChild(
                createElement('blommish_all', 'JiraExporter CSV (all)', all.getAttribute('href')));
            current.parentElement.parentElement.appendChild(
                createElement('blommish_current', 'JiraExporter CSV (current)', current.getAttribute('href')));
        } else {
            added = false;
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });

    function map(str, callback) {
        var replace = '""';
        var replacement = 'BlommishTemporal';
        var first = true;
        var headers = [];
        var rows = [];

        var lines = str.split('\n');
        var lookingForEndTag = false;
        var i = 0;
        var j = 0;
        for (var lineId = 0; lineId < lines.length; lineId++) {
            var line = lines[lineId];
            if (!rows[i]) {
                rows[i] = [];
            }
            if (first) {
                headers = line.split(',');
                first = false;
            } else {
                while (line && 0 !== line.length) {
                    if (!lookingForEndTag && line.charAt('0') == '"') {
                        lookingForEndTag = true;
                        line = replaceAll(line.substring(1), replace, replacement);
                    }
                    if (lookingForEndTag) {
                        if (!rows[i][j]) {
                            rows[i][j] = '';
                        }

                        if (line.indexOf('"') === -1) {
                            rows[i][j] = (rows[i][j] + line + '\n');
                            line = null;
                        } else if (line.indexOf('""') !== -1 && line.indexOf('""') <= line.indexOf('"')) {
                            var split = splitFirst(line, '""', 2);
                            rows[i][j] = rows[i][j] + split[0] + '""';
                            line = split[1];
                        } else {
                            var split = splitFirst(line, '"', 1);
                            rows[i][j] = replaceAll((rows[i][j] + split[0]), replacement, replace);
                            line = split[1];
                            line = replaceAll(line, replacement, replace);
                            lookingForEndTag = false;
                            j++;
                        }
                    } else {
                        var split = splitFirst(line, ',');
                        rows[i][j++] = split[0];
                        line = split[1];
                    }
                }
                if (!lookingForEndTag && (!line || 0 === line.length)) {
                    i++;
                    j = 0;
                }
            }
        }
        withOptions(headers, rows, callback);
    }

    function withOptions(headers, rows, callback) {
        chrome.storage.sync.get({
            separator: ';',
            commaColumns: 'Custom field (Story Points)'
        }, function (items) {
            var columnNames = items.commaColumns.split(',');
            for (var i = 0; i < columnNames.length; i++) {
                columnNames[i] = columnNames[i].trim();
            }
            callback(toResult(headers, rows, items.separator.trim(), columnNames));
        });
    }

    function toResult(headers, rows, separator, columnNames) {
        var str = "";
        var commaColumns = [];
        for (var i = 0; i < headers.length; i++) {
            if (i !== 0) {
                str += separator;
            }
            if (columnNames.indexOf(headers[i]) > -1) {
                commaColumns.push(i);
            }
            str += headers[i];
        }
        for (var i = 0; i < rows.length; i++) {
            var rowString = "";

            for (var j = 0; j < rows[i].length; j++) {
                if (j !== 0) {
                    rowString += separator;
                }
                var temp = rows[i][j];
                if (commaColumns.indexOf(j) > -1) {
                    temp = temp.replace('.', ',');
                }
                if (temp.indexOf(separator) !== -1 || temp.indexOf('"') !== -1 || temp.indexOf('\n') !== -1) {
                    temp = '"' + temp + '"';
                }
                rowString += temp;
            }
            str += '\n' + rowString;

        }
        return '\ufeff' + str; //Adds BOM, TODO: add checkbox to options in settings to deactivate
    }

    function getPageContents(callback, url, params) {
        var http = new XMLHttpRequest();
        http.open("GET", url, true);
        http.onreadystatechange = function () {
            if (http.readyState == 4 && http.status == 200) {
                callback(http.responseText);
            }
        }
        http.send(params);
    }

    function download(path) {
        getPageContents(function (result) {
            map(result, function (str) {
                var uri = 'data:text/csv;charset=utf-8,' + encodeURI(str);
                var downloadLink = document.createElement("a");
                downloadLink.href = uri;
                downloadLink.download = "jira_export.csv";
                downloadLink.click();
            });
        }, document.location.origin + path)
    }

    function splitFirst(str, del, i) {
        i = typeof i !== 'undefined' ? i : 0;
        if (-1 === str.indexOf(del)) {
            return [str, null];
        } else {
            return [str.substring(0, str.indexOf(del)), str.substring(str.indexOf(del) + 1 + i)];
        }
    }

    function replaceAll(str, search, replacement) {
        return str.replace(new RegExp(search, 'g'), replacement);
    }

    function createElement(id, text, href) {
        var li = document.createElement('li');
        li.setAttribute('class', 'aui-list-item');
        li.innerHTML = '<a class="aui-list-item-link" href="#" id="' + id + '">' + text + '</a>';
        li.addEventListener('click', function () {
            download(href);
        });
        li.addEventListener('mouseover', function () {
            for (var i = 0; i < li.parentElement.childNodes.length; i++) {
                li.parentElement.childNodes[i].className = 'aui-list-item';
            }
            li.className = 'aui-list-item active';
        });
        li.addEventListener('mouseout', function () {
            li.className = 'aui-list-item';
        });
        return li;
    }

}(chrome));
