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

kukit.cp = new function() {   /// MODULE START

var cp = this;

/*
* class CommandProcessor
*/
cp.CommandProcessor = function() {

this.initialize = function() {
    this.commands = new Array();
};

this.parseCommands = function(commands, transport) {
;;; kukit.log('Parsing commands.');
;;; kukit.logDebug('Number of commands : ' + commands.length + '.');
    for (var y=0;y < commands.length;y++) {
        var command = commands[y];
        this.parseCommand(command, transport);
        // If we receive an error command, we handle that separately.
        // We abort immediately and let the processError handler do its job.
        // This means that although no other commands should be in commands,
        // we make sure we execute none of them.
        var lastcommand = this.commands[this.commands.length-1];
        if (lastcommand.name == 'error') {
            // We have to throw an explicitError always, since we want
            // error fallbacks work both in production and development mode.
            throw kukit.err.explicitError(lastcommand);
        }
    }
};

this.parseCommand = function(command, transport) {
    var selector = "";
    var params = {};
    var name = "";

    selector = command.getAttribute("selector");
    name = command.getAttribute("name");
    type = command.getAttribute("selectorType");
    if (name == null)
        name = "";
    var childNodes = command.childNodes;
    for (var n=0;n < childNodes.length;n++) {
        var childNode = childNodes[n];
        if (childNode.nodeType != 1) 
            continue;
        if (childNode.localName) {
            if (childNode.localName.toLowerCase() != "param") {
                throw new Error('Bad payload, expected param');
            }
        } else {
            //IE does not know DOM2
            if (childNode.nodeName.toLowerCase() != "param") {
                throw new Error('Bad payload, expected param (IE)');
            }
        }        
        var data = childNode.getAttribute('name');
        if (data != null) { 
            // Decide if we have a string or a dom parameter
            var childCount = childNode.childNodes.length;
            var result;
            if (childCount == 0) {
                result = '';
            } else {
                // (we do not interpret html inline content any more)
                // we have a single text node
                // OR
                // we have a single CDATA node (HTML parameter CDATA-style)
;;;                 var isTextNode = childNode.firstChild.nodeType == 3;
;;;                 var isCData = childNode.firstChild.nodeType == 4;
;;;                 if (! (childCount == 1 && (isTextNode || isCData))) {
;;;                     kukit.E = 'Bad payload, expected a text or a CDATA node';
;;;                     throw new Error(kukit.E); 
;;;                 }
                // we consider this as html payload
                // The result is always a string from here.
                result = childNode.firstChild.nodeValue;
            }
            params[data] = result;
        } else {
            throw new Error('Bad payload, expected attribute "name"');
        }
    }
    var command = new kukit.cr.makeCommand(selector, name, type, params,
        transport);
    this.addCommand(command);
}; 

this.addCommand = function(command) {
    this.commands[this.commands.length] = command;
};

this.executeCommands = function(oper) {
    // node, eventRule, binder are given on oper, in case
    // the command was called up from an event
    if (typeof(oper) == 'undefined' || oper == null) {
        oper = new kukit.op.Oper();
    }
    var commands = this.commands;
    for (var y=0;y < commands.length;y++) {
        var command = commands[y];
;;;     try {
            command.execute(oper); 
;;;     } catch (e) {
;;;         if (e.name == 'RuleMergeError' || e.name == 'EventBindError') {
;;;             throw(e);
;;;         } else {
;;;             // augment the error message
;;;             throw kukit.err.commandExecutionError(e, command); 
;;;         }
;;;     }
    }
};
this.initialize.apply(this, arguments);
};

}();                              /// MODULE END

