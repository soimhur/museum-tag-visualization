function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout at count " + count);
//                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};

var webPage = require('webpage');
var page = webPage.create();

page.onConsoleMessage = function(msg) {
  console.log(msg);
};

var fs = require('fs');

var writePath = 'scraped.csv';

var writeContent = new String();

var content = fs.read('drawing-tag-fetch.csv', 'utf-8');

var lines = content.split("\n");
    
var addingColumn = [
    "imgUrl",
    "year",
    "artist",
    "material",
    "scale",
    "title"
];

addingColumn.forEach(function(element) {
    lines[0] += "," + element;
});

var collectionSelector = "div.collection-title-wrap div.collection-info";

var count = 0;

function next_line() {
    var line = lines.shift();
    
    if(!line) {
//        console.log(writeContent);
        fs.write(writePath, writeContent, 'w');
        phantom.exit();
    } else {
        var column = line.split(",");
        var address = column[2];
    
        page.open(address, function(status) {
            waitFor(function() {
                return page.evaluate(function(sel) {
                    return document.querySelector(sel);
                }, collectionSelector);
            }, function() {
                var title = "\"" + page.evaluate(function() {
                    return document.querySelector("div.collection-title-wrap div.collection-title").innerHTML;
                }).trim() + "\"";
                var imgUrl = "\"" + page.evaluate(function() {
                    return document.querySelector("div.gallery-one img").getAttribute("src");
                }) + "\"",
                year = "\"" + page.evaluate(function(sel, i) {
                    return document.querySelectorAll(sel)[i].innerHTML;
                }, collectionSelector, addingColumn.indexOf("year") - 1).trim() + "\"",
                artist = "\"" + page.evaluate(function(sel, i) {
                    return document.querySelectorAll(sel)[i].innerHTML;
                }, collectionSelector, addingColumn.indexOf("artist") - 1).trim() + "\"",
                material = "\"" + page.evaluate(function(sel, i) {
                    return document.querySelectorAll(sel)[i].innerHTML;
                }, collectionSelector, addingColumn.indexOf("material") - 1).trim() + "\"",
                scale = "\"" + page.evaluate(function(sel, i) {
                    return document.querySelectorAll(sel)[i].innerHTML;
                }, collectionSelector, addingColumn.indexOf("scale") - 1).trim() + "\"";

                var newData = imgUrl + "," + year + "," + artist + "," + material + "," + scale + "," + title;

//                console.log(newData.replace("\n", ""));
                writeContent += line + "," + newData + "\n";
                console.log(writeContent);

                count++;
                setTimeout(next_line, 1000);
            });
        });
    }
};


writeContent += lines.shift() + "\n";

next_line();