/*
* Copyright (c) 2005-2007
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

/* Generic dom helpers */

kukit.dom = new function() {   /// MODULE START
 
var dom = this;

dom.getPreviousSiblingTag = function(node) {
    var toNode = node.previousSibling;
    while ((toNode != null) && (toNode.nodeType != 1)) {
        toNode = toNode.previousSibling;
    }
    return toNode;
};

dom.getNextSiblingTag = function(node) {
    var toNode = node.nextSibling;
    while ((toNode != null) && (toNode.nodeType != 1)) {
        toNode = toNode.nextSibling;
    }
    return toNode;
};

dom.insertBefore = function(nodes, parentNode, toNode) {
    for(var i=0; i<nodes.length; i++) {
        parentNode.insertBefore(nodes[i], toNode);
    }
};

dom.appendChildren = function(nodes, toNode) {
    for(var i=0; i<nodes.length; i++) {
        toNode.appendChild(nodes[i]);
    }
};

dom.clearChildNodes = function(node) {
    //XXX Maybe we want to get rid of sarissa once?
    Sarissa.clearChildNodes(node);
};

dom.parseHTMLNodes = function(txt){
    var node = document.createElement('div');
    node.innerHTML = txt;
    var resultNodes = [];
    for (var i=0; i<node.childNodes.length; i++) {
        resultNodes.push(node.childNodes.item(i));
    }
    return resultNodes;
};

/*
*  really the query should start from the document root, but
*  limited to inNodes subtrees!
*/

dom.cssQuery = function(selector, inNodes) {
    // to eliminate possible errors
    if (typeof(inNodes) != 'undefined' && inNodes == null) {
;;;    kukit.E = 'Selection error in kukit.dom.cssQuery';
        throw new Error(kukit.E);
    }
    return _cssQuery(selector, inNodes);
};

/*
 * Decide which query to use
 */

var _USE_BASE2 = (typeof(base2) != 'undefined');
if (_USE_BASE2) {
    // Base2 legacy version: matchAll has to be used
    // Base2 recent version: querySelectorAll has to be used
    var _USE_BASE2_LEGACY = (typeof(base2.DOM.Document.querySelectorAll) == 'undefined');
    if (! _USE_BASE2_LEGACY) {
;;;     kukit.log('Using cssQuery from base2.');
        var _cssQuery = function(selector, inNodes) {
            // global scope, always.
            // This is very bad. However the binding makes sure that
            // nodes once bound will never be bound again
            // (also, noticed the following issue: cssQuery, when called
            // on an element, does not check the element itself.)
            var results = base2.DOM.Document.querySelectorAll(document, selector);
            var nodes = [];
            for(var i = 0; i < results.length; i++) {
                nodes.push(results.item(i));
            }
            return nodes;
        };
    } else {
;;;     kukit.log('Using cssQuery from base2. (Using legacy API document.matchAll)');
        var _cssQuery = function(selector, inNodes) {
            // global scope, always.
            // This is very bad. However the binding makes sure that
            // nodes once bound will never be bound again
            // (also, noticed the following issue: cssQuery, when called
            // on an element, does not check the element itself.)
            var results = base2.DOM.Document.matchAll(document, selector);
            var nodes = [];
            for(var i = 0; i < results.length; i++) {
                nodes.push(results.item(i));
            }
            return nodes;
        };
    }
} else {
;;;kukit.log('Using original cssQuery.');
    var _cssQuery = function(selector, inNodes) {
        // global scope, always.
        // This is very bad. However the binding makes sure that
        // nodes once bound will never be bound again
        // (also, noticed the following issue: cssQuery, when called
        // on an element, does not check the element itself.)
        var results = cssQuery(selector);
        return results;
    };
};

dom.focus = function(node) {
    tagName = node.tagName.toLowerCase();
    if ((tagName == 'input') || (tagName == 'select')
       || (tagName == 'textarea')) {
        node.focus();
;;;} else {
;;;    kukit.logWarning('Focus on node that cannot have focus !');
    };
};

dom.blur = function(node) {
    tagName = node.tagName.toLowerCase();
    if ((tagName == 'input') || (tagName == 'select')
       || (tagName == 'textarea')) {
        node.blur();
;;;} else {
;;;    kukit.logWarning('Blur on node that cannot be blurred !');
    };
};

/*
*  Gets the textual content of the node
*  if recursive=false (default), does not descend into sub nodes
*/
dom.textContent = function(node, recursive) {
    var value = _textContent(node, recursive);
    // replace newline with spaces
    value = value.replace(/\r\n/g, ' ');
    value = value.replace(/[\r\n]/g, ' ');
    return value;
};

var _textContent = function(node, recursive) {
    if (typeof(recursive) == 'undefined') {
        recursive = false;
    }
    var value = '';
    var childnodes = node.childNodes;
    for (var i=0; i<childnodes.length; i++) {
        var child = childnodes[i];
        if (child.nodeType == 3) {
            // Only process text nodes
            value += child.nodeValue;
        } else if (recursive && child.nodeType == 1) {
            // recurr into element nodes
            value += dom.textContent(child, true);
        }
    }
    return value;
};

/* Getting and setting node attibutes 
   We need to provide workarounds for IE.
*/

dom.getAttribute = function(node, attrname) {
    if (attrname.toLowerCase() == 'style') {
        throw new Error('Style attribute is not allowed with getAttribute');
    }
;;;if (typeof(attrname) != 'string') {
;;;    throw new Error('value error : attrname must be string');
;;;}
    // The code hereunder does not work for kssattr:xxx args
    // var value = node[argname];

    // try catch is needed in some cases on IE
    try {
        var value = node.getAttribute(attrname);
    }
    catch(e) {
        var value = null;
    }
    if (! value) {
        // Workarounds, in case we have not found above
        if (attrname.toLowerCase() == 'class') {
            // for IE
            value = node.className;
        } else if (attrname.toLowerCase() == 'for') {
            // for IE
            value = node.htmlFor;
        }
    }
    return value;
    // XXX We cannot distinguish between notfound and '', unfortunately
};

dom.setAttribute = function(node, attrname, value) {
    if (attrname.toLowerCase() == 'style') {
        throw new Error('Style attribute is not allowed with setAttribute');
    }
    else if (attrname.toLowerCase() == 'class') {
        // The class attribute cannot be set on IE, instead
        // className must be used. However node.className = x
        // works on both IE and FF.
        node.className = value;
    } else if (attrname.toLowerCase() == 'for') {
        // On IE, workaround is needed. Since I am not sure, I use both methods.
        node.htmlFor = value;
        node.setAttribute(attrname, value);
    } else if (attrname.toLowerCase() == 'value') {
        node.value = value;
    } else if (attrname.toLowerCase() == 'checked') {
        // we need to convert this to boolean.
        value = ! (value == '' || value == 'false' || value == 'False');
        node.checked = value;
    } else {
        node.setAttribute(attrname, value);
    }
};


/* KSS attributes: a workaround to provide attributes
   in our own namespace.
   Since namespaced attributes (kss:name="value") are not allowed
   even in transitional XHTML, we must provide a way to
   substitute them. This is achieved by putting kssattr-name-value
   identifiers in the class attribute, separated by spaces.
   We only read these attributes, writing happens
   always in the kss namespace.
   XXX at the moment, deletion can be achieved with setting with
   a value ''. This is consistent with DOM behaviour as we seem to
   be getting '' for nonexistent values anyway.
*/

var _kssAttrNamespace = 'kssattr';

// the namespace prefix for kss values, 
// i.e.:
//              class="... kss-attr-key-value..."
//              id=="kss-id-key-value"
// (XHTML:)     kss-attr:key-value 
//
var _kssNamespacePrefix = 'kss';

var _getKssValueFromEncodings = function(encodings, prefix) {
    // Value us a list of values.
    // If a value equals prefix-value, it will find it
    // and return the value after the prefix and the dash.
    // (First value found will be returned.)
    //
    // For example:
    //
    //     _getKssValueFromEncodings(['kss-attr-key1-value1', 'kss-attr-key2-value2',
    //          'kss-id-key1-value1'], "kss-attr-key1')
    //
    // results 'value1'.
    //
    // Legacy example:
    //
    //    _getKssValueFromEncodings(['kssattr-key1-value1', 'kssatt-rkey2-value2'], 
    //          "kss-attr-key1')
    //
    //  results 'value1'.
    //
    prefix = prefix + '-';
    var prefixLength = prefix.length;
    for (var i=0; i<encodings.length; i++) {
        var encoding = encodings[i];
        // Does the value start with the prefix?
        if (encoding.substr(0, prefixLength) == prefix) {
            // Found it.
            return encoding.substr(prefixLength);
        }
    }
    return null;
};

// BBB hint: used by getKssAttribute only, for providers
// kssAttr and  currentFormVarForKssAttr.
var _getKssClassAttribute = function(node, attrname) {
    // Gets a given kss attribute from the class
    var klass = dom.getAttribute(node, 'class');
    if (klass) {
        var splitclass = klass.split(/ +/);
        return _getKssValueFromEncodings(splitclass, 'kssattr-' + attrname);
    }
    return null;
};

dom.getKssAttribute = function(node, attrname) {
    // Gets a given kss attribute 
    // first from the namespace, then from the class
    var fullName = _kssAttrNamespace + ':' + attrname;
    var result = dom.getAttribute(node, fullName);
    // XXX if this was '' it is the same as notfound,
    // so it shadows the class attribute!
    // This means setting an attribute to '' is the same as deleting it - 
    // at least at the moment
    if (! result) {
        result = _getKssClassAttribute(node, attrname);
    }
    return result;
};

dom.setKssAttribute = function(node, attrname, value) {
    // Sets a given kss attribute on the namespace
    var fullName = _kssAttrNamespace + ':' + attrname;
    dom.setAttribute(node, fullName, value);
};

/* 
 * Handling of kss values
 */

dom.getKssValue = function(node, keyType, key) {
    // Gets a given kss value
    // first try from the namespace (XHTML), then from the class and id
    var namespacedName = _kssNamespacePrefix + '-' + keyType;
    // We access node.getAttribute directly, because we don't need the
    // other checks in dom.getAttribute
    var attrName = namespacedName + ':' + key;
    var result = node.getAttribute(attrName);
    // XXX if this was '' it is the same as notfound,
    // so it shadows the class attribute!
    // This means setting an attribute to '' is the same as deleting it - 
    // at least at the moment
    if (! result) {
        // Make sure result is null, in case we can't produce one
        // below.
        result = null;
        // Now try to get it from the class and id encodings.
        // Having it in the id gives the advantage that we can use
        // kss-id-key-value both as a unique html id, and widget markup.
        var klass = dom.getAttribute(node, 'class');
        var encodings;
        if (klass) {
            encodings = klass.split(/ +/);
        } else {
            encodings = [];
        }
        var id = dom.getAttribute(node, 'id');
        if (id) {
            // We have an id, consider it too
            // id will be inserted 1st, ie. it overrides possible doubles in classes
            encodings.unshift(id);
        }
        // Get the result-
        var prefix = namespacedName + '-' + key;
        return _getKssValueFromEncodings(encodings, prefix);
    }
    return result;
};

dom.setKssValue = function(node, keyType, key, value) {
    // Sets a given kss attribute on the namespace
    var namespacedName = _kssNamespacePrefix + '-' + keyType;
    // We access node.setAttribute directly, because we don't need the
    // other checks in dom.setAttribute
    var attrName = namespacedName + ':' + key;
    node.setAttribute(attrName, value);
};


/* Recursive query of node attributes
   getter is a function that gets the value from the node.
*/

dom.locateMarkup =
    function(node, recurseParents, getter, p1, p2, p3, p4, p5) {
    var value = getter(node, p1, p2, p3, p4, p5);
    var element = node;
    if (recurseParents) {
        // need to recurse even if value="" !
        // We cannot figure out if there exists
        // and attribute in a crossbrowser way, or it is set to "".
        while (! value) {
            element = element.parentNode;
            if (! element || ! element.getAttribute) {
                break;
            }
            value = getter(element, p1, p2, p3, p4, p5);
        }
    } 
    if (typeof(value) == 'undefined') {
        // notfound arguments will get null
        value = null;
    }
    // We return both the value and the node where
    // it was found.
    return {value:value, node:element};
};

dom.getRecursiveAttribute =
    function(node, attrname, recurseParents, getter) {
    return dom.locateMarkup(node,
            recurseParents, getter, attrname).value;
};

/*
* From http://xkr.us/articles/dom/iframe-document/
* Note it's not necessary for the iframe to have the name
* attribute since we don't access it from window.frames by name.
*/
var _getIframeDocument = function(framename) {
    var iframe = document.getElementById(framename);
    var doc = iframe.contentWindow || iframe.contentDocument;
    if (doc.document) {
        doc = doc.document;
    }
    return doc;
};

/*
*  class EmbeddedContentLoadedScheduler
*
*  Scheduler for embedded window content loaded
*/
dom.EmbeddedContentLoadedScheduler = function() {

this.initialize = function(framename, func, autodetect) {
    this.framename = framename;
    this.func = func;
    this.autodetect = autodetect;
    var self = this;
    var f = function() {
        self.check();
    };
    this.counter = new kukit.ut.TimerCounter(250, f, true);
    // check immediately.
    //this.counter.timeout();
    // XXX can't execute immediately, it fails on IE.
    this.counter.start();
};

this.check = function() {
    
;;; kukit.logDebug('Is iframe loaded ?');
    
    var doc = _getIframeDocument(this.framename);

    // quit if the init function has already been called
    // XXX I believe we want to call the function too, then
    // XXX attribute access starting with _ breaks full compression,
    // even in strings
    //if (doc._embeddedContentLoadedInitDone) {
    if (doc['_' + 'embeddedContentLoadedInitDone']) {
;;;     var msg = 'Iframe already initialized, but we execute the action';
;;;     msg += ' anyway, as requested.';
;;;     kukit.logWarning(msg);
        this.counter.restart = false;
    }

    // autodetect=false implements a more reliable detection method
    // that involves cooperation from the internal document. In this
    // case the internal document sets the _kssReadyForLoadEvent attribute
    // on the document, when loaded. It is safe to check for this in any 
    // case, however if this option is selected, we rely only on this, 
    // and skip the otherwise problematic default checking.
    // XXX attribute access starting with _ breaks full compression,
    // even in strings
    //if (typeof doc._kssReadyForLoadEvent != 'undefined') {
    if (typeof doc['_' + 'kssReadyForLoadEvent'] != 'undefined') {
        this.counter.restart = false;
    } 

    if (this.autodetect && this.counter.restart) {

        // obviously we are not there... this happens on FF
        if (doc.location.href == 'about:blank') {
            return;
        } /* */
        
        // First check for Safari or
        // if DOM methods are supported, and the body element exists
        // (using a double-check including document.body,
        // for the benefit of older moz builds [eg ns7.1] 
        // in which getElementsByTagName('body')[0] is undefined,
        // unless this script is in the body section)
        
        if(/KHTML|WebKit/i.test(navigator.userAgent)) {
            if(/loaded|complete/.test(doc.readyState)) {
                this.counter.restart = false;
            }
        } else if(typeof doc.getElementsByTagName != 'undefined'
            && (doc.getElementsByTagName('body')[0] != null ||
                doc.body != null)) {
            this.counter.restart = false;
        } /* */

    }

    if ( ! this.counter.restart) {
;;;     kukit.logDebug('Yes, iframe is loaded.');
        // XXX attribute access starting with _ breaks full compression,
        // even in strings
        // doc._embeddedContentLoadedInitDone = true;
        doc['_' + 'embeddedContentLoadedInitDone'] = true;
        this.func();
    }
};
this.initialize.apply(this, arguments);
};

dom.getNsTags = function(dom_obj, tagName) {
    // Now, all the document is in the kukit namespace,
    // so we just access them by tagname.
    tags = dom_obj.getElementsByTagName(tagName);
    return tags;
};

var _hasClassName = function(node, class_name) {
    return new RegExp('\\b'+class_name+'\\b').test(node.className);
};

dom.addClassName = function(node, class_name) {
    if (!node.className) {
        node.className = class_name;
    } else if (!_hasClassName(node, class_name)) {
        var className = node.className+" "+class_name;
        // cleanup
        node.className = className.split(/\s+/).join(' ');
    }
};

dom.removeClassName = function(node, class_name) {
    var className = node.className;
    if (className) {
        // remove
        className = className.replace(new RegExp('\\b'+class_name+'\\b'), '');
        // cleanup
        className = className.replace(/\s+/g, ' ');
        node.className = className.replace(/\s+$/g, '');
    }
};


/*
 * Cookie handling code taken from: 
 * http://www.quirksmode.org/js/cookies.html
 */

dom.createCookie = function(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
};

// we get this from kukit utils.js. We needed an early
// definition there, because logging is needed from the
// very beginning.
dom.readCookie = kukit.readCookie;

dom.eraseCookie = function(name) {
    createCookie(name, "", -1);
};

}();                              /// MODULE END

