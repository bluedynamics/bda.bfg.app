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

kukit.sa = new function() {   /// MODULE START

var sa = this;

// ServerActionBase is a non-initialize version of ServerAction
// this enables to subclass it or reuse its methods
sa.ServerActionBase = function() {

this.initialize = function(name, oper) {
    this.oper = oper;
    this.url = oper.kssParms.kssUrl;
    if (typeof(this.url) == 'undefined') {
        this.url = name;
    }
    this.url = this.calculateAbsoluteURL(this.url);
    this.notifyServer();
};

/* 
 * calculateAbsoluteURL
 *
 * Makes absolute site url
 * - if starts with http:// https:// : no change
 * - if starts with /: interprets absolute from domain
 * - otherwise: relative to current context
 */
this.calculateAbsoluteURL = function(url) {
    // XXX packer breaks on following regexp constant,
    // so it must be quoted
    if (url.match(RegExp("/^https?:\/\//"))) {
        // absolute already
        return url;
    }
    var absoluteMatch = url.match(RegExp(/^(\/)(.*)/));
    var path = kukit.engine.baseUrl;
    if (absoluteMatch) {
        // relative to domain
        var base = path.match(RegExp(/^(.*:\/\/[^\/]*)(\/?)/))[1];
        // base is like: http://foo.bar without trailing /
        url = base + url;
        return url;
    }
    // final case: relative to current url
    // (paranoia: add an / to the path *only* if it is
    // *not* there) 
    // XXX packer breaks on following
    // regexp constant, so it must be quoted
    if (! path.match(RegExp("/$"))) {
        path += '/';
    }
    url = path + url;
    return url;
};

// Backparameters can be used on command execution.
this.notifyServer = function() {
    var self = this;
    var sendHook = function(queueItem) {
        // store the queue reception on the oper
        self.oper.queueItem = queueItem;
        self.reallyNotifyServer();
    };
    var timeoutHook = function(queueItem) {
        // store the queue reception on the oper
        self.oper.queueItem = queueItem;
        self.processError('timeout');
    };
    kukit.engine.requestManager.notifyServer(sendHook, this.url, timeoutHook);
};

this.reallyNotifyServer = function() {
    // make a deferred callback
    var domDoc = new XMLHttpRequest();
    var self = this;
    var notifyServer_done  = function() {
        self.notifyServer_done(domDoc);
    };
    // convert params
    var query = new kukit.fo.FormQuery();
    for (var key in this.oper.parms) {
        query.appendElem(key, this.oper.parms[key]);
    }
    // also add the parms that result from submitting an entire form.
    // This is, unlike the normal parms, is a list. Keys and values are
    // added at the end of the query, without mangling names.
    var submitForm = this.oper.kssParms.kssSubmitForm;
    if (submitForm) {
        for (var i=0; i<submitForm.length; i++) {
            var item = submitForm[i];
            query.appendElem(item[0], item[1]);
        }
    }
    // encode the query
    var encoded = query.encode();
    // sending form
    var ts = new Date().getTime();
    //kukit.logDebug('TS: '+ts);
    var tsurl = this.url + "?kukitTimeStamp=" + ts;
    domDoc.open("POST", tsurl, true);
    domDoc.onreadystatechange = notifyServer_done;
    domDoc.setRequestHeader("Content-Type",
        "application/x-www-form-urlencoded");
    domDoc.send(encoded);
};

this.notifyServer_done = function(domDoc) {
//;;; var msg = 'Request readyState = ' + domDoc.readyState + '.';
//;;; kukit.logDebug(msg);
    if (domDoc.readyState == 4) {
        // notify the queue that we are done
        var success = this.oper.queueItem.receivedResult();
        // We only process if the response has not been timed
        // out by the queue in the meantime.
        if (success) {
            // catch the errors otherwise won't get logged.
            // In FF they seem to get swallowed silently.
            // We need these both in production and development mode,
            // since the erorr fallbacks are activated from processError.
            try {
                // process the results
                this.processResult(domDoc);
            } catch(e) {
;;;             if (e.name == 'RuleMergeError' || e.name == 'EventBindError') {
;;;                 throw kukit.err.eventSetupError(e);
;;;             } 
                if (e.name == 'ResponseParsingError') {
;;;                 kukit.E = 'Response parsing error: ' + e;
                    this.processError(kukit.E);
                } else if (e.name == 'ExplicitError') {
                    this.processError(e.info.kw.errorcommand);
                } else {
                    throw e;
                }
            }
        }
    };
};

this.processResult = function(domDoc) {
    // checking various dom process errors, and get the commands part
    var dom;
    var commandstags = [];
    // Let's process xml payload first:
    if (domDoc.responseXML) {
        dom = domDoc.responseXML;
        commandstags = kukit.dom.getNsTags(dom, 'commands');
        if (commandstags.length != 1) {
            // no good, maybe better luck with it as html payload
            dom = null;
        }
    }
    // Check for html too, this enables setting the kss error command on the 
    // error response.
    if (dom == null) {
        // Read the header and load it as xml, if defined.
        var payload = domDoc.getResponseHeader('X-KSSCOMMANDS');
        if (payload) {
            try {
                dom = (new DOMParser()).parseFromString(payload, "text/xml");
            } catch(e) {
;;;             kukit.E = 'Error parsing X-KSSCOMMANDS header.';
                throw kukit.err.responseParsingError(kukit.E);
            }
            commandstags = kukit.dom.getNsTags(dom, 'commands');
            if (commandstags.length != 1) {
                // no good
                dom = null;
            }
        }
        // Check for html too, this enables setting the kss error command on the 
        // error response.
        if (dom == null) {
            // Read the header and load it as xml, if defined.
            var payload = domDoc.getResponseHeader('X-KSSCOMMANDS');
            if (payload) {
                try {
                    dom = (new DOMParser()).parseFromString(payload, "text/xml");
                } catch(e) {
;;;                 kukit.E = 'Error parsing X-KSSCOMMANDS header.';
                    throw kukit.err.responseParsingError(kukit.E);
                }
                commandstags = kukit.dom.getNsTags(dom, 'commands');
                if (commandstags.length != 1) {
                    // no good
                    dom = null;
                }
            } else {
                // Ok. we have not found it either in the headers.
                // Check if there was a parsing error in the xml, 
                // and log it as reported from the dom
                // Opera <= 8.5 does not have the parseError attribute,
                // so check for it first
;;;             dom = domDoc.responseXML;
;;;             kukit.E = 'Unknown server error (invalid KSS response, no error';
;;;             kukit.E += ' info received)';
;;;             if (dom && dom.parseError && (dom.parseError != 0)) {
;;;                 kukit.E += ' : ' + Sarissa.getParseErrorText(dom);
;;;                 }
                throw kukit.err.responseParsingError(kukit.E);
            }
        }
        if (dom == null) {
            // this should not happen
;;;         kukit.E = 'Neither xml nor html payload.';
            throw kukit.err.responseParsingError(msg);
        }
        // find the commands (atm we don't limit ourselves inside the commandstag)
        var commands = kukit.dom.getNsTags(dom, 'command');
        // Warning, if there is a valid response containing 0 commands.
        if (commands.length == 0) {
;;;         kukit.log('No commands in kukit response');
            return;
        }
        // One or more valid commands to parse
        var command_processor = new kukit.cp.CommandProcessor();
        command_processor.parseCommands(commands, domDoc);
        kukit.engine.beginSetupEventsCollection();
        command_processor.executeCommands(this.oper);
        kukit.engine.finishSetupEventsCollection();
    };

    this.processError = function(errorcommand) {
        var error_action = null;
        if (this.oper.eventRule) {
            var error_action = this.oper.eventRule.actions.getErrorActionFor(
                this.oper.action);
            }
;;;     var reason = '';
;;;     if (typeof(errorcommand) == 'string') {
;;;         // not a command, just a string
;;;         reason = ', client_reason="' + errorcommand + '" ';
;;;     } else if (typeof(errorcommand) != 'undefined') {
;;;         // a real error command, sent by the server
;;;         // as kukit payload.
;;;         // this way the server sends whatever message he wants as a parameter
;;;         // to the error command.
;;;         reason = ', server_reason="' + errorcommand.parms.message + '" ';
;;;     }
        if (error_action) {
;;;         kukit.E = 'Request failed at url ' + this.oper.queueItem.url;
;;;         kukit.E += ', rid=' + this.oper.queueItem.rid + reason;
;;;         kukit.E += ', will be handled by action "' + error_action.name + '"';
;;;         kukit.logWarning(kukit.E);
            // Individual error handler was defined. Execute it!
            error_action.execute(this.oper);
        } else {
            // Ok. we have not found it either in the headers.
            // Check if there was a parsing error in the xml, 
            // and log it as reported from the dom
            // Opera <= 8.5 does not have the parseError attribute,
            // so check for it first
;;;         dom = domDoc.responseXML;
;;;         kukit.E = 'Unknown server error (invalid KSS response, no error';
;;;         kukit.E += ' info received)';
;;;         if (dom && dom.parseError && (dom.parseError != 0)) {
;;;             kukit.E += ' : ' + Sarissa.getParseErrorText(dom);
;;;             }
            throw kukit.err.responseParsingError(kukit.E);
        }
    }
    if (dom == null) {
        // this should not happen
;;;     kukit.E = 'Neither xml nor html payload.';
        throw kukit.err.responseParsingError(msg);
    }
    // find the commands (atm we don't limit ourselves inside the commandstag)
    var commands = kukit.dom.getNsTags(dom, 'command');
    // Warning, if there is a valid response containing 0 commands.
    if (commands.length == 0) {
;;;     kukit.log('No commands in kukit response');
        return;
    }
    // One or more valid commands to parse
    var command_processor = new kukit.cp.CommandProcessor();
    command_processor.parseCommands(commands, domDoc);
    kukit.engine.beginSetupEventsCollection();
    command_processor.executeCommands(this.oper);
    kukit.engine.finishSetupEventsCollection();
};

this.processError = function(errorcommand) {
    var error_action = null;
    if (this.oper.eventRule) {
        var error_action = this.oper.eventRule.actions.getErrorActionFor(
            this.oper.action);
        }
;;; var reason = '';
;;; if (typeof(errorcommand) == 'string') {
;;;     // not a command, just a string
;;;     reason = ', client_reason="' + errorcommand + '" ';
;;; } else if (typeof(errorcommand) != 'undefined') {
;;;     // a real error command, sent by the server
;;;     // as kukit payload.
;;;     // this way the server sends whatever message he wants as a parameter
;;;     // to the error command.
;;;     reason = ', server_reason="' + errorcommand.parms.message + '" ';
;;; }
    if (error_action) {
;;;     kukit.E = 'Request failed at url ' + this.oper.queueItem.url;
;;;     kukit.E += ', rid=' + this.oper.queueItem.rid + reason;
;;;     kukit.E += ', will be handled by action "' + error_action.name + '"';
;;;     kukit.logWarning(kukit.E);
        // Individual error handler was defined. Execute it!
        error_action.execute(this.oper);
    } else {
        // Unhandled: just log it...
;;;     kukit.E = 'Request failed at url ' + this.oper.queueItem.url;
;;;     kukit.E += ', rid=' + this.oper.queueItem.rid + reason;
;;;     kukit.logError(kukit.E);
;;;     return;
        // in case of no logging, we would like to throw an error.
        // This means user will see something went wrong.
        // XXX But: throwing an error on Firefox
        // _seems to be ineffective__
        // and throwing the error from IE
        // _throws an ugly window, "Uncaught exception"
        // TODO figure out something?
    }
};

};

sa.ServerAction = function() {
    this.initialize.apply(this, arguments);
};
sa.ServerAction.prototype = new sa.ServerActionBase();

}();                              /// MODULE END
