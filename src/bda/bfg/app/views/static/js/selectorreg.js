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

kukit.sr = new function() {   /// MODULE START

var sr = this;

// Registry of the pprovider functions for selecting

sr.pproviderSelRegistry = new kukit.pr.ValueProviderRegistry();

/*
* class _AnyPP
*
* This will provide an arbitrary selector, and is designed to
* be used with the makeAnyPP factory function.
*
*/
var _AnyPP = function() {

this.check = function(args) {
    // check does not need to be used here actually.
//;;; if (args.length != 1) {
//;;;     throw new Error('internal error, xxxselector() needs 1 argument');
//;;; }
};
this.eval = function(args, node, defaultParameters) {
    var f = kukit.selectorTypesGlobalRegistry.get(this.selector_type);
    // We don't have orignode if we evaluate from here, consequently
    // the orignode parameter cannot be used from selectors. We pass
    // node just to be sure...
    return f(args[0], node, defaultParameters, node);
};

};

sr.pproviderSelRegistry.register('', _AnyPP);

sr.makeAnyPP = function(selector_type) {
    var pp = function () {};
    pp.prototype = new _AnyPP();
    pp.prototype.selector_type = selector_type;
    return pp;
};

/*
* class _AnyPP
*
* This can be used to pass a node programmatically
*
*/
var _PassnodePP = function() {

this.check =  function(args) {
;;; if (args.length != 1) {
;;;     throw new Error('passnode selector method needs 1 argument');
;;; }
};
this.eval = function(args, node, defaultParameters) {
    var value = defaultParameters[args[0]];
    if (typeof(value) == 'undefined') {
        // notfound arguments will get null
;;;     kukit.E = 'Nonexistent default parm "'+ key +'"';
        throw new Error(kukit.E);
    }
    nodes = [value];
    return nodes;
};

};
sr.pproviderSelRegistry.register('passnode', _PassnodePP, 'selection');


/* 
* class SelectorTypeRegistry 
*
*  available for plugin registration
*
*  usage:
*
*  kukit.selectorTypesGlobalRegistry.register(name, func);
*
*/
var _SelectorTypeRegistry = function () {

this.initialize = function() {
    this.mapping = {};
};

this.register = function(name, func) {
    if (typeof(func) == 'undefined') {
        throw new Error('Func is mandatory.');
    }
;;; if (this.mapping[name]) {
;;;    // Do not allow redefinition
;;;    kukit.logError('Error : redefinition attempt of selector ' + name);
;;;    return;
;;; }
    this.mapping[name] = func;
    // Also register the selector param provider
    var pp = sr.makeAnyPP(name);
    // register them with returnType = 'nodes'
    kukit.pprovidersGlobalRegistry.register(name, pp, 'selection');
};

this.get = function(name) {
    if (! name) {
        // if name is null or undefined or '',
        // we use the default type.
        name = this.defaultSelectorType;
    }
    var result = this.mapping[name];
;;; if (typeof(result) == 'undefined') {
;;;    throw new Error('Unknown selector type "' + name + '"');
;;; }
    return result;
};
this.initialize.apply(this, arguments);
};

_SelectorTypeRegistry.prototype.defaultSelectorType = 'css';


kukit.selectorTypesGlobalRegistry = new _SelectorTypeRegistry();

kukit.selectorTypesGlobalRegistry.register('htmlid', function(expr, node) {
    var nodes = [];
    var node = document.getElementById(expr);
    if (node) {
        nodes.push(node);
        }
    return nodes;
});

kukit.selectorTypesGlobalRegistry.register('css', function(expr, node) {
    // Always search globally
    var nodes = kukit.dom.cssQuery(expr);
    return nodes;
});

kukit.selectorTypesGlobalRegistry.register('samenode', function(expr, node) {
    nodes = [node];
    return nodes;
});

// Return a list of all nodes that match the css expression in the parent chain
kukit.selectorTypesGlobalRegistry.register('parentnode', function(expr, node) {
    var selectednodes = kukit.dom.cssQuery(expr);
    var parentnodes = [];
    var parentnode = node.parentNode;
    while(parentnode.parentNode) {
        parentnodes.push(parentnode);
        parentnode = parentnode.parentNode;
    }

    // Filter the nodes so that only the ones in the parent chain remain
    var results = [];
    for(var i=0; i<selectednodes.length; i++){
        var inchain = false;
        for(var j=0; j<parentnodes.length; j++){
            if(selectednodes[i] === parentnodes[j]){
                inchain = true;
            }
        }
        if(inchain){
            results.push(selectednodes[i]);
        }
    }
    return results;
});


}();                              /// MODULE END

