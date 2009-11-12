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

/*global kukit, document, window */

kukit = new function() {   /// MODULE START

var ku = this;

ku.isDevelMode = false;
;;; ku.isDevelMode = true;

var _isKineticStylesheet = function(node) {
    var rel = node.rel;
    if (rel=="kinetic-stylesheet") {
        return true;
    }
    // BBB to be removed after 2008-02-17
    if (rel=="kukit" || rel=="k-stylesheet") {
;;;     var msg = node.href + ': rel "' + rel +'" is deprecated;';
;;;     msg = msg + ' use "kinetic-stylesheet" instead.';
;;;     kukit.logWarning(msg);
        return true;
    }
    return false;
};

/*
* class _RuleSheetLink
*/
var _RuleSheetLink = function(href, res_type) {
    this.href = href;
    this.res_type = res_type;
};


/*
* class Engine
*/
ku.Engine = function() {

this.initialize = function() {
    this.documentRules = new kukit.rd.MethodTable();
    // table from res_type to rule processor
    this._ruleProcessorClasses = {};
    // register processor for type kss
    this._ruleProcessorClasses.kss = kukit.kssp.KssRuleProcessor;
    this._ruleProcessors = [];
    this.bindScheduler = new kukit.ut.SerializeScheduler();
    // State vars storage. This can be used from kss via a method.
    this.stateVariables = {};
    // instantiate request manager
    this.requestManager = new kukit.rm.RequestManager();
    this.binderInfoRegistry = new kukit.er.BinderInfoRegistry();
    // instantiate a load scheduler
    this.loadScheduler = new kukit.rd.LoadActions();
    this.initializedOnDOMLoad = false;
    // setup events queuing, collect them at the end of commands
    this.setupEventsQueue = [];
    this.setupEventsInProgress = false;
    this.baseUrl = this.calculateBase();
};

this.calculateBase = function() {
    var base = '';
    // returns empty base when not in browser (cli tests)
    try {
        var _dummy = document;
        _dummy = window;
    } catch (e) {
        // testing or what
        return base;
    }
    base = kukit.ut.calculateBase(document, window.location.href);
    return base;
};

this.getRuleSheetLinks = function() {
    var nodes = document.getElementsByTagName("link");
    var results = [];
    for (var i=0; i<nodes.length; i++) {
        if (_isKineticStylesheet(nodes[i])) {
            var res_type = null;
            // Resource syntax is decided on type attribute.
            if((nodes[i].type == 'text/css') || (nodes[i].type == 'text/kss')) {
                res_type = 'kss';
;;;         } else {
;;;             // Just show this, and go on with the processing.
;;;             kukit.logError("rel type is not text/css or text/kss");
            }
            var newRuleLink = new _RuleSheetLink(nodes[i].href, res_type);
            results[results.length] = newRuleLink;
        }
    }
    return results;
};

this.createRuleProcessor = function(rulelink) {
    var _RuleProcessorClass = this._ruleProcessorClasses[rulelink.res_type];
;;; var msg = '';
    if (_RuleProcessorClass) {
;;;     msg = "Start loading and processing " + rulelink.href;
;;;     msg = msg + " of type " + rulelink.res_type;
;;;     kukit.log(msg);
        var ruleprocessor = new _RuleProcessorClass(rulelink.href);
        this._ruleProcessors[this._ruleProcessors.length] = ruleprocessor;
        return ruleprocessor;
;;; } else {
;;;     msg = "Ignore rulesheet " + rulelink.href;
;;;     msg = msg + " of type " + rulelink.res_type;
;;;     kukit.log(msg);
    }
    return null;
};


this.getRules = function() {
    var rules = [];
    var ruleProcessors = this._ruleProcessors;
    for (var j=0; j<ruleProcessors.length; j++) {
        var ruleProcessor = ruleProcessors[j];
        for (var i=0; i<ruleProcessor.rules.length; i++) {
            rules.push(ruleProcessor.rules[i]);
        }
    }
    return rules;
};

this.getRuleProcessors = function() {
    return this._ruleProcessors;
};

this.setupEvents = function(inNodes) {
    if (this.setupEventsInProgress) {
        // remember them
        this.setupEventsQueue = this.setupEventsQueue.concat(inNodes);
    } else {
        // do it
        this.doSetupEvents(inNodes);
    }
};

this.beginSetupEventsCollection = function() {
    this.setupEventsInProgress = true;
};

this.finishSetupEventsCollection = function() {
    this.setupEventsInProgress = false;
    var setupEventsQueue = this.setupEventsQueue;
    this.setupEventsQueue = [];
    this.doSetupEvents(setupEventsQueue);
};

this.doSetupEvents = function(inNodes) {
    var self = this;
    var deferredEventsSetup = function() {
        self._setupEvents(inNodes);
    };
;;; var targetMsg;
    var found = false;
    if ( ! inNodes) {
;;;     targetMsg = 'document';
        found = true;
    } else {
;;;     targetMsg = 'nodes subtrees ';
        for (var i=0; i<inNodes.length; i++) {
            var node = inNodes[i];
            if (node.nodeType == 1) {
                if (! found) {
                    found = true;
;;;             } else {
;;;                 targetMsg += ', '; 
                }
;;;             targetMsg += '[' + node.tagName.toLowerCase() + ']';
            }
        }
    }
    if (found) {
        var remark = '';
;;;     remark += 'Setup of events for ' + targetMsg;
        this.bindScheduler.addPre(deferredEventsSetup, remark);
    }
};

this._setupEvents = function(inNodes) {
    // Decide phase. 1=initial, 2=insertion.
    var phase;
    if (typeof(inNodes) == 'undefined') {
        phase = 1;
    } else {
        phase = 2;
    }
    this.binderInfoRegistry.startBindingPhase();
;;; kukit.log('Selection of HTML nodes starts.');
    var rules = this.getRules();
    var ruletable = new kukit.rd.RuleTable(this.loadScheduler);
    for (var y=0; y < rules.length; y++) {
        rules[y].mergeForSelectedNodes(ruletable, phase, inNodes);
    }
;;; kukit.log('Binding of document starts.');
    if (phase == 1) {
        this.documentRules.bindall(phase);
    }
    // finally bind the merged events
;;; kukit.log('Binding of HTML nodes starts.');
    ruletable.bindall(phase);

    // ... and do the actual binding. 
    this.binderInfoRegistry.processBindingEvents();
};

this.initializeRules = function() {
;;; var msg = '';
    if (window.kukitRulesInitializing || window.kukitRulesInitialized) {
        // Refuse to initialize a second time.
;;;     kukit.log('[initializeRules] is called twice.');
        return;
    }
;;; kukit.log('Initializing kinetic stylesheets.');
    // Succesful initialization. At the moment the engine is kept
    // as a global variable, but this needs refinement in the future.
    kukit.engine = this;
    window.kukitRulesInitializing = true;
    // load the rulesheets
    var rulelinks = this.getRuleSheetLinks();
;;; kukit.log("Count of kinetic stylesheet links: " + rulelinks.length);
    for (var i=0; i<rulelinks.length; i++) {
        var rulelink = rulelinks[i];
        var ruleprocessor = this.createRuleProcessor(rulelink);
        if (ruleprocessor) {
;;;         var ts_start = (new Date()).valueOf();
            ruleprocessor.load();
;;;         var ts_loaded = (new Date()).valueOf();
            ruleprocessor.parse();
;;;         var ts_end = (new Date()).valueOf();
;;;         msg = "Finished loading and processing " + rulelink.href;
;;;         msg += " resource type " + rulelink.res_type;
;;;         msg += ' in ' + (ts_loaded - ts_start) + ' + ';
;;;         msg += (ts_end - ts_loaded) + ' ms.';
;;;         kukit.log(msg);
        }
    }
;;; try {
        this.setupEvents();
;;; } catch(e) {
;;;     // Event setup errors are logged.
;;;     if (e.name == 'RuleMergeError' || e.name == 'EventBindError') {
;;;        msg = 'Events setup - ' + e.toString();
;;;         // Log the message
;;;         kukit.logFatal(msg);
;;;         // and throw it...
;;;         throw new Error(msg);
;;;     } else {
;;;         throw e;
;;;     }
;;; }
    window.kukitRulesInitializing = false;
    window.kukitRulesInitialized = true;
};
this.initialize.apply(this, arguments);
};



/* XXX deprecated methods, to be removed asap 
 * (this was used from the plone plugin only, 
 * to allow the event-registration.js hook)
 */

ku.initializeRules = function() {
;;; var msg = '[kukit.initializeRules] is deprecated,';
;;; msg += 'use [kukit.bootstrap] instead !';
;;; kukit.logWarning(msg);
    kukit.bootstrap();
};

ku.bootstrap = function() {
;;; kukit.log('Instantiate engine.');
    var engine = new kukit.Engine();
;;; kukit.log('Engine instantiated.');
    // Successful initializeRules will store the engine as kukit.engine. 
    // Subsequent activations will not delete the already set up engine.
    // Subsequent activations may happen, if more event handlers are set up,
    // and the first one will do the job, the later ones are ignored.
    engine.initializeRules();
};

ku.bootstrapFromDOMLoad = function() {
;;; kukit.log('Engine instantiated in [DOMLoad].');
    var engine = new kukit.Engine();
    // Successful initializeRules will store the engine as kukit.engine. 
    // Subsequent activations will not delete the already set up engine.
    // Subsequent activations may happen, if more event handlers are set up,
    // and the first one will do the job, the later ones are ignored.
    engine.initializedOnDOMLoad = true;
    engine.initializeRules();
};

}();                              /// MODULE END

