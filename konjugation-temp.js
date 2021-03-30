Object.defineProperty(Array.prototype, 'random', {
    get: function() {
        return this[Math.floor(Math.random() * this.length)];
    }
});
function weighted_random(items, weights) {
    var i;

    for (i = 0; i < weights.length; i++)
        weights[i] += weights[i - 1] || 0;
    
    var random = Math.random() * weights[weights.length - 1];
    
    for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
            break;
    
    return items[i];
}

var {selectedVerbs, savedInputs, askedVerbs, tenseProb, newVerbs} = localStorage;
selectedVerbs = JSON.parse(selectedVerbs);
savedInputs = JSON.parse(savedInputs);
newVerbs = (newVerbs == null || newVerbs == "") ? selectedVerbs : JSON.parse(newVerbs);
askedVerbs = (askedVerbs == null || askedVerbs == "") ? {} : JSON.parse(askedVerbs);
tenseProb = (tenseProb == null || tenseProb == "") ? { standard : 1 } : JSON.parse(tenseProb);
for (let tense of Object.keys(savedInputs)) {
    if (tense[0] === tense[0].toUpperCase()) {
        tenseProb[tense] = 1;
        //divide by 3 and double
        //multiply by 3 and half
    }
}

function nextForm() {
    var newVerbsEmpty = Object.keys(newVerbs).length == 0;
    var askedVerbsEmpty = Object.keys(askedVerbs).length == 0;

    if (newVerbsEmpty && askedVerbsEmpty) {return alert("fertig")}
    else if (newVerbsEmpty) {var nextVerbName = Object.keys(askedVerbs).random}
    else if (askedVerbsEmpty) {var nextVerbName = Object.keys(newVerbs).random}
    else {
        var isNewVerb = [true, false].random
        var nextVerbName = isNewVerb ? Object.keys(newVerbs).random : Object.keys(askedVerbs).random;
    }
    var isNewVerb = isNewVerb || askedVerbsEmpty;

    var nextVerb = askedVerbs[nextVerbName] || newVerbs[nextVerbName];
    var oldTenseProb = tenseProb;
    var verbTenseProb = {}
    for (tense of Object.keys(nextVerb)) {
        verbTenseProb[tense] = oldTenseProb[tense] || oldTenseProb.standard;
    }
    var verbTense = weighted_random(Object.keys(verbTenseProb), Object.values(verbTenseProb));

    //verbTenses =
    return {
        forms : nextVerb[verbTense],
        verbName : nextVerbName,
        isNewVerb : isNewVerb,
        tense : verbTense
    };
}

function createInputs(parts, verbName, tense) {
    document.getElementById("verbDisplay").innerHTML = verbName;
    document.getElementById("tenseDisplay").innerHTML = tense;

    var inputs = document.getElementsByTagName("input");
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].classList.remove("right");
        inputs[i].classList.remove("wrong");
    }

    var str = "<table>";
    for (let i = 0; i < parts.length; i++) {
        str += `
            <tr>
                <td><label for="input_${i}" id="label_${i}">${parts[i][0]}</label></td>
                <td><input type="text" id="input_${i}" class="verbInput" autocorrect="off" autocapitalize="none" spellcheck="false"></td>
            </tr>
        `;
    }
    str += "</table>"
    var para = document.getElementById("inputs");
    para.innerHTML = str;

    var btn = document.getElementById("btn")
    btn.onclick = correctAnswers;
    btn.innerHTML = "corriger";
}

function splitForms(forms) {
    return forms.map(form => {
        form = form
            .replace("'", "' ")
            .replace("qu' ", "qu'")
            .replace("que ", "que&nbsp;")
            .split(" ");
        return [form.shift(), form.join(" ")];
    });
}

function newQuestion() {
    var nextVerb = nextForm();
    var verbParts = splitForms(nextVerb.forms);
    createInputs(verbParts, nextVerb.verbName, nextVerb.tense);
    if (nextVerb.isNewVerb) {
        askedVerbs[nextVerb.verbName] = newVerbs[nextVerb.verbName];
        delete newVerbs[nextVerb.verbName];
    }
    document.getElementById('input_0').focus();

    window.currentVerb = nextVerb;
    window.verbParts = verbParts;
}

function correctAnswers() {
    var inputs = document.getElementsByTagName("input");
    var allTrue = true;
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].value.replace(/\s+/g, ' ').trim() === verbParts[i][1]) {
            inputs[i].classList.add("right");
        }
        else {
            allTrue = false;
            inputs[i].classList.add("wrong");
            inputs[i].value = verbParts[i][1];
        }
    }

    verbTense = currentVerb.tense.replace(/ /g, "_");
    if (allTrue) {
        for (let tense of Object.keys(tenseProb)) {
            tenseProb[tense] *= 3;
        }
        tenseProb[verbTense] /= 2;

        if (Object.keys(askedVerbs[currentVerb.verbName]).length == 1) {
            delete askedVerbs[currentVerb.verbName];
        } else {
            delete askedVerbs[currentVerb.verbName][currentVerb.tense];
        }
    }
    else {
        for (let tense of Object.keys(tenseProb)) {
            tenseProb[tense] /= 3;
        }
        tenseProb[verbTense] *= 2;
    }

    save();
    var btn = document.getElementById("btn")
    btn.onclick = newQuestion;
    btn.innerHTML = "continuer";
}

function save() {
    localStorage.askedVerbs = JSON.stringify(askedVerbs);
    localStorage.newVerbs = JSON.stringify(newVerbs);
    localStorage.tenseProb = JSON.stringify(tenseProb);
}

window.addEventListener('keyup', function(event) {
  if (event.keyCode === 13) {
    document.getElementById("btn").click();
  }
});

document.getElementById("btn").onclick = newQuestion;