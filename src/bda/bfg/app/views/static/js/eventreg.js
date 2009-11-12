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

kukit.er = new function() {   /// MODULE START

var er = this;

var _eventClassCounter = 0;

/*
*
* class _EventRegistry
*
* available for plugin registration
*
* usage:
*
* kukit.eventsGlobalRegistry.register(namespace, eventName, func, 
*    bindMethodName, defaultActionMethodName);
* 
* namespace = null: means global namespace
* defaultActionMethodName = null: if there is no default action implemented
* klass must be a class (constructor) function, this is the class that
*     implements the binder.
*
*/
var _EventRegistry = function() {

this.initialize = function() {
    this.content = {};
    this.classes = {};
    this.eventSets = [];
};

/* binder registration */

this.registerBinder = function(klass) {
    if (typeof(klass) == 'undefined') {
;;;     kukit.E = 'klass argument is mandatory when registering an event';
;;;     kukit.E += ' binder (_EventRegistry.registerBinder).';
        throw new Error(kukit.E);
    }
    // See if we are set up already?
    // We make a mark not on the class prototype,
    // but on the class itself. This will make
    // sure inherited classes get a distinct class name.
    if (klass.__decorated_for_kss__) {
        return;
    }
    // We do _not_ overwrite the class's prototype, since
    // that destroys any inheritance it has. Our purpose
    // is to allow any javascript class to function, so
    // we copy the class's attributes to the prototype.
    var binder_prototype = new _EventBinder();
    for (var key in binder_prototype) {
        klass.prototype[key] = binder_prototype[key];
    }
    // Create a className, and register it too.
    //
    // The reason to create a __className__ is to provide a
    // way to lookup the class by a string. This is needed
    // because dict keys in javascript can only be strings.
    className = '' + _eventClassCounter;
    _eventClassCounter += 1;
    klass.prototype.__className__ = className;
    this.classes[className] = klass;
    // mark decorated. We store the class there
    // so we can decide if this class has been
    // decorated or not.
    klass.__decorated_for_kss__ = true;
};

this.existsBinder = function(className) {
    var klass = this.classes[className];
    return (typeof(klass) != 'undefined');
};

this.getBinderClass = function(className) {
    var klass = this.classes[className];
    if (! klass) {
        // not found
;;;     kukit.E = 'Error : undefined event setup type [' + className + '].';
        throw new Error(kukit.E);
        }
    return klass;
};

/* events (methods) registration  helpers (not to be called directly) */

this._register = function(namespace, eventName, klass,
        bindMethodName, defaultActionMethodName, iterName) {
    if (typeof(defaultActionMethodName) == 'undefined') {
;;;     kukit.E = 'Missing arguments when calling [_EventRegistry.register].';
        throw new Error(kukit.E);
    }
    // Register and decorate the binder's class.
    this.registerBinder(klass);
    if (!eventName) {
;;;     kukit.E = '[eventName] argument cannot be empty when registering';
;;;     kukit.E += ' an event with [_EventRegistry.register].';
        throw new Error(kukit.E);
    }
    var key = this._getKey(namespace, eventName);
    var entry = this.content[key];
    if (typeof(entry) != 'undefined') {
        if (key[0] == '-') {
            key = key.substring(1);
        }
;;;     kukit.E = 'Attempt to register key [' + key;
;;;     kukit.E += '] twice when registering';
;;;     kukit.E += ' an event with [_EventRegistry.register].';
        throw new Error(kukit.E);
    }
    // XXX We do not check bindMethodName and defaltActionMethodName
    // here, because at this point they may be hidden by closure.
    // 
    // check the iterator.
    if  (! er.getBindIterator(iterName)) {
;;;     kukit.E = 'In _EventRegistry.register unknown bind iterator [';
;;;     kukit.E += iterName + '].';
        throw new Error(kukit.E);
    }
    // register it
    this.content[key] = {
        'className': className,
        'bindMethodName': bindMethodName,
        'defaultActionMethodName': defaultActionMethodName,
        'iterName': iterName
        };
};

/* events (methods) binding [ForAll] registration */

this._registerEventSet =
    function(namespace, names, iterName, bindMethodName) {
    // At this name the values should be checked already. so this should
    // be called _after_ _register.
    this.eventSets.push({
        'namespace': namespace, 
        'names': names,
        'iterName': iterName,
        'bindMethodName': bindMethodName
        });
};

/* there are the actual registration methods, to be called from plugins */

this.register =
    function(namespace, eventName, klass, bindMethodName,
        defaultActionMethodName) {
    this._register(namespace, eventName, klass, bindMethodName,
        defaultActionMethodName, 'EachLegacy');
    this._registerEventSet(namespace, [eventName], 'EachLegacy',
        bindMethodName);
};

this.unregister =
    function(namespace, eventName) {
    var key = this._getKey(namespace, eventName);
    delete this.content[key];
    var found = null;
    for (var i=0; i < this.eventSets.length; i++) {
        var eventSet = this.eventSets[i];
        if (eventSet['namespace'] == namespace) {
            found = i;
            break;
        }
    }
    if (found != null) {
        this.eventSets.splice(found, 1);
    }
};

this.registerForAllEvents =
    function(namespace, eventNames, klass,
        bindMethodName, defaultActionMethodName, iterName) {
    if (typeof(eventNames) == 'string') {
        eventNames = [eventNames];
        }
    for (var i=0; i<eventNames.length; i++) {
        var eventName = eventNames[i];
        this._register(namespace, eventName, klass, bindMethodName, 
            defaultActionMethodName, iterName);
    }
    this._registerEventSet(namespace, eventNames, iterName, bindMethodName);
};

this._getKey = function(namespace, eventName) {
    if (namespace == null) {
        namespace = '';
    } else if (namespace.split('-') > 1) {
;;;     kukit.E = 'In [_EventRegistry.register], [namespace] cannot have';
;;;     kukit.E += 'dashes.';
        throw new Error(kukit.E);
    }
    return namespace + '-' + eventName;
};

this.exists = function(namespace, eventName) {
    var key = this._getKey(namespace, eventName);
    var entry = this.content[key];
    return (typeof(entry) != 'undefined');
};

this.get = function(namespace, eventName) {
    var key = this._getKey(namespace, eventName);
    var entry = this.content[key];
    if (typeof(entry) == 'undefined') {
;;;     if (key.substr(0, 1) == '-') {
;;;         key = key.substring(1);
;;;         kukit.E = 'Error : undefined global event [';
;;;         kukit.E += key + '] (or maybe namespace is missing ?).';
;;;     } else {
;;;         kukit.E = 'Error : undefined namespace or event in [' + key + '].';
;;;     }
        throw new Error(kukit.E);
    } 
    return entry;
};

this.getBinderClassByEventNamespace = function(namespace, eventName) {
   return this.getBinderClass(this.get(namespace, eventName).className);
};
this.initialize.apply(this, arguments);
};


kukit.eventsGlobalRegistry = new _EventRegistry();

/* XXX deprecated methods, to be removed asap */

var _eventRegistry = function() {
    this.register = function(namespace, eventName, klass,
            bindMethodName, defaultActionMethodName) {
;;;     var msg = 'Deprecated _eventRegistry.register,';
;;;     msg += ' use kukit.eventsGlobalRegistry.register instead ! [';
;;;     msg += namespace + '-' + eventName + '].';
;;;     kukit.logWarning(msg);
        kukit.eventsGlobalRegistry.register(namespace, eventName, klass,
            bindMethodName, defaultActionMethodName);
    };
};

/*
*
* class _LateBinder
*
* postpone binding of actions until called first time
*
*/
var _LateBinder = function() {

this.initialize = function(binder, name, node) {
    this.binder = binder;
    this.name = name;
    this.node = node;
    this.boundEvent = null;
};

this.executeActions = function() {
    if (! this.boundEvent) {
;;;     var msg = 'Attempt of late binding for event [' + this.name;
;;;     msg += '], node [' + this.node.nodeName + '].';
;;;     kukit.log(msg);
        if (kukit.hasFirebug) {
            kukit.log(this.node);
        }
        var info = kukit.engine.binderInfoRegistry.getBinderInfoById(
            this.binder.__binderId__);
        var oper = info.bound.getBoundOperForNode(this.name, this.node);
        if (oper) {
            // (if eventRule is null here, we could still have the default
            // method, so go on.)
            oper.parms = {};
            this.boundEvent = function() {
                this.binder.triggerEvent(this.name, oper);
            };
;;;         kukit.log('Node bound.');
        } else {
;;;         kukit.logWarning('No node bound.');
            this.boundEvent = function() {};
        }
    }
    this.boundEvent();
};        
this.initialize.apply(this, arguments);
};

/*
*
* class _EventBinder
*
* Provide callins on the state instance that execute a given
*  continuation event.
*  Parameters will be the ones specified in the call + 
*  those defined in the rule will be added too. (Parameters can
*  be accessed with the [pass] kss parameter provider.)
*
* Call examples: 
*
* trigger an event bound to a given state instance, same node
*
*     binder.continueEvent('doit', oper.node, {'extravalue': '5'});
*
*   with kss rule:
*
*     node.selector:doit {
*         action-client: log;
*         log-message: pass(extravalue);
*     }
*
*  or
*
*     behaviour.selector:doit {
*         action-client: log;
*         log-message: pass(extravalue);
*     }
*
* trigger an event bound to a given state instance, and the document
* (different from current scope)
*
*     binder.continueEvent('doit', null, {'extravalue': '5'});
*
*   with kss rule:
*
*     document:doit {
*         action-client: log;
*         log-message: pass(extravalue);
*     }
*
*  or
*
*     behaviour.selector:doit {
*         action-client: log;
*         log-message: pass(extravalue);
*     }
*
* trigger an event on all the nodes + document bound to a given state instance
*
*     binder.continueEventAllNodes('doit', {'extravalue': '5'});
*
*   with kss rule:
*
*     node.selector:doit {
*         action-client: log;
*         log-message: pass(extravalue);
*     }
*
* p.s. oper is not required to make it easy to adapt existing code
* so we create a new oper below
*/

var _EventBinder = function() {

this.continueEvent = function(name, node, defaultParameters) {
    // Trigger a continuation event bound to a given state instance, given node
    // (or on document, if node = null)
    //
    var oper = new kukit.op.Oper();
    oper.node = node;
    if (node) {
        // if we found the binding, just use that
        var info = kukit.engine.binderInfoRegistry.getBinderInfoById(
            this.__binderId__);
        var newOper = info.bound.getBoundOperForNode(name, node);
        if (newOper) {
            oper = newOper;
        }
    } else {
        oper.eventRule =  kukit.engine.documentRules.getMergedRule(
            'document', name, this);
    }
    // Look up the behaviour rule, if any.
    var behav_eventRule =  kukit.engine.documentRules.getMergedRule(
        'behaviour', name, this);
    if (behav_eventRule) {
        if (! oper.eventRule) {
            // There was no node matching for the rule, use behaviour rule
            // this allows to set up parametrized actions in general.
            oper.eventRule = behav_eventRule;
        } else {
            // XXX this case should go away, as we should check
            // this already from binding time
            // and signal the appropriate error.
            // Also note that behaviour roles will only be allowed
            // for "non-binding" events.
;;;         var msg = 'Behaviour rule for continuation event [' + name;
;;;         msg += '] will be ignored, because we found an explicit rule.';
;;;         kukit.logError(msg);
        }
    }
    // If parms are specified in the call, use them.
    if (typeof(defaultParameters) != 'undefined') {
        oper.defaultParameters = defaultParameters;
    } else {
        oper.defaultParameters = {};
    }
    // if eventRule is null here, we can yet have the default method, so go on.
    this.triggerEvent(name, oper);
;;; kukit.logDebug('Continuation event [' + name + '] executed on same node.');
};

this.__continueEvent__ = function(name, node, defaultParameters) {
;;; var msg = 'Deprecated [__continueEvent__],';
;;; msg += 'use [continueEvent] instead !';
;;; kukit.logWarning(msg);
    this.continueEvent(name, node, defaultParameters);
};

this.continueEventAllNodes = function(name, defaultParameters) {
    // Trigger an event bound to a given state instance, on all nodes.
    // (or on document, if node = null)
    // if no other nodes execute.
    var executed = 0;
    // Normal rules. If any of those match, execute them too
    // each on the node that it selects - not on the original node.
    var oper = new kukit.op.Oper();
    var info = kukit.engine.binderInfoRegistry.getBinderInfoById(
        this.__binderId__);
    var opers = info.bound.getBoundOpers(name);
    for (var i=0; i<opers.length; i++) {
        var oper = opers[i];
        var newOper = oper.clone();
        if (typeof(defaultParameters) != 'undefined') {
            newOper.defaultParameters = defaultParameters;
        } else {
            newOper.defaultParameters = {};
        }
        this.triggerEvent(name, newOper);
        executed += 1;
    }
;;; kukit.logDebug('Event [' + name + '] executed on ' + executed + ' nodes.');
};

this.__continueEvent_allNodes__ = function(name, defaultParameters) {
;;; var msg = 'Deprecated [__continueEvent_allNodes__],';
;;; msg += 'use [continueEventAllNodes] instead !';
;;; kukit.logWarning(msg);
    this.continueEventAllNodes(name, defaultParameters);
};

this.makeFuncToBind = function(name, node) {
   var executor = new er._LateBinder(this, name, node);
   return function() {
       executor.executeActions();
   };
};

this.__makeFuncToBind__ = function(name, node) {
;;; var msg = 'Deprecated [__makeFuncToBind__],';
;;; msg += 'use [makeFuncToBind] instead !';
;;; kukit.logWarning(msg);
    this.makeFuncToBind(name, node);
};

this.triggerEvent = function(name, oper) {
    // Private. Called from continueEvent or from main event execution.
    oper.binder = this;
    if (oper.eventRule) {
        // Call the actions, if we had an event rule.
        // This includes calling the default action.
        oper.eventRule.actions.execute(oper);
    } else {
        // In case there is no event rule, just call the default event action.
        var namespace = this.__eventNamespace__;
;;;     var msg = 'Calling implicit event [' + name + '] on namespace [';
;;;     msg += namespace + '].';
;;;     kukit.logDebug(msg);
        var success = oper.executeDefaultAction(name, true);
        if (! success) {
            // instead of the standard message give more specific reason:
            // either way we should have executed something...
;;;         kukit.E = 'Could not trigger event name [' + name;
;;;         kukit.E += '] on namespace [' + namespace;
;;;         kukit.E += '], because there is neither an explicit KSS rule,';
;;;         kukit.E += ' nor a default method';
            throw new Error(kukit.E);
        }
    }
};

this._EventBinder_triggerEvent = function(name, oper) {
;;; var msg = 'Deprecated [_EventBinder_triggerEvent],';
;;; msg += 'use [triggerEvent] instead !';
;;; kukit.logWarning(msg);
    this.triggerEvent(name, oper);
};

/* (default) method call handling */

this.callMethod = function(namespace, name, oper, methodName) {
    // hidden method for calling just a method and checking that is exists.
    // (called from oper)
    var method = this[methodName];
    if (! method) {
;;;     kukit.E = 'Could not trigger event name [' + name;
;;;     kukit.E += '] on namespace [' + namespace;
;;;     kukit.E += '], because the method [' + methodName + '] does not exist.';
        throw new Error(kukit.E);
    }
    // call it
    oper.binder = this;
    method.call(this, name, oper);
};

this._EventBinder_callMethod = function(namespace, name, oper, methodName) {
;;; var msg = 'Deprecated [_EventBinder_callMethod],';
;;; msg += 'use [callMethod] instead !';
;;; kukit.logWarning(msg);
    this.callMethod(namespace, name, oper, methodName);
};

};

/* Event instance registry 
*
* class BinderInfoRegistry
*
*  used in run-time to keep track of the event instances
*
*/
er.BinderInfoRegistry = function() {

this.initialize = function() {
    this.info = {};
};

this.getOrCreateBinderInfo =
    function (id, className, namespace) {
    // Get or create the event.
    var binderInfo = this.info[id];
    if (typeof(binderInfo) == 'undefined') {
        // Create a new event.
;;;     var msg = 'Instantiating event id [' + id + '], className [';
;;;     msg += className + '], namespace [' + namespace + '].';
;;;     kukit.logDebug(msg);
        var binderClass = kukit.eventsGlobalRegistry.getBinderClass(className);
        var binder = new binderClass();
        
        binderInfo = this.info[id] = new _BinderInfo(binder);

        // decorate it with id and class
        binder.__binderId__ = id;
        binder.__binderClassName__ = className;
        binder.__eventNamespace__ = namespace;
        // store the bound rules
        //binder.__bound_rules__ = [];
    } else if (binderInfo.getBinder().__binderClassName__ != 
        className) {
        // just paranoia
;;;     kukit.E = 'Conflicting class for event id [' + id + '], [';
;;;     kukit.E += binderInfo.getBinder().__binderClassName__;
;;;     kukit.E += '] != [' + className + '].';
        throw new Error(kukit.E);
    }
    return binderInfo;
};

this.getBinderInfoById = function (id) {
    // Get an event.
    var binderInfo = this.info[id];
    if (typeof(binderInfo) == 'undefined') {
;;;     kukit.E = 'Event with id [' + id + '] not found.';
        throw new Error(kukit.E);
    }
    return binderInfo;
};

this.getSingletonBinderInfoByName =
    function (namespace, name) {
    //Get className
    var className = kukit.eventsGlobalRegistry.get(namespace, name).className;
    // Get an event.
    var id = er.makeId(namespace, className);
    var binderInfo = this.info[id];
    if (typeof(binderInfo) == 'undefined') {
;;;     kukit.E = 'Singleton event with namespace [' + namespace;
;;;     kukit.E += '] and (event) name [' + name + '] not found.';
        throw new Error(kukit.E);
    }
    return binderInfo;
};

this.startBindingPhase = function () {
    // At the end of the binding phase, we want to process our events. This
    // must include all the binder instances we bound in this phase.
    for (var id in this.info) {
        var binderInfo = this.info[id];
        // process binding on this instance.
        binderInfo.startBindingPhase();
    }
};

this.processBindingEvents = function () {
    // At the end of the binding phase, we want to process our events. This
    // must include all the binder instances we bound in this phase.
    for (var id in this.info) {
        var binderInfo = this.info[id];
        // process binding on this instance.
        binderInfo.processBindingEvents();
    }
};
this.initialize.apply(this, arguments);
};

/*
* class _BinderInfo
*
* Information about the given binder instance. This contains the instance and
* various binding info. Follows the workflow of the binding in different stages.
*
*/
var _BinderInfo = function() {

this.initialize = function(binder) {
    this.binder = binder;
    this.bound = new _OperRegistry();

    this.getBinder = function () {
        return this.binder;
    };

    this.startBindingPhase = function () {
        // The binding phase starts and it has the information for
        // the currently on-bound events.
        this.binding = new _OperRegistry();
    };

    this.bindOper = function (oper) {
        // We mark a given oper. This means a binding on the binder 
        // for given event, node and eventRule (containing event namespace,
        // name, and evt- parms.)
        //
        // first see if it can go to already bound ones
        this.bound.checkOperBindable(oper);
        // then register it properly to the binding events
        this.binding.bindOper(oper);
    };

    this.processBindingEvents = function () {
        // We came to the end of the binding phase. Now we process all our binding
        // events, This will do the actual binding on the browser side.
        this.binding.processBindingEvents(this.binder);
        // Now we to add these to the new ones.
        this.binding.propagateTo(this.bound);
        // Delete them from the registry, to protect against accidents.
        this.binding = null;
    };

    this.startBindingPhase();
};

this.getBinder = function () {
    return this.binder;
};

this.startBindingPhase = function () {
    // The binding phase starts and it has the information for
    // the currently on-bound events.
    this.binding = new _OperRegistry();
};

this.bindOper = function (oper) {
    // We mark a given oper. This means a binding on the binder 
    // for given event, node and eventRule (containing event namespace,
    // name, and evt- parms.)
    //
    // first see if it can go to already bound ones
    this.bound.checkOperBindable(oper);
    // then register it properly to the binding events
    this.binding.bindOper(oper);
};

this.processBindingEvents = function () {
    // We came to the end of the binding phase. Now we process all our binding
    // events, This will do the actual binding on the browser side.
    this.binding.processBindingEvents(this.binder);
    // Now we to add these to the new ones.
    this.binding.propagateTo(this.bound);
    // Delete them from the registry, to protect against accidents.
    this.binding = null;
};
this.initialize.apply(this, arguments);
};

var _iterators = {};

    // This calls the bind method by each bound oper one by one.
    // Eventname and funcToBind are passed too.
    // this is the legacy ([EachLegacy]) way
    _iterators['EachLegacy'] = 
        function (eventSet, binder) {
        for (var i=0; i<eventSet.names.length; i++) {
            var rulesPerName = this.infoPerName[eventSet.names[i]];
            if (typeof(rulesPerName) != 'undefined') {
                for (var nodeHash in rulesPerName) {
                    var oper = rulesPerName[nodeHash];
                    var eventName = oper.getEventName();
                    var funcToBind = oper.makeExecuteActionsHook();
                    this.callBindMethod(eventSet, binder, eventName,
                        funcToBind, oper);
                }
            }
        }
    };

    // This calls the bind method by each bound oper one by one.
    // Eventname and funcToBind are passed too.
    // this is the preferred ([Each]) way. Parameters are different from EachLegacy.
    _iterators['Each'] = 
        function (eventSet, binder) {
        for (var i=0; i<eventSet.names.length; i++) {
            var rulesPerName = this.infoPerName[eventSet.names[i]];
            if (typeof(rulesPerName) != 'undefined') {
                for (var nodeHash in rulesPerName) {
                    var oper = rulesPerName[nodeHash];
                    this.callBindMethod(eventSet, binder, oper);
                }
            }
        }
    };

    // This calls the bind method by the list of bound opers
    _iterators['Opers'] = 
        function (eventSet, binder) {
        var opers = [];
        for (var i=0; i<eventSet.names.length; i++) {
            var rulesPerName = this.infoPerName[eventSet.names[i]];
            if (typeof(rulesPerName) != 'undefined') {
                for (var nodeHash in rulesPerName) {
                    opers.push(rulesPerName[nodeHash]);
                }
            }
        }
        this.callBindMethod(eventSet, binder, opers);
    };

    // This calls the bind method by a mapping eventName:oper
    // per each bound node individually
    _iterators['Node'] = 
        function (eventSet, binder) {
        for (var nodeHash in this.infoPerNode) {
            var rulesPerNode = this.infoPerNode[nodeHash];
            // filter only the events we are interested in
            var filteredRules = {};
            var operFound = false;
            for (var i=0; i<eventSet.names.length; i++) {
                var name = eventSet.names[i];
                var oper = rulesPerNode[name];
                if (typeof(oper) != 'undefined') {
                    filteredRules[name] = oper;
                    operFound = oper;
                }
            }
            // call it
            // All opers have the same node, the last one is yet in operFound, so
            // we use it as a second parameter to the call.
            // The method may or may not want to use this.
            if (operFound) {
                this.callBindMethod(eventSet, binder, filteredRules,
                    operFound.node);
            }
        }
    };

    // This calls the bind method once per instance, by a list of
    // items, where item.node is the node and item.opersByEventName nodeHash:item
    // in item there is item.node and item.opersByEventName
    _iterators['AllNodes'] = 
        function (eventSet, binder) {
        var items = [];
        var hasResult = false;
        for (var nodeHash in this.infoPerNode) {
            var rulesPerNode = this.infoPerNode[nodeHash];
            // filter only the events we are interested in
            var filteredRules = {};
            var operFound = false;
            for (var i=0; i<eventSet.names.length; i++) {
                var name = eventSet.names[i];
                var oper = rulesPerNode[name];
                if (typeof(oper) != 'undefined') {
                    filteredRules[name] = oper;
                    operFound = oper;
                }
            }
            if (operFound) {
                var item = {node: operFound.node, 
                    opersByEventName: filteredRules};
                items.push(item);
                hasResult = true;
            }
        }
        // call the binder method
        if (hasResult) {
            this.callBindMethod(eventSet, binder, items);
        }
    };

// Iterators
// The getBindIterator returns a function that gets executed on
// the oper registry.
//
// Iterators receive the eventSet as a parameter
// plus a binder and a method. They need to iterate by calling this
// as method.call(binder, ...); where ... can be any parms this
// given iteration specifies.
//

er.getBindIterator = function(iterName) {
    // attempt to find canonical version of string
    // and shout if it does not match.
    // String must start uppercase.
    var canonical = iterName.substring(0, 1).toUpperCase() + 
            iterName.substring(1);
    // Special case: allnodes -> AllNodes, not handled by
    // the previous line
    if (canonical == 'Allnodes') {
        canonical = 'AllNodes';
    }
    if (iterName != canonical) {
        // BBB 2007.12.31, this will turn into an exception.
;;;     var msg = 'Deprecated the lowercase iterator names in last ';
;;;     msg += 'parameters of ';
;;;     msg += 'kukit.eventsGlobalRegistry.registerForAllEvents, use [';
;;;     msg += canonical + '] instead of [' + iterName + '] (2007-12-31)';
;;;     kukit.logWarning(msg);
        iterName = canonical;
        }
    return _iterators[iterName];
};

/*
* class _OperRegistry
*
* OperRegistry is associated with a binder instance in the 
* BinderInfoRegistry, and remembers bounding information.
* This is used both to remember all the bindings for a given
* instance, but also just to remember the bindings done during
* a given event setup phase.
*
*/
var _OperRegistry = function() {

this.initialize = function() {
    this.infoPerName = {};
    this.infoPerNode = {};
};

// XXX we can do this without full cloning, more efficiently.
this.propagateTo = function (newreg) {
    for (var key in this.infoPerName) {
        var rulesPerName = this.infoPerName[key];
        for (var name in rulesPerName) {
            var oper = rulesPerName[name];
            newreg.bindOper(oper);
        }
    }
};

this.checkOperBindable =
    function (oper, name, nodeHash) {
    // Check if the binding with this oper could be done.
    // Throw exception otherwise.
    //
    // Remark. We need  different check and bind method,
    // because we need to bind to the currently
    // processed nodes, but we need to check duplication 
    // in all the previously bound nodes.
    var info = this.infoPerName;
    // name and nodeHash are for speedup.
    if (typeof(nodeHash) == 'undefined') {
        name = oper.eventRule.kssSelector.name;
        nodeHash = kukit.rd.hashNode(oper.node);
    }
    var rulesPerName = info[name];
    if (typeof(rulesPerName) == 'undefined') {
        // Create an empty list.
        rulesPerName = info[name] = {};
    } else if (typeof(rulesPerName[nodeHash]) != 'undefined') {
;;;     kukit.E = 'Mismatch in bind registry,[ ' + name;
;;;     kukit.E += '] already bound to node in this instance.'; 
        throw new Error(kukit.E);
    }
    return rulesPerName;
};
    
this.bindOper = function (oper) {
    // Marks binding between binder, eventName, node.
    var name = oper.eventRule.kssSelector.name;
    var nodeHash = kukit.rd.hashNode(oper.node);
    var rulesPerName = this.checkOperBindable(oper, name, nodeHash);
    rulesPerName[nodeHash] = oper;
    // also store per node info
    var rulesPerNode = this.infoPerNode[nodeHash];
    if (typeof(rulesPerNode) == 'undefined') {
        // Create an empty list.
        rulesPerNode = this.infoPerNode[nodeHash] = {};
    }
    rulesPerNode[name] = oper;
};

// XXX This will need refactoring.
/// We would only want to lookup from our registry and not the other way around.
this.processBindingEvents = 
    function (binder) {
    var eventRegistry = kukit.eventsGlobalRegistry;
    for (var i=0; i < eventRegistry.eventSets.length; i++) {
        var eventSet = eventRegistry.eventSets[i];
        // Only process binding events (and ignore non-binding ones)
        if (eventSet.bindMethodName) {
            if (binder.__eventNamespace__ == eventSet.namespace) {
                // Process the binding event set.
                // This will call the actual bindmethods
                // according to the specified iterator.
                var iterator = er.getBindIterator(eventSet.iterName);
                iterator.call(this, eventSet, binder);
            }
        }
    }
};

// XXX The following methods will probably disappear as iterators 
// replace their functionality.

this.getBoundOperForNode = function (name, node) {
    // Get the oper that is bound to a given eventName
    // to a node in this binder
    // returns null, if there is no such oper.
    var rulesPerName = this.infoPerName[name];
    if (typeof(rulesPerName) == 'undefined') {
        return null;
    }
    var nodeHash = kukit.rd.hashNode(node);
    var oper = rulesPerName[nodeHash];
    if (typeof(oper) == 'undefined') {
        return null;
    }
    // Return it
    return oper;
};

this.getBoundOpers = function (name) {
    // Get the opers bound to a given eventName (to any node)
    // in this binder
    var opers = [];
    var rulesPerName = this.infoPerName[name];
    if (typeof(rulesPerName) != 'undefined') {
        // take the values as a list
        for (var nodeHash in rulesPerName) {
            opers.push(rulesPerName[nodeHash]);
        }
    }
    // Return it
    return opers;
};

this.callBindMethod = 
    function (eventSet, binder, p1, p2, p3, p4, p5, p6) {
    var method = binder[eventSet.bindMethodName];
    // Protect the binding for better logging
;;; try {
        method.call(binder, p1, p2, p3, p4, p5, p6);
;;; } catch(e) {
;;;     var names = eventSet.names;
;;;     var namespace = eventSet.namespace;
;;;     kukit.E = kukit.err.eventBindError(e, names, namespace);
;;;     throw new Error(kukit.E);
;;; }
};
this.initialize.apply(this, arguments);
};

er.makeId = function(namespace, name) {
    if (namespace == null) {
        namespace = '';
    }
    return '@' + namespace + '@' + name;
};

er.makeMergeId = function(id, namespace, name) {
    if (namespace == null) {
        namespace = '';
    }
    return id + '@' + namespace + '@' + name;
};

}();                              /// MODULE END
