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

/* Form handling utilities */

kukit.fo = new function() {   /// MODULE START

var fo = this;

/* form query assembler */

// Prefix constants for dict marshalling, 
//     pattern: %s(_dictPrefix)%(name)s%(_dictSeparator)s%(key)s%(_dictPostfix)s
// XXX this should be settable
var _dictPrefix = '';
var _dictSeparator = '.';
var _dictPostfix = ':record';

/*
* class _FormQueryElem
*/
var _FormQueryElem = function() {

this.initialize = function(name, value) {
    this.name = name;
    this.value = value;
};
    
this.encode = function() {
    return this.name+ "=" + encodeURIComponent(this.value);
};
this.initialize.apply(this, arguments);
};
    
/*
* class FormQuery
*/
fo.FormQuery = function() {

this.initialize = function() {
    this.l = [];
};

this.appendElem = function(name, value) {
    if (value == null) {
        // do not marshall nulls
;;;     var msg = "Parameter '" + name + "' is null,";
;;;     msg += " it is not marshalled.";
;;;     kukit.logDebug(msg);
        }
    else if (typeof(value) == 'string') {
        var elem = new _FormQueryElem(name, value);
        this.l.push(elem);
    }
    // value.length is for detection of an Array.
    // In addition we also check that value.pop is a function
    else if (typeof(value) == 'object' && 
        typeof(value.length) == 'number' &&
        typeof(value.pop) == 'function') {
        // Special marshalling of arrays
        for (var i=0; i < value.length; i++) {
            var elem = new _FormQueryElem(name, value[i]);
            this.l.push(elem);
        }
    }
    else if (typeof(value) == 'object') {
        // Special marshalling of dicts
        for (var key in value) {
            var qkey = _dictPrefix + name + _dictSeparator;
            qkey += key + _dictPostfix;
            var elem = new _FormQueryElem(qkey, value[key]);
            this.l.push(elem);
        }
    }    
};

this.encode = function() {
    var poster = [];
      for (var i=0;i < this.l.length;i++) {
        poster[poster.length] = this.l[i].encode();
    }
    return poster.join("&");
};

this.toDict = function() {
    var d = {};
      for (var i=0;i < this.l.length;i++) {
        var elem = this.l[i];
        d[elem.name] = elem.value;
    }
    return d;
};
this.initialize.apply(this, arguments);
};

/* Form data extraction, helpers */

var findContainer = function(node, func) {
    // Starting with the given node, find the nearest containing element
    // for which the given function returns true.
    while (node != null) {
        if (func(node)) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
};

/*
 * class CurrentFormLocator: gets the current form of a target
 *
 */

fo.CurrentFormLocator = function() {

this.initialize = function(target) {
    this.target = target;
};

this.queryForm = function() {
    // Find the form that contains the target node.
    return findContainer(this.target, function(node) {
        if (!node.nodeName) {
            return false;
        }
        if (node.nodeName.toLowerCase() == "form") {
            return true;
        } else {
            return false;
        }
    });
};

this.getForm = function() {
    var form = this.queryForm();
    if (!form) {
;;;     kukit.logWarning("No form found");
        return null;
    }
    return form;
};
this.initialize.apply(this, arguments);
};

/*
 * class NamedFormLocator: gets the form with a given name
 *
 */

fo.NamedFormLocator = function() {

this.initialize = function(formname) {
    this.formname = formname;
};

this.queryForm = function() {
    // Find the form with the given name.
    return document.forms[this.formname];
};

this.initialize.apply(this, arguments);
};
fo.NamedFormLocator.prototype = new fo.CurrentFormLocator();

/* methods to take the desired value(s) from the form */

fo.getValueOfFormElement = function(element) {
    // Returns the value of the form element / or null
    // First: update the field in case an editor is lurking
    // in the background
    this.fieldUpdateRegistry.doUpdate(element);
    if (element.disabled) {
        return null;
    }
    // Collect the data
    if (element.selectedIndex != undefined) {
        // handle single selects first
        if(!element.multiple) {
                if (element.selectedIndex < 0) {
                    value="";
                } else {
                    var option = element.options[element.selectedIndex];
                    // on FF and safari, option.value has the value
                    // on IE, option.text needs to be used
                    value = option.value || option.text;
                } 
        // Now process selects with the multiple option set
        } else {
            var value = [];
            for(i=0; i<element.options.length; i++) {
                var option = element.options[i];
                if(option.selected) {
                    // on FF and safari, option.value has the value
                    // on IE, option.text needs to be used
                    value.push(option.value || option.text);
                }
            }
        }
    // Safari 3.0.3 no longer has "item", instead it works
    // with direct array access []. Although other browsers
    // seem to support this as well, we provide checking
    // in both ways. (No idea if item is still needed.)
    } else if (typeof element.length != 'undefined' && 
        ((typeof element[0] != 'undefined' && 
        element[0].type == "radio") ||
        (typeof element.item(0) != 'undefined' &&
        element.item(0).type == "radio"))) {
        // element really contains a list of input nodes,
        // in this case.
        var radioList = element;
        value = null;
        for (var i=0; i < radioList.length; i++) {
            var radio = radioList[i] || radioList.item(i);
            if (radio.checked) {
                value = radio.value;
            }
        }
    } else if (element.type == "radio" || element.type == "checkbox") {
        if (element.checked) {
           value = element.value;
        } else {
            value = null;
        }   
    } else if ((element.tagName.toLowerCase() == 'textarea')
               || (element.tagName.toLowerCase() == 'input' && 
                    element.type != 'submit' && element.type != 'reset')
              ) {
        value = element.value;
    } else {
        value = null;
    }
    return value;
};

fo.getFormVar = function(locator, name) {
    var form = locator.getForm();
    if (! form)
        return null;
    // Extract the value of a formvar
    var value = null;
    var element = form[name];
    // (in case of a radio button this will give a collection
    // that contains the list of input nodes.)
    if (element) {
        var value = fo.getValueOfFormElement(element);
;;;     if (value != null) {
;;;         var msg = "Form element [" + element.tagName + "] : name = ";
;;;         msg += element.name + ", value = " + value + '.';
;;;         kukit.logDebug(msg);
;;;     }
;;; } else {
;;;     kukit.logWarning('Form element [' + name + '] not found in form.');
    }
    return value;
};

fo.getAllFormVars = function(locator, collector) {
    var form = locator.getForm();
    if (! form)
        return collector.result;
    // extracts all elements of a given form
    // the collect_hook will be called wih the name, value parameters to add it
    var elements = form.elements;
    for (var y=0; y<elements.length; y++) {
        var element = elements[y];
        var value = fo.getValueOfFormElement(element);
        if (value != null) {
;;;         var msg = "Form element [" + element.tagName + "] : name = ";
;;;         msg += element.name + ", value = " + value + '.';
;;;         kukit.logDebug(msg);
            collector.add(element.name, value);
        }
    }
    return collector.result;
};


/* With editors, there are two main points of handling:

   1. we need to load them after injected dynamically
   2. we need to update the form before we accces the form variables

    Any editor has to register the field on their custody.
    The update handler will be called automatically, when a form
    value is about to be fetched.
*/

/*
* class _FieldUpdateRegistry
*/
var _FieldUpdateRegistry = function() {

this.initialize = function() {
    this.editors = {};
};

this.register = function(node, editor) {
    var hash = kukit.rd.hashNode(node);
    if (typeof(this.editors[hash]) != 'undefined') {
;;;     kukit.E = 'Double registration of editor update on node.';
        throw new Error(kukit.E);
    }
    this.editors[hash] = editor;
    //kukit.logDebug('Registered '+node.name + ' hash=' + hash);
    //Initialize the editor
    editor.doInit();
};

this.doUpdate = function(node) {
    var hash = kukit.rd.hashNode(node);
    var editor = this.editors[hash];
    if (typeof(editor) != 'undefined') {
        editor.doUpdate(node);
        //kukit.logDebug('Updated '+node.name + ' hash=' + hash);
    }
};
this.initialize.apply(this, arguments);
};

// fieldUpdateRegistry is a public service, available to all components
// that want to be notified when kss wants to use a field value.
this.fieldUpdateRegistry = new _FieldUpdateRegistry();


//
// form, currentForm will fetch an entire form for marshalling.
// This is needed because duplications and order must be preserved.
// The returnType of them will be registered as "formquery". This
// represents a list of (key, value) tuples that need to be marshalled.
// This assures to preserve order of keys, which is important
// for multi-values.
//

/*
*
* class _FormValueProvider
*
*/
var _FormValueProvider = function() {

this.check = function(args) {
;;; if (args.length != 1) {
;;;     throw new Error('form method needs 1 arguments (formname)');
;;; }
};

this.eval = function(args, node) {
    var locator = new fo.NamedFormLocator(args[0]);
    var collector = new kukit.ut.TupleCollector();
    return fo.getAllFormVars(locator, collector);
};

};

kukit.pprovidersGlobalRegistry.register('form', _FormValueProvider, 'formquery');

/*
*
* class _CurrentFormValueProvider
*
*/
var _CurrentFormValueProvider = function() {

this.check = function(args) {
;;; if (args.length != 0) {
;;;     throw new Error('currentForm method needs no argument');
;;; }
};

this.eval = function(args, node) {
    var locator = new fo.CurrentFormLocator(node);
    var collector = new kukit.ut.TupleCollector();
    return fo.getAllFormVars(locator, collector);
};

};

kukit.pprovidersGlobalRegistry.register('currentForm', _CurrentFormValueProvider, 'formquery');


/* BBB. To be deprecated on 2008-06-15 */

fo.getCurrentForm = function(target) {
;;; var msg = 'Deprecated kukit.fo.getCurrentForm(target), use new ';
;;; msg += 'kukit.fo.CurrentFormLocator(target).getForm() instead!';
;;; kukit.logWarning(msg);
    return new fo.CurrentFormLocator(target).getForm();
};

fo.getFormVarFromCurrentForm = function(target, name) {
;;; var msg = 'Deprecated kukit.fo.getFormVarFromCurrentForm(target, name),';
;;; msg += ' use kukit.fo.getFormVar(new kukit.fo.CurrentFormLocator(target),';
;;; msg += ' name) instead!';
;;; kukit.logWarning(msg);
    return fo.getFormVar(new fo.CurrentFormLocator(target), name);
};

fo.getFormVarFromNamedForm = function(formname, name) {
;;; var msg = 'Deprecated kukit.fo.getFormVarFromNamedForm(formname, name),';
;;; msg += ' use kukit.fo.getFormVar(new kukit.fo.NamedFormLocator(formname),';
;;; msg += ' name) instead!';
;;; kukit.logWarning(msg);
    return fo.getFormVar(new fo.NamedFormLocator(formname), name);
};

fo.getAllFormVarsFromCurrentForm = function(target) {
;;; var msg = 'Deprecated kukit.fo.getAllFormVarsFromCurrentForm(target),';
;;; msg += ' use kukit.fo.getAllFormVars(new kukit.fo.CurrentFormLocator';
;;; msg += '(target), new kukit.ut.DictCollector()) instead!';
;;; kukit.logWarning(msg);
    return fo.getAllFormVars(new fo.CurrentFormLocator(target),
        new kukit.ut.DictCollector());
};

fo.getAllFormVarsFromNamedForm = function(formname) {
;;; var msg = 'Deprecated kukit.fo.getAllFormVarsFromNamedtForm(formname), ';
;;; msg += 'use kukit.fo.getAllFormVars(new kukit.fo.NamedFormLocator';
;;; msg += '(formname), new kukit.ut.DictCollector()) instead!';
;;; kukit.logWarning(msg);
    return fo.getAllFormVars(new fo.NamedFormLocator(formname),
        new kukit.ut.DictCollector());
};

}();                              /// MODULE END
