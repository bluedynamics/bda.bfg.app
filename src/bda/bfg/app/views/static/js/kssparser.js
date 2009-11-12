/*
* Copyright (c) 2005-2008
* Authors: KSS Project Contributors (see doc/CREDITS.txt)
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License version 2 as published
* by the Free Software Foundation.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, write to the Free Software
* Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA
* 02111-1307, USA.
*/

/* Tokens of the KSS parser */

kukit.kssp = new function() {   /// MODULE START

var kssp = this;

/* Tokens */

kssp.openComment = kukit.tk.mkToken('openComment', "\/\*");
kssp.closeComment = kukit.tk.mkToken('closeComment', "\*\/");
kssp.openBrace = kukit.tk.mkToken('openBrace', "{");
kssp.closeBrace = kukit.tk.mkToken('closeBrace', "}");
kssp.openBracket = kukit.tk.mkToken('openBracket', "[");
kssp.closeBracket = kukit.tk.mkToken('closeBracket', "]");
kssp.openParent = kukit.tk.mkToken('openParent', "(");
kssp.closeParent = kukit.tk.mkToken('closeParent', ")");
kssp.semicolon = kukit.tk.mkToken('semicolon', ";");
kssp.colon = kukit.tk.mkToken('colon', ":");
kssp.quote = kukit.tk.mkToken('quote', "'");
kssp.dquote = kukit.tk.mkToken('dquote', '"');
kssp.backslash = kukit.tk.mkToken('backslash', '\x5c'); 
kssp.comma = kukit.tk.mkToken('comma', ",");
kssp.equals = kukit.tk.mkToken('equals', "=");

/* Parsers */

/* Helpers */

var _emitAndReturn = function() {
    return this.emitAndReturn();
};

var _mkEmitAndReturnToken = function(klass) {
    return function() {
        var token = new klass(this.cursor);
        return this.emitAndReturn(token);
    };
};

var _mkReturnToken = function(klass) {
    return function() {
        return new klass(this.cursor);
    };
};

var _returnComment = function() {
    return new kssp.Comment(this.cursor, kssp.openComment);
};

var _returnString = function() {
    return new kssp.String(this.cursor, kssp.quote);
};

var _returnString2 = function() {
    return new kssp.String2(this.cursor, kssp.dquote);
};

var _returnMethodArgs = function() {
    return new kssp.MethodArgs(this.cursor, kssp.openParent);
};

var _returnBackslashed = function() {
    return new kssp.Backslashed(this.cursor, kssp.backslash);
};

/*
* class Document 
*/
var _Document = function() {

this.process = function() {
    this.eventRules = [];
    // Parse all tokens (including first and last)
    var context = {'nextTokenIndex': 0};
    while (context.nextTokenIndex < this.result.length) {
        this.digestTxt(context, kukit.tk.Fraction, kssp.Comment);
        var key = context.txt;
        if (! key) {
            break;
        }
        this.expectToken(context, kssp.Block);
        var block = context.token;
        var rules = block.parseSelectors(key);
        this.addRules(rules);
    }
    this.result = [];
    this.txt = '';
};

this.addRules = function(rules) {
    // Create the event rules.
    for(var i=0; i<rules.length; i++) {
        this.eventRules.push(rules[i]);
    };
};

};
kssp.Document = kukit.tk.mkParser('document', {
    "\/\*": _returnComment,
    "{": function() {
             return new kssp.Block(this.cursor, kssp.openBrace)
             }
    },
    _Document
    );

/*
* class Comment 
*/
var _Comment = function() {

this.process = function() {
    this.result = [];
    this.txt = ' ';
};

};
kssp.Comment = kukit.tk.mkParser('comment', {
    // it's not 100% good, but will do
    "\*\/": _mkEmitAndReturnToken(kssp.closeComment)
    },
    _Comment
    );

/*
* class Block 
*/
var _Block = function() {

this.process = function() {
    //this.parms = {};
    this.eventFullNames = {};
    this.actions = new kukit.rd.ActionSet();
    // Parse all tokens (except first and last)
    var context = {'nextTokenIndex': 1};
    while (context.nextTokenIndex < this.result.length-1) {
        this.digestTxt(context, kukit.tk.Fraction, kssp.Comment);
        var key = context.txt;
        if (! key) {
            break;
        }
        this.expectToken(context, kssp.colon);
        this.expectToken(context, kssp.MultiPropValue);
        // store the wrapped prop
        this.addDeclaration(key, context.token.values);
        if (context.nextTokenIndex == this.result.length-1) break;
        this.expectToken(context, kssp.semicolon);
    }
    this.result = [];
    this.txt = '';
};

this.parseSelectors = function(key) {
    // Parse the part in an embedded parser
    var cursor = new kukit.tk.Cursor(key + ' ');
    var parser = new kssp.KssSelectors(cursor, null, true);
    var results = [];
    var hasFullNames = false;
    for(var eventFullName in this.eventFullNames) {
        var hasFullNames = true;
        var found = false;
        for(var i=0; i< parser.selectors.length; ++i) {
            var fullName = '';
            var kssSelector = parser.selectors[i];
            if (kssSelector.namespace) {
                fullName = kssSelector.namespace + '-';
            }
            fullName += kssSelector.name;
            if (fullName == eventFullName) {
                var eventParameters = this.eventFullNames[fullName];
                var eventRule;
                if (typeof(eventParameters)!='undefined') {
                    eventRule = new kukit.rd.EventRule(kssSelector,
                                                eventParameters, this.actions);
                }
                else{
                    eventRule = new kukit.rd.EventRule(kssSelector,
                                                {}, this.actions);
                }
                results.push(eventRule);
                found = true;
            }
        }
        if (! found){
;;;         kukit.E = 'Wrong value for evt-[<NAMESPACE>-]<EVENTNAME> [' + eventFullName + '] : ';
;;;         kukit.E += '<NAMESPACE>-<EVENTNAME> should exist in the event of the selectors.';
            this.emitError(kukit.E);
        }
    }
    if (! hasFullNames){
        for(var i=0; i< parser.selectors.length; ++i) {
            var kssSelector = parser.selectors[i];
            eventRule = new kukit.rd.EventRule(kssSelector,
                                               {}, this.actions);
            results.push(eventRule);
        }
    }
    return results;
};

this.addEventDeclaration = function(key, splitkey, values) {
    // evt-<EVTNAME>-<PARAMETER>: <VALUE>
    // evt-<NAMESPACE>-<EVTNAME>-<PARAMETER>: <VALUE>
;;; if (splitkey.length < 3) {
;;;     kukit.E = 'Wrong rule key : "' + key + '". ';
;;;     kukit.E += 'KSS rule key must be "<ACTIONNAME>-<PARAMETER>"';
;;;     kukit.E += ' or "<NAMESPACE>-<ACTIONNAME>-<PARAMETER>" or ';
;;;     kukit.E += '"evt-<EVENTNAME>-<PARAMETER>" or ';
;;;     kukit.E += '"evt-<NAMESPACE>-<EVENTNAME>-<PARAMETER>".';
;;;     this.emitError(kukit.E);
;;; }
    var eventNamespace;
    var eventName;
    var eventKey;
    var eventFullName;
    if (splitkey.length == 3) {
        // evt-<EVENTNAME>-<PARAMETER>: <VALUE>
        eventName =  splitkey[1];
        eventKey = splitkey[2];
        eventFullName = eventName;
    } else {
        // evt-<NAMESPACE>-<EVENTNAME>-<PARAMETER>: <VALUE>
        eventNamespace = splitkey[1];
        eventName = splitkey[2];
        eventKey = splitkey[3];
        eventFullName = eventNamespace + '-' + eventName;
    }
    // preprocess values
    var allowedReturnTypes;
;;; allowedReturnTypes = {string: true};
;;; kukit.E = 'event parameter [' + key + ']';
    var value = this.preprocessValues(values, allowedReturnTypes, kukit.E).string;
;;; if (value.isMethod != false) {
;;;     kukit.E = 'Wrong value for key [' + key + '] : ';
;;;     kukit.E += 'value providers are not ';
;;;     kukit.E += 'allowed as value for ';
;;;     kukit.E += 'evt-[<NAMESPACE>-]<EVENTNAME>-<PARAMETER> keys.';
;;;     this.emitError(kukit.E);
;;; }
    var eventParameters = this.eventFullNames[eventFullName];
    if (typeof(eventParameters) == 'undefined') {
        this.eventFullNames[eventFullName] = {};
        eventParameters = this.eventFullNames[eventFullName];
    }
    eventParameters[eventKey] = value.txt;
};

this.addActionDeclaration = function(key, splitkey, values) {
    // action-server: <ACTIONNAME>
    // action-client: <ACTIONNAME>
    // action-client: <NAMESPACE>-<ACTIONNAME>
    // action-cancel: <ACTIONNAME>
    // action-cancel: <NAMESPACE>-<ACTIONNAME>
;;; if (splitkey.length != 2) {
;;;     kukit.E = 'Wrong key [' + key + '] : ';
;;;     kukit.E += 'action-<QUALIFIER> keys can have only one dash.';
;;;     this.emitError(kukit.E);
;;;     }
    var atab = {'server': 'S', 'client': 'C', 'cancel': 'X'};
    var actionType = atab[splitkey[1]];
;;; if (! actionType) {
;;;     kukit.E = 'Wrong key [' + key + '] : ';
;;;     kukit.E += 'qualifier in action-<QUALIFIER> keys must be ';
;;;     kukit.E += '"server" or "client" or "cancel".'; 
;;;     this.emitError(kukit.E);
;;;     }    
    // preprocess values
    var allowedReturnTypes;
;;; if (actionType == 'S') {
;;;     // action-server
;;;     allowedReturnTypes = {string: true, formquery: true, url: true};
;;; } else if (actionType == 'C') {
;;;     // action-client
;;;     allowedReturnTypes = {string: true, selection: true, alias: true};
;;; } else {
;;;     // action-cancel
;;;     allowedReturnTypes = {string: true};
;;; }
;;; kukit.E = 'action definition [' + key + ']';
    var valuesByReturnType = this.preprocessValues(values, allowedReturnTypes, kukit.E);
    var value = valuesByReturnType.string;
    //
;;; if (value.isMethod != false) {
;;;     kukit.E = 'Wrong value for key [' + key + '] : ';
;;;     kukit.E += 'value providers are not ';
;;;     kukit.E += 'allowed for action-<QUALIFIER> keys.';
;;;     this.emitError(kukit.E);
;;;     }
;;; // force value to be <ACTIONNAME> or <NAMESPACE>-<ACTIONNAME>
;;; var splitvalue = value.txt.split('-');
;;; if (splitvalue.length > 2) {
;;;     kukit.E = 'Wrong value for key [' + key + '] : ';
;;;     kukit.E += 'value must be <ACTIONNAME> or <NAMESPACE>';
;;;     kukit.E += '-<ACTIONNAME> for action-<QUALIFIER> keys.';
;;;     this.emitError(kukit.E);
;;; }
    // set it
    var action = this.actions.getOrCreateAction(value.txt, valuesByReturnType);
    if (actionType == 'X' &&  action.type != null) {
        // action-cancel, and the action existed already in the same block:
        // we delete it straight ahead
        this.actions.deleteAction(value.txt);
    } else {
        // any other qualifier then delete,
        // or action-cancel but there has been no action defined yet in the block:
        // set the action type.
        // (Remark: in case of action-cancel we set action's type to X, and
        // the cancellation will possibly happen later, during the merging.)
        action.setType(actionType);
    }
};

this.addActionError = function(action, key, values) {
    // <ACTIONNAME>-error: <VALUE>
    // default-error: <VALUE>
    //
    // This can only accept string. 
    var allowedReturnTypes;
;;; allowedReturnTypes = {string: true};
;;; kukit.E = 'action error parameter [' + key + ']';
    var value = this.preprocessValues(values, allowedReturnTypes, kukit.E).string;
;;; // It cannot be a provider, it must be a real string.
;;; if (value.isMethod == true) {
;;;     kukit.E = 'Wrong value for key [' + key + '] : ';
;;;     kukit.E += 'value providers are not ';
;;;     kukit.E += 'allowed for <ACTIONNAME>-error keys.';
;;;     this.emitError(kukit.E);
;;; }
    action.setError(value.txt);
    // also create the action for the error itself.
    var err_action = this.actions.getOrCreateAction(value.txt, {});
    err_action.setType('E');
};

this.addActionParameter = function(action, key, values) {
    // <ACTIONNAME>-<KEY>: <VALUE>
    // default-<KEY>: <VALUE>
    // 
    // value may be either txt or method parms, 
    // and they get stored with the wrapper.
    // 
    // Check the syntax of the value at this point.
    // This will also set the value providers on the value
    // (from check).
    //
    var value;
    if (key.substr(0, 3) == 'kss') {
;;;     // Special selector types can have only one value
;;;     if (values.length != 1) {
;;;         kukit.E = 'Must have exactly one value, and got [' + values.length;
;;;         kukit.E += '] in the kss action parameter [' + key + '].';
;;;         this.emitError(kukit.E);
;;;     }
        value = values[0];
;;;     // kss special parameter need special checking of the strings.
;;;     // (not needed in production mode, since we have the value already)
;;;     var allowedReturnTypes = {};
;;;     if (key == 'kssSelector') {
;;;         // for kssSelector, one of string or formquery expected
;;;         allowedReturnTypes = {string: true, selection: true};
;;;     } else if (key == 'kssSubmitForm') {
;;;         // for kssSubmitForm string or formquery expected
;;;         allowedReturnTypes = {string: true, formquery: true};
;;;     } else if (key == 'kssUrl') {
;;;         // for kssUrl string or url expected
;;;         allowedReturnTypes = {string: true, url: true};
;;;     }
;;;     // We ignore actual results here, and just check. 
;;;     kukit.E = 'kss action parameter [' + key + ']';
        // Call preprocessValues in both production and development mode:
        // it is always needed, since it calls check() on the value.
        // Last parameter is true: means we do _not_ require the existence
        // of a string type.
        this.preprocessValues(values, allowedReturnTypes, kukit.E, true);
    } else {
        // Normal selectors: can have more values
        // check its return types
        var allowedReturnTypes;
;;;     allowedReturnTypes = {string: true};
;;;     kukit.E = 'action parameter [' + key + ']';
        var valuesByReturnType = this.preprocessValues(values, allowedReturnTypes, kukit.E);
        value = valuesByReturnType.string;
    }
    // store the (main, string) value
    action.parms[key] = value;
};

this.addDeclaration = function(key, values) {
    // values contains a list of arguments (KssTextValue or KssMethodValue)
    //
    // the key looks like this:
    //
    // evt-<EVTNAME>-<KEY>: <VALUE>
    // evt-<NAMESPACE>-<EVTNAME>-<KEY>: <VALUE>
    //
    // action-server: <ACTIONNAME>
    // action-client: <ACTIONNAME>
    // action-client: <NAMESPACE>-<ACTIONNAME>
    // action-cancel: <ACTIONNAME>
    // action-cancel: <NAMESPACE>-<ACTIONNAME>
    //
    // <ACTIONNAME>-<KEY>: <VALUE>
    // <NAMESPACE>-<ACTIONNAME>-<KEY>: <VALUE>
    // <ACTIONNAME>-error: <VALUE>
    // <NAMESPACE>-<ACTIONNAME>-error: <VALUE>
    //
    // default-<KEY>: <VALUE>
    // default-error: <VALUE>
    //
    var splitkey = key.split('-');
;;; if (splitkey.length < 2 || splitkey.length > 4) {
;;;     kukit.E = 'Wrong rule key : "' + key + '". ';
;;;     kukit.E += 'KSS rule key must be "<ACTIONNAME>-<PARAMETER>" or ';
;;;     kukit.E += '"<NAMESPACE>-<ACTIONNAME>-<PARAMETER>" or ';
;;;     kukit.E += '"evt-<EVENTNAME>-<PARAMETER>" or ';
;;;     kukit.E += '"evt-<NAMESPACE>-<EVENTNAME>-<PARAMETER>".';
;;;     this.emitError(kukit.E);
;;; }
    // Preprocess the values
    //
    var name = splitkey[0];
    if (name == 'evt') {
        this.addEventDeclaration(key, splitkey, values);
    } else if (name == 'action') {
        this.addActionDeclaration(key, splitkey, values);
    } else {
        // <ACTIONNAME>-<KEY>: <VALUE>
        // <NAMESPACE>-<ACTIONNAME>-<KEY>: <VALUE>
        // <ACTIONNAME>-error: <VALUE>
        // <NAMESPACE>-<ACTIONNAME>-error: <VALUE>
        // default-<KEY>: <VALUE>
        // default-error: <VALUE>
        var actionName;
        var actionKey;
        if (splitkey.length == 2) {
            // <ACTIONNAME>-<KEY>: <VALUE>
            // <ACTIONNAME>-error: <VALUE>
            // default-<KEY>: <VALUE>
            // default-error: <VALUE>
            actionName =  splitkey[0];
            actionKey = splitkey[1];
        } else {
            // <NAMESPACE>-<ACTIONNAME>-<KEY>: <VALUE>
            // <NAMESPACE>-<ACTIONNAME>-error: <VALUE>
            actionName = splitkey[0] + '-' + splitkey[1];
            actionKey = splitkey[2];
        }
        var action = this.actions.getOrCreateAction(actionName, {});
        if (actionKey == 'error') {
            this.addActionError(action, key, values);
        } else {
            this.addActionParameter(action, actionKey, values);
        }
    }
};

this.preprocessValues = function(values, allowedReturnTypes, 
        errInfo, noStringRequired) {
    // allowedReturnTypes is a dict keyed by the returnType, containing true as value.
    // key is only used for the error reporting
    // This will also call check on all the value names!
    // noStringRequired is set to true at the kss special parameters. All other
    // occasions require at least a string to be present, so we check for that too.
    var valuesByReturnType = {};

    for (var i=0; i<values.length; i++) {
        var value = values[i];
        // Checking the value
        // this is needed for later evaluation.
        try {
            // Check also sets the value provider on the value.
            value.check();
        } catch(e) {
;;;         kukit.E = 'Error in value for ' + errInfo + ' : ' + e + '.';
            this.emitError(kukit.E);
        }
        // XXX text values are not wrapped. So we need to check for the
        // pprovider....
        var returnType = (typeof(value.pprovider) != 'undefined') && value.pprovider.returnType;
        //for(var xx in value) {print (xx, value[xx]);}
        // Default return type is "string".
        if (! returnType) {
            returnType = 'string';
        }
;;;     // Check if return type is allowed.
;;;     if (! allowedReturnTypes[returnType]){
;;;         kukit.E = 'Provider result type [' + returnType;
;;;         kukit.E += '] not allowed in the ' + errInfo +  '.';
;;;         this.emitError(kukit.E);
;;;     }
;;;     // Check duplicate type. Only one provider is allowed
;;;     // from each return type, ie. maximum one string,
;;;     // one selector, etc.
;;;     if (typeof(valuesByReturnType[returnType]) != 'undefined') {
;;;         if (returnType == 'string') {
;;;             // Give a more sensible message for strings.
;;;             // (Do not mention the word "provider" in the message
;;;             // as action-xxx cannot take providers, only real strings.
;;;             kukit.E = 'Only one [string] value ';
;;;             kukit.E += 'is allowed in the ' + errInfo +  '.';
;;;         } else {
;;;             kukit.E = 'Only one provider with result type [' + returnType;
;;;             kukit.E += '] is allowed in the ' + errInfo +  '.';
;;;         }
;;;         this.emitError(kukit.E);
;;;     }
        // store it
        valuesByReturnType[returnType] = value;
    }
;;; // Check we have at least a string type. (unless asked otherwise)
;;; if (! noStringRequired && typeof(valuesByReturnType.string) == 'undefined') {
;;;     // (Do not mention the word "provider" in the message
;;;     // as action-xxx cannot take providers, only real strings.
;;;     kukit.E = 'Missing [string] value ';
;;;     kukit.E += 'in the ' + errInfo +  '.';
;;;     this.emitError(kukit.E);
;;; }
    return valuesByReturnType;
};

};
kssp.Block = kukit.tk.mkParser('block', {
    ";": _mkReturnToken(kssp.semicolon),
    ":": function() {
             return [new kssp.colon(this.cursor), 
                 new kssp.MultiPropValue(this.cursor)]
             },
    "}": _mkEmitAndReturnToken(kssp.closeBrace)
    },
    _Block
    );

/*
* class PropValue
*/
var _PropValue = function() {

this.process = function() {
    // For multivalue only
    this.values = [];
    // Parse all tokens (including first and last)
    var context = {'nextTokenIndex': 0};
    this.txt = '';
    // Iterate for multiple values (in case allowed.)
    // txtCarry holds the part of text that we need to consider
    // as a possible method name, in case method args follow.
    var txtCarry = '';
    while (context.nextTokenIndex < this.result.length) { 
        if (this.notInTokens(context, kukit.kssp.String)) {
            // A string token follows:
            if (txtCarry) {
                // If we have a txt carry left, it needs to be 
                // produced first, separately.
                this.produceTxt(txtCarry);
                txtCarry = '';
            }
            // the next one must be a string.
            this.expectToken(context, kukit.kssp.String);
            this.produceTxt(context.token.txt);
        } else if (this.notInTokens(context, kukit.kssp.MethodArgs)) {
            // A MethodArgs token follows:
            // see if not empty
            if (! txtCarry) {
;;;             // Be a little more intelligent with this error.
;;;             // If we are single value, and there is a value,
;;;             // the following raises a smarter error message, complaining
;;;             // about the () as excess.
;;;             this.addValue(null, '(');
;;;             // otherwise, just do the next error message:
;;;             kukit.E = 'Wrong value : empty method name.';
                this.emitError(kukit.E);
            }
            // the next one must be the (a1, a2, ...an) method args.
            this.expectToken(context, kukit.kssp.MethodArgs);
            // The txtCarry will be used as the name of the method.
            this.addValue(new kukit.rd.KssMethodValue(txtCarry, context.token.args),
                         txtCarry);
            txtCarry = '';
        } else {
            // Try to digest another fraction.
            this.digestTxt(context, kukit.tk.Fraction, kukit.kssp.Comment);
            //
            // Split the fraction to words. We may have a word
            // and we may have a MethodArg after:
            //   wordone ... wordlast(...) ...
            //   ^^^^^^^^^^^^^^^^^^^^           - these are in the Fraction
            //                       ^^^^^      - these are the MethodArgs 
            // So we produce all strings except the last one, and
            // continue the cycle with the last one (worlast) as txt.
            // This enables it to be produced with the MethodArgs.
            //
            var words = context.txt.split(' ');
            // Emit the original txtCarry - if there is one.
            if (txtCarry) {
                this.produceTxt(txtCarry);
                txtCarry = '';
            }
            // If we have input, process it.
            if (words.length > 0) {
                // Produce all strings except the last one
                for (var i=0; i<words.length - 1; i++) {
                    this.produceTxt(words[i]);
                }
                // Carry the last one to the next iteration.
                txtCarry = words[words.length - 1];
            }
        }
    }
    if (txtCarry) {
        // If we have a txt carry, it needs to be produced finally.
        this.produceTxt(txtCarry);
    }
    this.result = [];
};

this.initialize = function() {
    this.multiword_allowed = false;
    this.valueClass = kukit.rd.KssMethodValue;
};

this.produceTxt = function(txt) {
    this.addValue(new kukit.rd.KssTextValue(txt), txt);
};

this.addValue = function(value, errInfo) {
    // Do not allow a second value
    if (this.value) {
;;;     kukit.E = 'Wrong value : unallowed characters [';
;;;     kukit.E += errInfo + '] after ';
;;;     kukit.E += 'the argument.';
        this.emitError(kukit.E);
    }
    this.value = value;
};

this.initialize.apply(this, arguments);
};
kssp.PropValue = kukit.tk.mkParser('propValue', {
    ";": _emitAndReturn,
    "}": _emitAndReturn,
    ")": _emitAndReturn,
    "]": _emitAndReturn,
    ",": _emitAndReturn,
    "'": _returnString,
    '"': _returnString2,
    "\/\*": _returnComment,
    "(": _returnMethodArgs
    },
    _PropValue
    );

/*
* class MultiPropValue
* 
* A list of PropValue-s (arguments), separated by whitespace
*/
var _MultiPropValue = function() {

    this.addValue = function(value, errInfo) {
        this.values.push(value);
    };

    this.initialize = function() {
        this.multiword_allowed = true;
    };

};
_MultiPropValue.prototype = new _PropValue();
kssp.MultiPropValue = kukit.tk.mkParser('multiPropValue', {
    ";": _emitAndReturn,
    "}": _emitAndReturn,
    ")": _emitAndReturn,
    ",": _emitAndReturn,
    "'": _returnString,
    '"': _returnString2,
    "\/\*": _returnComment,
    "(": _returnMethodArgs
    },
    _MultiPropValue
    );


/*
* class EventValue
*
*/
var _EventValue = function() {

this.initialize = function() {
    this.multiword_allowed = false;
};

this.process = function() {
    // Parse all tokens (including first and last)
    var context = {'nextTokenIndex': 0};
    this.digestTxt(context, kukit.tk.Fraction, kssp.Comment);
    this.txt = '';
    var txt = context.txt;
    if (this.notInTokens(context, kssp.String)) {
        // The previous txt must be all whitespace.
        if (txt) {
;;;         kukit.E = 'Wrong value : unallowed characters [' + txt + ']';
;;;         kukit.E += ' before a string.';
            this.emitError(kukit.E);
        }
        // the next one must be a string.
        this.expectToken(context, kssp.String);
        this.produceTxt(context.token.txt);
    } else if (this.notInTokens(context, kssp.openParent)) {
        this.expectToken(context, kssp.openParent);
        this.expectToken(context, kssp.PropValue);
        this.value = new kukit.rd.KssEventValue(txt, context.token.value);
        this.digestTxt(context, kukit.tk.Fraction, kssp.Comment);
        // we have to be at the end and have no text after
        if (context.txt) {
;;;         kukit.E = 'Wrong event selector : [' + context.txt; 
;;;         kukit.E += '] is not expected before the closing';
;;;         kukit.E += ' parenthesis. :<EVENTNAME>(<ID>) can have';
;;;         kukit.E += ' only one parameter.';
            this.emitError(kukit.E);
        }
        // eat up everything before the closing parent
        this.expectToken(context, kssp.closeParent);
    } else {
        // not a string or method: check if we allowed multiword.
        if (! this.multiword_allowed && txt.indexOf(' ') != -1) {
;;;         kukit.E = 'Wrong value : [' + txt + '] cannot have spaces.';
            this.emitError(kukit.E);
        }
        this.produceTxt(txt);
    }
    // see what's after
    if (context.nextTokenIndex < this.result.length) {
        this.digestTxt(context, kukit.tk.Fraction, kssp.Comment);
        // we have to be at the end and have no text after
        if (context.nextTokenIndex < this.result.length || context.txt) {
;;;         kukit.E = 'Excess characters after the property value';
            this.emitError(kukit.E);
        }
    }
    this.result = [];
};

this.produceTxt = function(txt) {
    // txt parms are returned embedded
    this.value = new kukit.rd.KssEventValue(txt, null);
};
this.initialize.apply(this, arguments);
};
kssp.EventValue = kukit.tk.mkParser('propValue', {
    "{": _emitAndReturn,
    " ": _emitAndReturn,
    "\t": _emitAndReturn,
    "\n": _emitAndReturn,
    "\r": _emitAndReturn,
    "\/\*": _emitAndReturn,
    ":": _emitAndReturn,
    "(": function() {
             return [new kssp.openParent(this.cursor),
                 new kssp.PropValue(this.cursor)]
             },
    ")": _mkEmitAndReturnToken(kssp.closeParent)
    },
    _EventValue
    );

/*
* class String
*/
var _String = function() {

this.process = function() {
    // collect up the value of the string, omitting the quotes
    this.txt = '';
    for (var i=1; i<this.result.length-1; i++) {
        this.txt += this.result[i].txt;
    }
};

};
kssp.String = kukit.tk.mkParser('string', {
    "'": _mkEmitAndReturnToken(kssp.quote),
    '\x5c': _returnBackslashed
    },
    _String
    );

/*
* class String2
*/
kssp.String2 = kukit.tk.mkParser('string', {
    '"': _mkEmitAndReturnToken(kssp.dquote),
    '\x5c': _returnBackslashed
    },
    _String
    );

/*
* class StringInSelector
*/
var _StringInSelector = function() {

this.process = function() {
    // collect up the value of the string, including the quotes
    this.txt = '';
    for (var i=0; i<this.result.length; i++) {
        this.txt += this.result[i].txt;
    }
};

};
kssp.StringInSelector = kukit.tk.mkParser('string', {
    "'": _mkEmitAndReturnToken(kssp.quote),
    '\x5c': _returnBackslashed
    },
    _StringInSelector
    );

/*
* class String2InSelector
*/
kssp.String2InSelector = kukit.tk.mkParser('string', {
    '"': _mkEmitAndReturnToken(kssp.dquote),
    '\x5c': _returnBackslashed
    },
    _StringInSelector
    );

/*
* class Backslashed
*/
var _Backslashed = function() {

this.nextStep = function(table) {
    // digest the next character and store it as txt
    var cursor = this.cursor;
    var length = cursor.text.length;
    if (length < cursor.pos + 1) {
;;;     kukit.E = 'Missing character after backslash.';
        this.emitError(kukit.E);
    } else { 
        this.result.push(new kukit.tk.Fraction(cursor, cursor.pos+1));
        this.cursor.pos += 1;
        this.finished = true;
    }
};

this.process = function() {
    this.txt = this.result[1].txt;
};

};
kssp.Backslashed = kukit.tk.mkParser('backslashed', {
    },
    _Backslashed
    );

/*
* class MethodArgs
*
* methodargs are (a, b, c) lists.
*/
var _MethodArgs = function() {

this.process = function() {
    this.args = [];
    // Parse all tokens (except first and last)
    var context = {'nextTokenIndex': 1};
    while (context.nextTokenIndex < this.result.length-1) {
        this.digestTxt(context, kukit.tk.Fraction, kssp.Comment);
        var value = context.txt;
        if (! value) {
            // allow to bail out after widow ,
            if (context.nextTokenIndex == this.result.length-1) break;
            // here be a string then.
            this.expectToken(context, kssp.String);
            value = context.token.txt;
        } else {
            // Just a value, must be one word then.
            if (value.indexOf(' ') != -1) {
;;;             kukit.E = 'Wrong method argument [' + value;
;;;             kukit.E += '] : value cannot have spaces (if needed,';
;;;             kukit.E += ' quote it as a string).';
                this.emitError(kukit.E);
            }
        }
        var valueClass;
        var args;
        var providedValue;
        if (this.notInTokens(context, kssp.MethodArgs)){
            this.expectToken(context, kssp.MethodArgs);
             valueClass = kukit.rd.KssMethodValue;
             args = context.token.args;
             providedValue = new valueClass(value, args);
        } else {
             // XXX This should be wrapped too !
             //valueClass = kukit.rd.KssTextValue;
             //providedValue = new valueClass(value);
             providedValue = value;
        }
        this.args.push(providedValue);
        if (context.nextTokenIndex == this.result.length-1) break;
        this.expectToken(context, kssp.comma);
    }
    this.result = [];
    this.txt = '';
};

};
kssp.MethodArgs = kukit.tk.mkParser('methodargs', {
    "'": _returnString,
    '"': _returnString2,
    ",": _mkReturnToken(kssp.comma),
    ")": _mkEmitAndReturnToken(kssp.closeParent),
    "(": _returnMethodArgs,
    "\/\*": _returnComment
    },
    _MethodArgs
    );

/*
* class KssSelectors
*
* embedded parser to parse the block of selectors
* KSS event selector: (has spaces in it)
*      <css selector> selector:name(id)
* KSS method selector: (has no spaces in it)
*      document:name(id) or behaviour:name(id)
*/
var _KssSelectors = function() {

this.process = function() {
    this.selectors = [];
    // Parse all tokens (including first and last)
    var context = {'nextTokenIndex': 0};
    while (context.nextTokenIndex < this.result.length) {
        this.digestTxt(context, kukit.tk.Fraction, kssp.Comment,
            kssp.String, kssp.String2);
        var cursor = new kukit.tk.Cursor(context.txt + ' ');
        var parser = new kssp.KssSelector(cursor, null, true);
        this.selectors.push(parser.kssSelector);
        if (context.nextTokenIndex == this.result.length) break;
        this.expectToken(context, kssp.comma);
        if (context.nextTokenIndex == this.result.length) {
;;;        kukit.E = 'Wrong event selector : trailing comma';
           this.emitError(kukit.E); 
        }
    };
    this.result = [];
    this.txt = '';
};

};
kssp.KssSelectors = kukit.tk.mkParser('kssselectors', {
    "'": function() {
             return new kssp.StringInSelector(this.cursor, kssp.quote);
             },
    '"': function() {
             return new kssp.String2InSelector(this.cursor, kssp.dquote);
             },
    ",": _mkReturnToken(kssp.comma),
    "{": _emitAndReturn,
    "\/\*": _returnComment
    },
    _KssSelectors 
    );

/*
* class KssSelector
*
* embedded parser to parse the selector
* KSS event selector: (has spaces in it)
*      <css selector> selector:name(id)
*      <css selector> selector:name(pprov(id))
* kss method selector: (has no spaces in it)
*      document:name(id) or behaviour:name(id)
*      document:name(pprov(id)) or behaviour:name(pprov(id))
*/
var _KssSelector = function() {

this.process = function() {
    var name;
    var namespace = null;
    var id = null;
    var tokenIndex = this.result.length - 1;
    // Find the method parms and calculate the end of css parms. (RL)
    var cycle = true;
    while (cycle && tokenIndex >= 0) {
        var token = this.result[tokenIndex];
        switch (token.symbol) {
            case kukit.tk.Fraction.prototype.symbol: {
                // if all spaces, go to previous one
                if (token.txt.match(/^[\r\n\t ]*$/) != null) {
                    tokenIndex -= 1;
                } else {
;;;                 kukit.E = 'Wrong event selector : missing event ';
;;;                 kukit.E += 'qualifier :<EVENTNAME> ';
;;;                 kukit.E += 'or :<EVENTNAME>(<ID>).';
                    this.emitError(kukit.E);
                }
            } break;
            case kssp.Comment.prototype.symbol: {
                tokenIndex -= 1;
            } break;
            default: {
                cycle = false;
            } break;
        }
    }
    // Now we found the token that must be <fraction> <colon> <multiPropValue>.
    tokenIndex -= 2;
    if (tokenIndex < 0
         || (this.result[tokenIndex+2].symbol !=
                kssp.EventValue.prototype.symbol)
         || (this.result[tokenIndex+1].symbol != 
                kssp.colon.prototype.symbol)
         || (this.result[tokenIndex].symbol !=
                kukit.tk.Fraction.prototype.symbol)) {
;;;     kukit.E = 'Wrong event selector : missing event qualifier ';
;;;     kukit.E += ':<EVENTNAME> or :<EVENTNAME>(<ID>).';
        this.emitError(kukit.E);
    }
    // See that the last fraction does not end with space.
    var lasttoken = this.result[tokenIndex];
    var commatoken = this.result[tokenIndex+1];
    var pseudotoken = this.result[tokenIndex+2];
    var txt = lasttoken.txt;
    if (txt.match(/[\r\n\t ]$/) != null) {
;;;     kukit.E = 'Wrong event selector :';
;;;     kukit.E += ' space before the colon.';
        this.emitError(kukit.E);
    }
    if (! pseudotoken.value.methodName) {
;;;     kukit.E = 'Wrong event selector :';
;;;     kukit.E += ' event name cannot have spaces.';
        this.emitError(kukit.E);
    }
    css = this.cursor.text.substring(this.startpos, commatoken.startpos);
    // Decide if we have an event or a method selector.
    // We have a method selector if a single word "document" or "behaviour".
    var singleword = css.replace(/[\r\n\t ]/g, ' ');
    if (singleword && singleword.charAt(0) == ' ') {
        singleword = singleword.substring(1);
    }
    var isEvent = (singleword != 'document' && singleword != 'behaviour');
    if (! isEvent) {
        // just store the single word, in case of event selectors
        css = singleword;
    }
    // create the selector.
    var id = null;
    var ppid = null;
    if (pseudotoken.value.arg) {
        // We have something in the parentheses after the event name.
        if (pseudotoken.value.arg.isMethod) {
            // we have a param provider here. Just store.
            ppid = pseudotoken.value.arg;
            // Check its syntax too.
            ppid.check(kukit.pprovidersGlobalRegistry);
        } else {
            // just an id. Express in txt.
            id = pseudotoken.value.arg.txt;
        }
    }
    var name = pseudotoken.value.methodName;
    var splitname = name.split('-');
    var namespace = null;
    if (splitname.length > 2) {
;;;     kukit.E = 'Wrong event selector [' + name + '] : ';
;;;     kukit.E += 'qualifier should be :<EVENTNAME> or ';
;;;     kukit.E += ':<NAMESPACE>-<EVENTNAME>.';
        this.emitError(kukit.E);
    } else if (splitname.length == 2) { 
        name = splitname[1];
        namespace = splitname[0];
    }
    // Protect the error for better logging
;;; try {
        this.kssSelector = new kukit.rd.KssSelector(isEvent, css, name,
            namespace, id, ppid, kukit.eventsGlobalRegistry);
;;; } catch(e) {
;;;     if (e.name == 'KssSelectorError') {
;;;         // Log the message
;;;         this.emitError(e.toString());
;;;     } else {
;;;         throw e;
;;;     }
;;; };
    this.txt = '';
    this.result = [];
};

};
kssp.KssSelector = kukit.tk.mkParser('kssselector', {
    ":": function() {
             return [new kssp.colon(this.cursor),
                     new kssp.EventValue(this.cursor)];
             },
    "{": _emitAndReturn,
    "\/\*": _returnComment
    },
    _KssSelector 
    );

/*
* class KssRuleProcessor
*
* Rule processor that interfaces with kukit core
*/
kssp.KssRuleProcessor = function(href) {

this.initialize = function() {
    this.href = href;
    this.loaded = false;
    this.rules = [];
};
    
this.load = function() {
      // Opera does not support getDomDocument.load, so we use XMLHttpRequest
      var domDoc = new XMLHttpRequest();
      domDoc.open("GET", this.href, false);
      domDoc.send(null);
      this.txt = domDoc.responseText;
      this.loaded = true;
};

this.parse = function() {
;;; try {
        //Build a parser and parse the text into it
        var cursor = new kukit.tk.Cursor(this.txt);
        var parser = new kssp.Document(cursor, null, true);
        // Store event rules in the common list
        for (var i=0; i<parser.eventRules.length; i++) {
            var rule = parser.eventRules[i];
            rule.kssSelector.prepareId();
            this.rules.push(rule);
        }
;;; } catch(e) {
;;;    // ParsingError are logged.
;;;    if (e.name == 'ParsingError' || e.name == 'UndefinedEventError') {
;;;        throw kukit.err.kssParsingError(e, this.href);
;;;    } else {
;;;        throw e;
;;;    }
;;; }
};
this.initialize.apply(this, arguments);
};

}();                              /// MODULE END
