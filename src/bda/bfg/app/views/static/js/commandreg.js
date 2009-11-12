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

/* Command registration */

kukit.cr = new function() {   /// MODULE START

var cr = this;

/*
*  class _CommandRegistry
*/
var _CommandRegistry = function () {

this.initialize = function() {
    this.commands = {};
};

this.registerFromAction =
    function(srcname, factory, name) {
    if (typeof(name) == 'undefined') {
        // allows to set a different name as the action name,
        // usable for backward
        // compatibility setups
        name = srcname;
    }
    // register a given action as a command, using the given vactor
    var f = kukit.actionsGlobalRegistry.get(srcname);
    factory(name, f);
};

this.register = function(name, klass) {
    if (this.commands[name]) {
        // Do not allow redefinition
;;;     var msg = 'ValueError : command [' + name + '] is already registered.';
;;;     kukit.logError(msg);
        return;
        }
    this.commands[name] = klass;
};

this.get = function(name) {
    var klass = this.commands[name];
;;; if (! klass) {
;;;     // not found
;;;     var msg = 'ValueError : no command registered under [' + name + '].';
;;;     kukit.logError(msg);
;;;    }
    return klass;
};
this.initialize.apply(this, arguments);
};

/* 
* This is the proposed way of registration, as we like all commands to be
*  client actions first.
* 
*  Examples:
* 
*  kukit.actionsGlobalRegistry.register('log', f1);
*  kukit.commandsGlobalRegistry.registerFromAction('log',
*       kukit.cr.makeGlobalCommand);
* 
*  kukit.actionsGlobalRegistry.register('replaceInnerHTML', f2);
*  kukit.commandsGlobalRegistry.registerFromAction('replaceInnerHTML',
*       kukit.cr.makeSelectorCommand);
*/
kukit.commandsGlobalRegistry = new _CommandRegistry();


/* XXX deprecated methods, to be removed asap */

cr.commandRegistry = {};
cr.commandRegistry.registerFromAction = function(srcname, factory, name) {
;;;var msg = 'Deprecated kukit.cr.commandRegistry.registerFromAction,';
;;;msg += ' use kukit.commandsGlobalRegistry.registerFromAction instead! (';
;;;msg += srcname + ')';
;;;kukit.logWarning(msg);
    kukit.commandsGlobalRegistry.registerFromAction(srcname, factory, name);
};

/* Command factories */

cr.makeCommand = function(selector, name, type, parms, transport) {
    var commandClass = kukit.commandsGlobalRegistry.get(name);
    var command = new commandClass();
    command.selector = selector;
    command.name = name;
    command.selectorType = type;
    command.parms = parms;
    command.transport = transport;
    return command;
};

var _executeCommand = function(oper) {
    var newoper = oper.clone({
        'parms': this.parms,
        'orignode': oper.node,
        'node': null
        });
    this.executeOnScope(newoper);
};

var _executeCommandOnSelector = function(oper) {
    // if the selector type is null or undefined or '',
    // we use the default type.
    var selectorType = this.selectorType || 
                       kukit.selectorTypesGlobalRegistry.defaultSelectorType;
    // Use the provider registry to look up the selection provider.
    var providerClass = kukit.pprovidersGlobalRegistry.get(selectorType);
    // See if if is really a selection provider.
    if (providerClass.prototype.returnType != 'selection') {
        kukit.E = 'Undefined selector type [' + selectorType + '], ';
        kukit.E = 'it exists as provider but it does not return a selection.';
        throw new Error(kukit.E);
    }
    // Instantiate it
    var provider = new providerClass();
    var args = [this.selector];
;;; // Check the provider first.
;;; provider.check(args);
    // When evaluating the provider, the original event target will be used
    // as a starting point for the selection.
    // args will contain a single item, since the server side currently
    // cannot marshall selectors with more parameters
    // defaultParameters will be empty when using from commands.
    var nodes = provider.eval(args, oper.orignode, {});
    //
;;;var printType;
;;;if (this.selectorType) {
;;;    printType = this.selectorType;
;;;} else {
;;;    printType = 'default (';
;;;    printType += kukit.selectorTypesGlobalRegistry.defaultSelectorType;
;;;    printType += ')';
;;;}
;;;var msg = 'Selector type [' + printType + '], selector [';
;;;msg += this.selector + '], selected nodes [' + nodes.length + '].';
;;;kukit.logDebug(msg);
;;;if (!nodes || nodes.length == 0) {
;;;    kukit.logWarning('Selector found no nodes.');
;;;}
    for (var i=0;i < nodes.length;i++) {
        oper.node = nodes[i];
        //XXX error handling for wrong command name
;;;    kukit.logDebug('[' + this.name + '] execution.');
        this.executeOnSingleNode(oper);
    }
};

cr.makeSelectorCommand = function(name, executeOnSingleNode) {
    var commandClass = function() {
        this.execute = _executeCommand;
        this.executeOnScope = _executeCommandOnSelector;
        this.executeOnSingleNode = executeOnSingleNode;
        };
    kukit.commandsGlobalRegistry.register(name, commandClass); 
};

cr.makeGlobalCommand = function(name, executeOnce) {
    var commandClass = function() {
        this.execute = _executeCommand;
        this.executeOnScope = executeOnce;
        this.executeOnSingleNode = executeOnce;
        };
    kukit.commandsGlobalRegistry.register(name, commandClass); 
};

}();                              /// MODULE END

