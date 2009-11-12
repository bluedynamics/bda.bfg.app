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

kukit.pr = new function() {   /// MODULE START

var pr = this;

/*
*  class ValueProviderRegistry
* 
*  The parameter providers need to be registered here.
*/
pr.ValueProviderRegistry = function () {

this.initialize = function() {
    this.content = {};
};

this.register = function(name, func, returnType) {
    if (typeof(func) == 'undefined') {
;;;     kukit.E = 'func argument is mandatory when registering a parameter'
;;;     kukit.E += ' provider [ValueProviderRegistry.register].';
        throw new Error(kukit.E);
    }
;;; if (this.content[name]) {
;;;    // Do not allow redefinition
;;;    var msg = 'Error : parameter provider [' + name;
;;;    msg += '] already registered.';
;;;    kukit.logError(msg);
;;;    return;
;;; }
    this.content[name] = func;
    // Handle return type
    // XXX Store it on the func's prototype.
    // This is a temporary solution, the service-layer
    // branch offers a proper way to do this.
    func.prototype.returnType = returnType;
};

this.exists = function(name) {
    var entry = this.content[name];
    return (typeof(entry) != 'undefined');
};

this.get = function(name) {
    var func = this.content[name];
    if (! func) {
;;;     kukit.E = 'Error : undefined parameter provider [' + name + '].';
        throw new Error(kukit.E);
    }
    return func;
};
this.initialize.apply(this, arguments);
};

}();                              /// MODULE END

kukit.dummy = new function() {   /// MODULE START
/*
* Register the core parameter providers
*
* A parameter provider is a class that needs to implement the 
* check and the eval methods.
* Check is executed at parsing time, eval is doing the real job
* of providing the requested parameter result.
* Check throws an exception if the parameters are not as expected.
* The parameters are coming in the input array [args]. The current node is
* passed in [node]. The output value should be returned.
*
* There is a third parameter that contains the default parameters
* dict (for input only). This is only used by the [pass()] parameter
* provider. The default parameters are used if an action is called
* programmatically but in this case the parameters to be propagated
* must be explicitely declared using the provider [pass()].
*
* The special key '' is held for the parameter provider that just returns
* the string itself. This is by default defined as the identity function, but
* can be overwritten to do something with the string value. The usage is that
* this provider expects a single parameter, the string.
*/

/*
*  class _IdentityPP
*/
var _IdentityPP = function() {

this.check = function(args) {
    // check does not need to be used here actually.
;;; if (args.length != 1) {
;;;     throw new Error('internal error, _IdentityPP needs 1 argument');
;;; }
};

this.eval = function(args, node) {
    return args[0];
};

};

/*
*  class _FormVarPP
*/
var _FormVarPP = function() {

this.check = function(args) {
;;; if (args.length != 2) {
;;;     throw new Error('formVar method needs 2 arguments [formname, varname]');
;;; }
};

this.eval = function(args, node) {
    return kukit.fo.getFormVar(new kukit.fo.NamedFormLocator(args[0]), args[1]);
};

};

/*
*  class _CurrentFormPP
*/
var _CurrentFormVarPP = function() {

this.check = function(args) {
;;; if (args.length != 0 && args.length != 1) {
;;;     throw new Error('currentFormVar method needs 0 or 1 argument [varname]');
;;; }
};

this.eval = function(args, node) {
    if (args.length == 1) {
        return kukit.fo.getFormVar(new kukit.fo.CurrentFormLocator(node),
            args[0]);
    } else {
        // no form var name, just get the value of the node.
        return kukit.fo.getValueOfFormElement(node);
    }
};

};

/*
*  class _CurrentFormVarFromKssAttrPP
*/
var _CurrentFormVarFromKssAttrPP = function() {

this.check = function(args) {
;;; if (args.length != 1 && args.length != 2) {
;;;     kukit.E = 'currentFormVarFromKssAttr method needs 1 or 2 argument';
;;;     kukit.E += ' [attrname, [recurseParents]]';
;;;     throw new Error(kukit.E);
;;; }
};

this.eval = function(args, node) {
    var argname =  args[0];
    var recurseParents = false;
    if (args.length == 2) {
;;;     kukit.E = '2nd attribute of currentFormVarForKssAttr must be a';
;;;     kukit.E += ' boolean';
        recurseParents = kukit.ut.evalBool(args[1], kukit.E);
    }
    var formvarname = kukit.dom.getRecursiveAttribute(node, argname,
        recurseParents, kukit.dom.getKssAttribute);
    return kukit.fo.getFormVar(new kukit.fo.CurrentFormLocator(node),
        formvarname);
};

};


/*
*  class _NodeAttrPP
*/
var _NodeAttrPP = function() {

this.check = function(args) {
;;; if (args.length != 1 && args.length != 2) {
;;;     kukit.E = 'nodeAttr method needs 1 or 2 argument (attrname,';
;;;     kukit.E += ' [recurseParents]).';
;;;     throw new Error(kukit.E);
;;; }
};

this.eval = function(args, node) {
    var argname = args[0];
;;; if (argname.toLowerCase() == 'style') {
;;;     throw new Error('nodeAttr method does not accept [style] as attrname.');
;;; }
;;; if (argname.match(/[ ]/)) {
;;;     throw new Error('attrname parameter in nodeAttr method cannot contain space.');
;;; }
};

this.eval = function(args, node) {
    var argname = args[0];
    var recurseParents = false;
    if (args.length == 2) {
        recurseParents = args[1];
;;;     kukit.E = '2nd attribute of nodeAttr must be a boolean.';
        recurseParents = kukit.ut.evalBool(recurseParents, kukit.E);
    }
    return kukit.dom.getRecursiveAttribute(node, argname, recurseParents,
        kukit.dom.getAttribute);
};

};

/*
*  class _KssAttrPP
*/
var _KssAttrPP = function() {

this.check = function(args) {
;;; // Uncomment next part to activate BBB:
;;; //kukit.E = 'kssAttr is deprecated and will be removed at ';
;;; //kukit.E += '2008-XX-XX';
;;; //kukit.E += ', use kssValue. Change your html ';
;;; //kukit.E += 'class markup from kssattr-key-value to ';
;;; //kukit.E += 'kss-attr-key-value, ';
;;; //kukit.E += 'and change the provider from kssAttr(key, true) to ';
;;; //kukit.E += 'kssValue(attr, key). Note that kssValue has a third ';
;;; //kukit.E += 'parameter to enable/disable recursion, but in contrary ';
;;; //kukit.E += 'to kssAttr, kssValue has recursion by default enabled ';
;;; //kukit.E += '(true).';
;;; //kukit.logWarning(kukit.E);
;;; if (args.length != 1 && args.length != 2) {
;;;     kukit.E = 'kssAttr method needs 1 or 2 argument (attrname,';
;;;     kukit.E += ' [recurseParents]).';
;;;     throw new Error(kukit.E);
;;; }
};

this.eval = function(args, node) {
    var argname =  args[0];
    var recurseParents = false;
;;; if (argname.match(/[ -]/)) {
;;;     kukit.E = 'attrname parameter in kssAttr method cannot contain';
;;;     kukit.E += ' dashes or spaces.';
;;;     throw new Error(kukit.E);
;;; }
};

this.eval = function(args, node) {
    var argname =  args[0];
    var recurseParents = false;
    if (args.length == 2) {
        recurseParents = args[1];
;;;     kukit.E = '2nd attribute of kssAttr must be a boolean.';
        recurseParents = kukit.ut.evalBool(recurseParents, kukit.E);
    }
    return kukit.dom.getRecursiveAttribute(node, argname, recurseParents,
        kukit.dom.getKssAttribute);
};

};

/*
*  class _NodeContentPP
*/
var _NodeContentPP = function() {

this.check = function(args) {
;;; if (args.length != 0 && args.length != 1) {
;;;     throw new Error('nodeContent method needs 0 or 1 argument [recursive].');
;;; }
};

this.eval = function(args, node) {
    var recursive = false;
    if (args.length == 1) {
        recursive = args[0];
    }
    return kukit.dom.textContent(node, recursive);
};

};

/*
*  class _StateVarPP
*/
var _StateVarPP = function() {

this.check = function(args) {
;;; if (args.length != 1) {
;;;     throw new Error('stateVar method needs 1 argument [varname].');
;;; }
};

this.eval = function(args, node) {
    var key = args[0];
    var value = kukit.engine.stateVariables[key];
    if (typeof(value) == 'undefined') {
        // notfound arguments will get null
;;;     kukit.E = 'Nonexistent statevar ['+ key +'].';
        throw new Error(kukit.E);
    }
    return value;
};

};

/*
*  class _PassPP
*/
var _PassPP = function() {

this.check = function(args) {
;;; if (args.length != 1) {
;;;     throw new Error('pass method needs 1 argument [attrname].');
;;; }
};

this.eval = function(args, node, defaultParameters) {
    var key = args[0];
    var value = defaultParameters[key];
    if (typeof(value) == 'undefined') {
        // notfound arguments will get null
;;;     kukit.E = 'Nonexistent default parm ['+ key +'].';
        throw new Error(kukit.E);
    }
    return value;
};

};


/* The url() provider just passes the parameter, and is used to have
 * a different return type. It can be used in the line of action-server.
 * as an alternative to a separate kssUrl line.
 */
var _UrlPP = function() {
    this.check = function(args) {
;;;     if (args.length != 1) {
;;;         throw new Error('url() needs 1 argument');
;;;     }
    };
};
_UrlPP.prototype = new _IdentityPP();


/* The alias() provider just passes the parameter, and is used to have
 * a different return type. It can be used in the line of action-client.
 */
var _AliasPP = function() {
    this.check = function(args) {
;;;     if (args.length != 1) {
;;;         throw new Error('alias() needs 1 argument');
;;;     }
;;;     if (args[0].isMethod) {
;;;         kukit.E = 'Value providers are not ';
;;;         kukit.E += 'allowed as argument for ';
;;;         kukit.E += 'alias(), [' + args[0].methodName + '] found.';
;;;         throw new Error(kukit.E);
;;;     }
    };
};
_AliasPP.prototype = new _IdentityPP();


kukit.pprovidersGlobalRegistry = new kukit.pr.ValueProviderRegistry();

kukit.pprovidersGlobalRegistry.register('', _IdentityPP);
kukit.pprovidersGlobalRegistry.register('currentFormVar',
    _CurrentFormVarPP);
kukit.pprovidersGlobalRegistry.register('currentFormVarFromKssAttr',
    _CurrentFormVarFromKssAttrPP);
kukit.pprovidersGlobalRegistry.register('formVar', _FormVarPP);
kukit.pprovidersGlobalRegistry.register('kssAttr', _KssAttrPP);
kukit.pprovidersGlobalRegistry.register('stateVar', _StateVarPP);
kukit.pprovidersGlobalRegistry.register('pass', _PassPP);
kukit.pprovidersGlobalRegistry.register('nodeContent', _NodeContentPP);
kukit.pprovidersGlobalRegistry.register('nodeAttr', _NodeAttrPP);
// returnType = 'url'
kukit.pprovidersGlobalRegistry.register('url', _UrlPP, 'url');
// returnType = 'alias'
kukit.pprovidersGlobalRegistry.register('alias', _AliasPP, 'alias');

}();                              /// MODULE END


