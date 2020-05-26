

console.log("world world world ")


let tocData;
const linkset = [];
const linkset2 = [];

const testdata = [
    {
        "name": "Structures and Enumerators",
        "dst": "/en-us/ipp-dev-reference-structures-and-enumerators"
    },
    [
        [
            {
                "name": "Library Version Structure",
                "dst": "/en-us/ipp-dev-reference-library-version-structure"
            }
        ],
        [
            {
                "name": "Complex Data Structures",
                "dst": "/en-us/ipp-dev-reference-complex-data-structures"
            }
        ]
    ]];

function flatData(data, first = false) {
    for (el of data) {
        if (Array.isArray(el)) {
            flatData(el);
        } else {

            const newlink = el.dst.split('/')[2] + ".html";
            el.dst = newlink;

            el.tag = document.createElement('a');
            el.tag.href = el.dst;
            el.tag.textContent = el.name;

            linkset.push(el);
        }
    }

    if (first) {
        for (el of linkset) {
            linkset2.push(el.name);
        }
    }

}

function buildToc_sub(tree, parantTag) {

    if (tree.length === 1) {

        if (!Array.isArray(tree[0])) {
            const link = tree[0].tag;
            if (parantTag.tagName === "DETAILS") {
                const ul = document.createElement("ul");
                parantTag.appendChild(ul);

                const li = document.createElement("li");
                ul.appendChild(li);

                li.appendChild(link);
            } else {
                parantTag.appendChild(link);
            }
        } else {
            buildToc_sub(tree[0], parantTag);
        }
    } else if (tree.length >= 2 && !Array.isArray(tree[0]) && Array.isArray(tree[1])) {
        const details = document.createElement("details");
        parantTag.appendChild(details);
        details.open = true;

        const summary = document.createElement("summary");
        details.appendChild(summary);

        summary.appendChild(tree[0].tag);

        buildToc_sub(tree[1], details);

        if (tree.length >= 2) {
            // console.log(tree);
        }
    } else {

        const ul = document.createElement("ul");
        parantTag.appendChild(ul);

        for (it of tree) {
            const li = document.createElement("li");
            ul.appendChild(li);

            if (!Array.isArray(it)) {
                li.appendChild(it.tag);
            } else {
                buildToc_sub(it, li);
            }

        }

    }
}

function buildToc(data) {

    const toc = document.getElementById("toc");

    const top = document.createElement("div");
    toc.appendChild(top);

    top.id = "top";


    buildToc_sub(data, top);


}

function handleDataLoad(data) {
    tocData = data;
    flatData(data, true);

    buildToc(data);
}

// flatData(testdata);
// console.log(linkset);

fetch("./ipptoc.json")
    .then(response => response.json())
    .then(data => handleDataLoad(data));


// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------

var patternField;
var matchFn = fuzzyMatch;
var resultsTime;
var resultsList = null;
let currentDataSet = linkset;

var asyncMatcher = null;

onload = function () {
    this.console.log("on load fn")
    // Initialize document element references
    patternField = document.getElementById('searchPatternField');
    patternField.oninput = onPatternChange;
    patternField.onpropertychange = patternField.oninput;

    resultsTime = document.getElementById('resultsTime');
    resultsList = document.getElementById('resultsList');
};

function displayResults0(results) {
    // console.log(results)
    var newResultsList = resultsList.cloneNode(false);

    // Because adding too many elements is catastrophically slow because HTML is slow
    var max_entries = 500;

    // Create HTML elements for results
    for (index = 0; index < results.length && index < max_entries; ++index) {

        let it = results[index];



        const li = document.createElement('li');
        const link = it.tag.cloneNode(true);
        link.style.display = "block";
        link.classList = [];

        li.appendChild(link);

        newResultsList.appendChild(li);
    }

    // Replace the old results from the DOM.
    resultsList.parentNode.replaceChild(newResultsList, resultsList);
    resultsList = newResultsList;
};

function getSummary (details) {
    for (node of details.childNodes) {
        if (node.tagName === "SUMMARY") return node;
    }
}

function displayResults1(results) {

    for (it of linkset) {
        it.tag.style.display = "none";
        // it.tag.parentNode.style.display = "none";
        it.tag.classList = [];

    }

    for (it of results) {
        let tag = it.tag;
        tag.classList.add("here")

        while (tag.id !== "top") {
            tag.style.display = "";
            if (tag.tagName === "DETAILS") getSummary(tag).childNodes[0].style.display = "";
            tag = tag.parentNode;
        }
    }
}


function displayResults(results) {

    displayResults0(results);
    displayResults1(results);

};

/**
 * Strictly optional utility to help make using fts_fuzzy_match easier for large data sets
 * Uses setTimeout to process matches before a maximum amount of time before sleeping
 *
 * To use:
 *  const asyncMatcher = new ftsFuzzyMatchAsync(fuzzyMatch, "fts", "ForrestTheWoods",
 *                                              function(results) { console.log(results); });
 *  asyncMatcher.start();
 *
 * @param {*} matchFn   function      Matching function - fuzzyMatchSimple or fuzzyMatch.
 * @param {*} pattern   string        Pattern to search for.
 * @param {*} dataSet   array         Array of string in which pattern is searched.
 * @param {*} onComplete function     Callback function which is called after search is complete.
 */
function ftsFuzzyMatchAsync(matchFn, pattern, dataSet, onComplete) {
    const ITEMS_PER_CHECK = 1000; // performance.now can be very slow depending on platform
    const results = [];
    const max_ms_per_frame = 1000.0 / 30.0; // 30FPS
    let dataIndex = 0;
    let resumeTimeout = null;

    // Perform matches for at most max_ms
    function step() {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;

        var stopTime = performance.now() + max_ms_per_frame;

        for (; dataIndex < dataSet.length; ++dataIndex) {
            if (dataIndex % ITEMS_PER_CHECK == 0) {
                if (performance.now() > stopTime) {
                    resumeTimeout = setTimeout(step, 1);
                    return;
                }
            }

            let val = dataSet[dataIndex];
            let str = val.name;
            var result = matchFn(pattern, str);

            // A little gross because fuzzy_match_simple and fuzzy_match return different things
            if (matchFn == fuzzyMatchSimple && result == true) results.push(val);
            else if (matchFn == fuzzyMatch && result[0] == true) {
                result.push(val);
                results.push(result);
            }
        }

        onComplete(results);
        return null;
    }

    // Abort current process
    this.cancel = function () {
        if (resumeTimeout !== null) clearTimeout(resumeTimeout);
    };

    // Must be called to start matching.
    // I tried to make asyncMatcher auto-start via "var resumeTimeout = step();"
    // However setTimout behaving in an unexpected fashion as onComplete insisted on triggering twice.
    this.start = function () {
        step();
    };

    // Process full list. Blocks script execution until complete
    this.flush = function () {
        max_ms_per_frame = Infinity;
        step();
    };
}

/**
 * Trigger a new filter.
 */
function onPatternChange() {

    // Clear existing async match if it exists
    if (asyncMatcher !== null) {
        asyncMatcher.cancel();
        asyncMatcher = null;
    }

    var pattern = patternField.value;

    // Data not yet loaded
    if (currentDataSet == null)
        return;

    if (resultsList !== null) {
        // Clear the list
        var emptyList = resultsList.cloneNode(false);
        resultsList.parentNode.replaceChild(emptyList, resultsList);
        resultsList = emptyList;
    }

    // Early out on empty pattern (such as startup) because JS is slow
    if (pattern.length == 0)
        return;

    var startTime = performance.now();

    asyncMatcher = new ftsFuzzyMatchAsync(matchFn, pattern, currentDataSet, function (results) {
        // Scored function requires sorting

        // console.log(results)
        if (matchFn == fuzzyMatch) {
            results = results
                .sort(function (a, b) { return b[1] - a[1]; })
                // .map(function (v) { return v[1] + " - " + v[2].name; });
                .map(function (v) { return v[2]; });
        }

        var endTime = performance.now();

        // Display number of matches and how long it took
        resultsTime.innerText = results.length + " matches in " + (endTime - startTime).toFixed(1) + " milliseconds";

        displayResults(results);

        asyncMatcher = null;
    });
    asyncMatcher.start();
};

onFormatChange = function (radio) {
    matchFn = radio.value == "PrintByScore" ? fuzzy_match : fuzzy_match_simple;
    onPatternChange();
}



