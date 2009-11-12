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

/* Supplemental data that the parser builds up */

kukit.rd = new function() {   /// MODULE START

var rd = this;

/*
*  class KssSelector
*/
rd.KssSelector = function() {

this.initialize = function(isEvent, css, name, namespace, id, ppid) {
    this.isEventSelector = isEvent;
    this.isMethodSelector = ! isEvent;
// XXX GC row and column are wrong...
// XXX move parsing errors to parser
;;; if (! name) {
;;;     var msg = 'Kss selector must have a name.';
;;;     throw kukit.err.kssSelectorError(msg);
;;; }
;;; if (name.indexOf('@') != -1) {
;;;     var msg = 'Kss selector name must not contain @: [' + name + '].';
;;;     throw kukit.err.kssSelectorError(msg);
;;;     }
;;; if (id && id.indexOf('@') != -1) {
;;;     var msg = 'Kss selector id must not contain @: [' + id + '].';
;;;     throw kukit.err.kssSelectorError(msg);
;;;     }
;;; if (namespace && namespace.indexOf('@') != -1) {
;;;     var msg = 'Kss selector namespace must not contain @: [' + namespace;
;;;     msg = msg + '].';
;;;     throw kukit.err.kssSelectorError(msg);
;;;    }
;;; if (! isEvent) {
;;;     // method rule
;;;     if (css != 'document' && css != 'behaviour') {
;;;         var msg = 'KssSpecialSelector [' + name;
;;;         msg = msg + '] must have one of the allowed names.';
;;;         throw kukit.err.kssSelectorError(msg);
;;;    }
;;;     if (ppid) {
;;;         var msg = 'KssSpecialSelector [' + name + '] must not stand ';
;;;         msg += 'with an event id acquired by parameter provider ['
;;;         msg += ppid.methodName +  ']';
;;;         throw new kukit.err.KssSelectorError(msg);
;;;     }
;;; }
    this.css = css;
    this.name = name;
    this.namespace = namespace;
    this.className = null;
    this.id = id;
    this.ppid = ppid;
    // finish up the KSS on it
    // XXX This disables testing the parser
    // without a plugin registry, since it needs access to the registry.
    this.setClassName();
};
    
// finish up the KSS on it
this.setClassName = function() {
    // Sets up id and class on the selector, based on registration info
    // XXX GC instead of relying on exceptions, test if key exists
    try {
        this.className = kukit.eventsGlobalRegistry.get(
        this.namespace, this.name).className;
    } catch(e) {
        throw kukit.err.parsingError(e.message);
    }
};

this.prepareId = function() {
    if (this.ppid == null) {
        if (this.id == null && this.ppid == null) {
            // singleton for class
            this.id = kukit.er.makeId(this.namespace, this.className);
        }
        // Also set the merge id. The rules with the same merge
        // id should be merged on the same node.
        this.mergeId = kukit.er.makeMergeId(this.id, this.namespace, this.name);
    }
};

this.getId = function(node) {
    // Gives the id depending on a node.
     if (this.id) {
        // Statically set.
        return this.id;
    } else {
        // Evaluate it.
        var id = this.ppid.pprovider.eval(this.ppid.args, node, {});
        // check that the id is not empty or null!
        if (! id) {
;;;         var namestr;
;;;         if (this.namespace) {
;;;            namestr = this.namespace + '-' + this.name;
;;;         } else {
;;;            namestr = this.name;
;;;         }
;;;         kukit.E = 'Did not get a valid state id, when evaluated';
;;;         kukit.E += ' the value provider [' + this.ppid.methodName + ']';
;;;         kukit.E += ' in kss selector [' + namestr + ']';
;;;         kukit.E += ' css=[' + this.css + ']';
;;;         throw kukit.E;
        }
        return id;
    }
};

this.getMergeId = function(node) {
    // Gives the merge id depending on a node.
    if (this.mergeId) {
        // Statically set.
        return this.mergeId;
    } else {
        // Evaluate it.
        var id = this.getId(node);
        this.mergeId = kukit.er.makeMergeId(id, this.namespace, this.name);
    }
};
this.initialize.apply(this, arguments);
};

/*
* Kss parameter values. There are two kinds: text and method.
*
* They are evaluated in two phases: check is invoked at parsing,
* allowing the early detection of errors. Evaluate is called
* when the action is to be called. This allows a kss method
* to add any parameter to the action.
*/

/*
*  class KssTextValue
*/
rd.KssTextValue = function(txt) {
    // A text parameter in the format 
    //      key: value;
this.initialize = function(txt) {    
    this.txt = txt;
};

this.check = function(registry) {
    // use the IdentityPP provider.
    this.pprovider = new (kukit.pprovidersGlobalRegistry.get(''))();
};

this.evaluate =
    function(node, defaultParameters) {
    // For normal string parms, this would return the string itself.
    // In other execution contexts (like kssSelector, for example) this can
    // do something else.
    return this.pprovider.eval([this.txt], node, defaultParameters);
};
this.initialize.apply(this, arguments);
};
rd.KssTextValue.prototype.isMethod = false;

/*
*  class KssMethodValue
*/
rd.KssMethodValue = function() {

this.initialize = function(methodName, args) {
    // A method parameter in the format 
    //      key: methodName(v1, v2, ... vn);
    this.methodName = methodName;
    this.args = args;
};

this.check = function(registry) {
    // Check syntax
    var f = kukit.pprovidersGlobalRegistry.get(this.methodName);
    this.pprovider = new f();
;;; //Check the provider first.
;;; this.pprovider.check(this.args);
    // After checking the provider, we check the args recursively.
    for(var i=0; i < this.args.length; i++){
        // XXX We treat text values separetly because
        // they are now currently wrapped as KssTextValue
        // (as they should). TODO
        var arg = this.args[i];
        // XXX this is a check for a MethodValue, since
        // all text arguments are strings. -- this is fixed
        // on the service-layer branch
        if(arg.check){
            arg.check();
;;;         // The page provider should have checked if the parameters
;;;         // return the appropriate value type. If it has done
;;;         // this check, it has set checkedArgTypes. 
;;;         // If a provider expects all strings
;;;         // (like most value providers), it simply leaves this flag 
;;;         // intact, and we do the check here.
;;;         if (! this.pprovider.checkedArgTypes) {
;;;             // We expect a string to each position.
;;;             // By default, returnType is "string" so we also
;;;             // check undefined.
;;;             var returnType = arg.pprovider.returnType;
;;;             if (returnType && returnType != 'string') {
;;;                 kukit.E = 'Expected string value and got [' + returnType;
;;;                 kukit.E += '] in argument #[' + (i + 1) + '] of provider [';
;;;                 kukit.E += this.methodName + '].';
;;;                 throw new Error(kukit.E);
;;;             }
;;;         }

        }
    }
};

this.evaluate =
    function(node, defaultParameters) {
    // First recursivly evaluate all arguments
    var newArgs = [];
    for(var i=0; i < this.args.length; i++){
        // XXX We treat text values separetly because
        // they are now currently wrapped as KssTextValue
        // (as they should). TODO
        var arg = this.args[i];
        if(arg.evaluate){
            newArgs.push(arg.evaluate(node, defaultParameters));
        } else {
            newArgs.push(arg);
        }
    }
    // return the value
    return this.pprovider.eval(newArgs, node, defaultParameters);
};
this.initialize.apply(this, arguments);
};
rd.KssMethodValue.prototype.isMethod = true;


/*
*  class KssEventValue
*/
rd.KssEventValue = function(methodName, arg) {
    // A method parameter in the format 
    //      methodname(v1)
    // can be also:
    //      methodname(methodname2(v2))
    //  in both cases, arg is KssTextValue, or KssMethodValue
    this.methodName = methodName;
    this.arg = arg;
    this.check = function() {};
};
rd.KssEventValue.prototype.isMethod = true;

rd.EventRuleNr = 0;            // just a counter

/*
*  class EventRule
*/
rd.EventRule = function() {

this.initialize = function(kssSelector, parms, actions) {
    if (typeof(parms) == 'undefined') {
        // called for merging clone
        // Setting up kssSelector is enough here. Parms and the rest
        // are not needed, since the merging code will attach them
        // on the rule after creation.
        this.kssSelector = kssSelector;
    } else {
        this.index = rd.EventRuleNr;
        this.mergedIndex = null;
        rd.EventRuleNr = this.index + 1;
;;;     var namestr;
;;;     if (kssSelector.namespace) {
;;;         namestr = kssSelector.namespace + '-' + kssSelector.name;
;;;     } else {
;;;         namestr = kssSelector.name;
;;;     }
;;;     var msg = 'EventRule #' + this.getIndex() + ': ';
;;;     msg = msg + kssSelector.css + ' EVENT=' + namestr;
;;;     kukit.logDebug(msg);
        this.kssSelector = kssSelector;
        this.parms = parms;
        this.actions = actions;
    }
};

this.getIndex = function() {
    if (this.mergedIndex) {
        return this.mergedIndex;
    } else {
        return this.index;
    }
};

this.mergeForSelectedNodes = 
    function(ruletable, phase, inNodes) {

    // Select all nodes within the inNodes for phase==2.
    // (or undefined on initial node, phase==1)
    // Merge itself to the selected nodes.
    if (this.kssSelector.isEventSelector) {
        var nodes = kukit.dom.cssQuery(this.kssSelector.css, inNodes);
        var counter = 0;
        for (var y=0; y < nodes.length; y++)
        {
            var node = nodes[y];
            // XXX never rebind to any node again!
            // this compensates that cssQuery is returning
            // results out of the subtree
            if (typeof(node._kukitMark) == 'undefined') {
                ruletable.add(node, this);
                counter += 1;
                }
        }
;;;     if (counter > 0) {
;;;         var msg = 'EventRule [#' + this.getIndex();
;;;         msg = msg + '-' + this.kssSelector.mergeId;
;;;         msg = msg + '] selected ' + counter + ' nodes.';
;;;         kukit.logDebug(msg);
;;;     }
    } else if (typeof(inNodes) == 'undefined') {
        // Method selector. They only need to be handled on the initial
        // pageload, when the inNodes parameter is ommitted.
        kukit.engine.documentRules.add(this);
    }
};

this.getBinderInfo = function(node) {
    // Figure out what will be the "state id" for the kss event rule.
    var id = this.kssSelector.getId(node);
    // Gets the event instance for the rule.
    return kukit.engine.binderInfoRegistry.getOrCreateBinderInfo(
        this.kssSelector.id, this.kssSelector.className, 
        this.kssSelector.namespace);
};

/*
* bind(node) : calls binder hook on event instance.
*  These hooks are tried in order, if succeeds it must return true:
*
* __bind__(name, parms, func_to_bind, node, eventRule)
* __bind_<name>__(parms, func_to_bind, node, eventRule)
*
* If none succeeds is an error.
*
*/

this.bind = function(node) {
    this.store(node);
    // Creation of the binding oper
    var oper = new kukit.op.Oper();
    var binderInfo = this.getBinderInfo(node);
    oper.node = node;
    oper.eventRule = this;
    oper.binder = binderInfo.binder;
    oper.parms = this.parms;
    // mark on the instance as bound
    binderInfo.bindOper(oper); 
};

this.store = function(node) {
    if (node == null) {
        // node == null is *always* valid, it means "document".
        return;
    }
    if (typeof(node.kukitEventRules) == 'undefined') {
        var rules = [];
        node.kukitEventRules = rules;
    }
    node.kukitEventRules.push(this);
};
/*
* Merging event rules
*/

this.isMerged = function() {
    return (this.mergedIndex != null);
};

this.cloneForMerge = function() {
    // Do not touch ourselves, make a new copy for the merge.
    var merged = new rd.EventRule(this.kssSelector);
    merged.actions = new rd.ActionSet();
    merged.parms = {};
    merged.mergedIndex = 'X';
    merged.merge(this);
    merged.mergedIndex = this.getIndex();
    return merged;
};

this.merge = function(other) {
;;; if (! this.isMerged()) {
;;;     throw new Error('Cannot merge into a genuine event rule');
;;; }
;;; if (this.kssSelector.isEventSelector) {
;;;     if (this.kssSelector.id != other.kssSelector.id) {
;;;         throw new Error('Differing kss selector ids in event rule merge');
;;;     }
;;;     if (this.kssSelector.className != other.kssSelector.className) {
;;;         throw new Error('Differing kss selector classes in event rule merge');
;;;     }
;;; }
;;; if (this.kssSelector.name != other.kssSelector.name) {
;;;     throw new Error('Differing kss selector names in event rule merge');
;;; }
    this.mergedIndex = this.mergedIndex + ',' + other.getIndex();
    for (var key in other.parms) {
        this.parms[key] = other.parms[key];
    }
    this.actions.merge(other.actions);
;;; if (this.mergedIndex.substr(0, 1) != 'X') {
;;;     // ignore initial clone-merge
;;;     var msg = 'Merged rule [' + this.mergedIndex;
;;;     msg = msg + '-' + this.kssSelector.mergeId + '].';
;;;     kukit.logDebug(msg);
;;; }
};

this.mergeIntoDict = function(dict, key) {
    // Merge into the given dictionary by given key.
    // If possible, store the genuine rule first - if not,
    // clone it and do a merge. Never destroy the genuine
    // rules, clone first. This is for efficiency.
    var mergedRule = dict[key];
    if (typeof(mergedRule) == 'undefined') {
        // there was no rule
        dict[key] = this;
    } else {
        // we have to merge the rule
        if (! mergedRule.isMerged()) {
            // Make sure genuine instances are replaced
            mergedRule = mergedRule.cloneForMerge();
            dict[key] = mergedRule;
        }
        mergedRule.merge(this);
    }
};
this.initialize.apply(this, arguments);
};


/*
*  class ActionSet
*/
rd.ActionSet = function() {

this.initialize = function() {
    this.content = {};
};

this.hasActions = function() {
    for (var name in this.content) {
        return true;
    }
    return false;
};

this.merge = function(other) {
    for (var key in other.content) {
        var action = this.content[key];
        var action2 = other.content[key];
        if (typeof(action) == 'undefined') {
            if (action2.type != 'X') {
                // new action
                action = new _Action();
                this.content[key] = action;
            } else {
;;;             var msg = 'Cannot action-delete unexisting action, [';
;;;             msg = msg + key + '].';
;;;             // Double throw in this case is needed, in production mode
;;;             // only the second one will be effective.
;;;             throw kukit.err.ruleMergeError(msg);
                throw new Error(kukit.E);
            }
        }
        if (action2.type != 'X') {
            // merge the action
            action.merge(action2);
        } else {
            // Delete the action
            this.deleteAction(key);
        }
    }
};

this.execute = function(oper) {
    for (var key in this.content) {
        var action = this.content[key];
        // do not execute error actions!
        if (action.type != 'E') {
            action.execute(oper);
        }
    }
    // Execute the default action in case of there is one but there were no
    // parms so it was actually not entered as an action object
    // otherwise, it would have been executed from action.execute already
    if (typeof(this.content['default']) == 'undefined') {
        // this is conditional: if there is no default method, it's skipped.
        var name = oper.eventRule.kssSelector.name;
        // Execution with no parms. (XXX ?)
        oper = oper.clone({'parms': {}});
        oper.executeDefaultAction(name, true);
    }
};

this.getOrCreateAction = function(name, valuesByReturnType) {
    // kss parameters will ve set from valuesByReturnType 
    //
    // In case we alias, use the alias for name, this will become
    // the action name used for execution. The alias name will
    // be used as name, and serve for decide merging.
    var nameOverride;
    if (valuesByReturnType.alias) {
        nameOverride = name;
        // This is always a string, no provider allowed.
        // 
        // XXX atm, strings are unwrapped. (this is fixed
        // in service-layer branch)
        name = valuesByReturnType.alias.args[0];
    }
    // Check if we have this action already
    var action = this.content[name];
    if (typeof(action) == 'undefined') {
        action = new _Action();
        action.setName(name, nameOverride);
        this.content[name] = action;
    }
    // Set other values that were given at the same line as the name.
    // This enables individual overriding.
    if (valuesByReturnType.selection) {
        action.parms.kssSelector = valuesByReturnType.selection;
    }
    if (valuesByReturnType.formquery) {
        action.parms.kssSubmitForm = valuesByReturnType.formquery;
    }
    if (valuesByReturnType.url) {
        action.parms.kssUrl = valuesByReturnType.url;
    }
    return action;
};

this.getActionOrNull = function(name) {
    var action = this.content[name];
    if (typeof(action) == 'undefined') {
        action = null;
    }
    return action;
};

this.deleteAction = function(name) {
    var action = this.content[name];
;;; if (typeof(action) == 'undefined') {
;;;     throw new Error('Action [' + name + '] does not exist and cannot be deleted.');
;;; }
    delete this.content[name];

};

this.getDefaultAction = function() {
    return this.getActionOrNull('default');
};

this.getErrorActionFor = function(action) {
    // Get the error action of a given action: or null,
    // if the action does not define an error handler.
    return this.getActionOrNull(action.error);
};
this.initialize.apply(this, arguments);
};

/*
*  class _Action
*/
var _Action = function() {

this.initialize = function() {
    this.name = null;
    this.error = null;
    this.parms = {};
    this.type = null;
    this.nameOverride = null;
};

this.getExecutingName = function getExecutingName() {
    // Returns action name that is to be used for execution.
    // In case nameOverride is empty, name is used both as merging
    // key, and for selecting the action at execution.
    // In case nameOverride is specified, name is still used for
    // merging, but nameOverride is used when we need to
    // execute the action.
    // This is used for  action-client: nameOverride alias(name).
    return this.nameOverride || this.name;
};

this.setName = function(name, nameOverride) {
    if (typeof(nameOverride) == 'undefined' || name == nameOverride) {
        // use null for no-value.
        //
        // Also: If we alias to the same name as the action name,
        // simply ignore aliasing and just handle the real action.
        nameOverride = null;
    }
;;; // We check that the name did not change.
;;; if (this.name != null) {
;;;     if (this.name != name) {
;;;         kukit.E = 'Error overriding action name [' + this.name;
;;;         kukit.E += '] to [' + name + '] (Unmatching action names or aliases at merge?)';
;;;         throw kukit.err.ruleMergeError(kukit.E);
;;;     }
;;;     // nameOverride can only be specified when name is also specified.
;;;     // We also check that the override cannot change, ie. it is not
;;;     // possible to use the same alias for different actions.
;;;     // However we allow this.nameOverride to have a value and nameOverride
;;;     // to be null.
;;;     if (nameOverride != null && this.nameOverride != nameOverride) {
;;;         kukit.E = 'Error overriding action name for alias [' + this.name;
;;;         kukit.E += '] from [' + this.nameOverride;
;;;         kukit.E += '] to [' + nameOverride + '] ';
;;;         kukit.E += '(Different actions aliased by the same alias?)';
;;;         throw kukit.err.ruleMergeError(kukit.E);
;;;     }
;;; }
    // Store the values.
    this.name = name;
    // nameOverride is only overwritten if value exists.
    if (nameOverride != null) {
        this.nameOverride = nameOverride;
    }
    // Handle default action.
    if (name == 'default') {
;;;     if (this.type != null && this.type != 'D') {
;;;         var msg = 'Error setting action to default on action [' + this.name;
;;;         msg = msg + '], current type [' + this.type + '].';
;;;         throw kukit.err.ruleMergeError(msg);
;;;     }
        this.setType('D');
    }
};

this.setType = function(type) {
    // Allowed types:
    //
    // S = server
    // C = client
    // E = error / client
    // D = default (unsettable)
    // X = cancel action
;;; var checkType = function(type) {
;;;     var isNotServer = type != 'S';
;;;     var isNotClient = type != 'C';
;;;     var isNotError = type != 'E';
;;;     var isNotCancel = type != 'X';
;;;     return isNotServer && isNotClient && isNotError && isNotCancel;
;;; };
;;; if (checkType(type) || (this.type != null && this.type != type)) {
;;;     var msg = 'Error setting action type on action [' + this.name;
;;;     msg = msg + '] from [' + this.type + '] to [' + type;
;;;     msg = msg + '] (Attempt to merge client, server or error actions ?)';
;;;     throw kukit.err.ruleMergeError(msg);
;;; }
;;; if (this.error != null && this.type != 'S') {
;;;     var msg = 'Error setting action error handler on action [' + this.name;
;;;     msg = msg + '], this is only allowed on server actions.';
;;;     throw kukit.err.ruleMergeError(msg);
;;; }
    this.type = type;  
};

this.setError = function(error) {
;;; if (this.type != null && this.type != 'S') {
;;;     var msg = 'Error setting action error handler on action [' + this.name;
;;;     msg =  msg + '], this is only allowed on server actions.';
;;;     throw kukit.err.ruleMergeError(msg);
;;; }
    this.error = error;  
};

this.merge = function(other) {
    // Merge to the instance.
    if (other.name != null) { 
        // We also use nameOverride from the other.
        this.setName(other.name, other.nameOverride);
    }
    if (other.type != null) { 
        this.setType(other.type);
    }
    if (other.error != null) { 
        this.setError(other.error);
    }
    // These are simply overwritten.
    for (var key in other.parms) {
        this.parms[key] = other.parms[key];
    }
};

// The evaluation of string is handled specially
// in case of some parameter names.
//
//     kssSelector    string "foo" evaluates as css("foo")
//     kssSubmitForm  string "foo" evaluates as form("foo")
//
var _defaultStringHandling = {
    'kssSelector': 'css',
    'kssSubmitForm': 'form'
};

this.makeActionOper = function(oper) {
    // Fill the completed action parms, based on the node
    // The kssXxx parms, reserved for the action, are 
    // handled as appropriate.
    // A cloned oper is returned.
    var parms = {};
    var kssParms = {};
    // Make sure we have defaultParameters on oper
    if (typeof(oper.defaultParameters) == 'undefined') {
        oper.defaultParameters = {};
    }
    // Evaluate all parameters.
    for (var key in this.parms) {
        // Evaluate the value of the parameter.
        var value = this.parms[key].evaluate(oper.node,
                oper.defaultParameters);
        // Final handling of special cases.
        // This is needed in case we have a string, and we
        // look up the provider we need from the _defaultStringHandling table.
        var providerName = _defaultStringHandling[key];
        if (providerName && typeof(value) == 'string') {
            // Use the value provider. This means the string is
            // a shortcut and this provider is applied.
            var providerClass = kukit.pprovidersGlobalRegistry.get(providerName);
            var provider = new providerClass();
            // check is not needed now... we evaluate it right away
            value = provider.eval([value], oper.node, oper.defaultParameters);
        }
        // Store it, depending if it's a kss or normal parameter.
        if (key.match(/^kss/)) {
            // kssXxx parms are separated to kssParms.
            kssParms[key] = value; 
        } else {
            // evaluate the method parms into parms
            parms[key] = value;
        }
    }
    var anOper = oper.clone({
            'parms': parms,
            'kssParms': kssParms,
            'action': this
        });
    return anOper;
};

this.execute = function(oper) {
    oper = this.makeActionOper(oper);
    switch (this.type) {
        case 'D': {
            // Default action.
            var name = oper.eventRule.kssSelector.name;
            oper.executeDefaultAction(name);
        } break;
        case 'S': {
            // Server action.
            oper.executeServerAction(this.name);
        } break;
        case 'C': {
            // Client action.
            // Need to execute the real name,
            // since aliasing is possible here.
            oper.executeClientAction(this.getExecutingName());
        } break;
        case 'E': {
            // Error action (= client action)
            oper.executeClientAction(this.name);
        } break;
    }
};
this.initialize.apply(this, arguments);
};


/*
*  class LoadActions
*/
rd.LoadActions = function() {

this.initialize = function() {
    this.items = [];
};

this.empty = function() {
    return (this.size() == 0);
};

this.size = function() {
    return this.items.length;
};

this.push = function(f) {
    if (this.items.length >= 100) {
        throw ('Infinite recursion, stack full');
    }
    this.items.push(f);
};

this.execute = function() {
    var f = this.items.shift();
    if (f) {
        f();
        return true;
    } else {
        return false;
    }
};

this.executeAll = function() {
    var i = 0;
    while(true) {
        var success = this.execute();
        if (! success) {
            break;
        }
        i++;
    }
    return i;
};
this.initialize.apply(this, arguments);
};

/*
*  class RuleTable
*
*   Used for binding rules to nodes, and handling the merges.
*   It is a two level dictionary.
*
*   There are more rules that match a given node and event id. 
*   They will be merged appropriately. The event id is also
*   important. The event class must be the same with merge
*   rules (within the id).
*
*   To summarize the procedure, each eventRule is added with
*   all the nodes that are selected by it. Nothing is executed,
*   only merges are done at this time. Finally, all binds are
*   done in the second path.
*
*   Event with the same merge id are merged. The merge id is
*   a concatenation of the event id and the event name.
* 
*   XXX TODO this has to be refactored, since it's all global now
*
*/

rd.RuleTable = function() {

this.initialize = function(loadScheduler) {
    this.loadScheduler = loadScheduler;
    this.nodes = {};
};

this.add = function(node, eventRule) {
    // look up node
    var nodehash = rd.hashNode(node);
    var nodeval = this.nodes[nodehash];
    if (typeof(nodeval) == 'undefined') {
        nodeval = {'node': node, 'val': {}};
        this.nodes[nodehash] = nodeval;
    }
    // Merge into the dict
    eventRule.mergeIntoDict(
        nodeval.val, eventRule.kssSelector.getMergeId(node));
};

this.bindall = function(phase) {
    // Bind all nodes
    var counter = 0;
    for (var nodehash in this.nodes) {
        var nodeval = this.nodes[nodehash];
        // XXX Mark the node, disabling rebinding in a second round
        nodeval.node._kukitMark = phase;
        for (var id in nodeval.val) {
            var eventRule = nodeval.val[id];
            eventRule.bind(nodeval.node);
        }
        counter += 1;
    }
;;; kukit.logDebug(counter + ' HTML nodes bound with rules.');
    // Execute the load actions in a deferred manner
    var loadactions = this.loadScheduler;
    if (! loadactions.empty()) {
;;;     kukit.logDebug('Delayed load actions execution starts.');
        var count = loadactions.executeAll();
;;;     kukit.logDebug(count + ' load actions executed.');
    }
};
this.initialize.apply(this, arguments);
};

rd.uid = 0;

rd.hashNode = function(node) {
    // It is, generally, not possible to use a node as a key.
    // However we try to set this right.
    // We generate an uniqueID on the node. This does not work
    // on MSIE but it already has an uniqueID.
    if (node == null) {
        // null represents the document
        return '<<DOCUMENT>>';
    }
    var id = node.uniqueID;
    if (typeof(id) == 'undefined') {
        id = rd.uid;
        node.uniqueID = id;
        rd.uid ++;
    }
    return id;
};

/*
*  class MethodTable
*
* stores the method rules.
*
* Unlike the rule table that is specific for each binding,
* this is unique to the page.
*/
rd.MethodTable = function() {

this.initialize = function() {
    this.content = {};
    this.content['document'] = {};
    this.content['behaviour'] = {};
};

this.add = function(eventRule) {
    // Get the entry by the type which is now at css
    var category = eventRule.kssSelector.css;
    var dict = this.content[category];
;;; if (typeof(dict) == 'undefined') {
;;;     throw new Error('Unknown method rule category [' + category + '].');
;;; }
    // Merge into the corresponding category
    // mergeId must be set on kss selector already.
    eventRule.mergeIntoDict(dict, eventRule.kssSelector.getMergeId());
};

this.getMergedRule =
    function(category, name, binder) {

    // Returns the rule for a given event instance, 
    // Get the entry by category (= document or behaviour)
    var dict = this.content[category];
;;; if (typeof(dict) == 'undefined') {
;;;     throw new Error('Unknown method rule category [' + category + '].');
;;; }
    // look up the rule
    var namespace = binder.__eventNamespace__;
    var id = binder.__binderId__;
    var mergeId = kukit.er.makeMergeId(id, namespace, name);
    var mergedRule = dict[mergeId];
    if (typeof(mergedRule) == 'undefined') {
        // no error, just return null.
        mergedRule = null;
    }
    return mergedRule;
};

this.bindall = function() {
    // bind document events
    var documentRules = this.content['document'];
    var counter = 0;
    for (var mergeId in documentRules) {
        // bind to null as a node
        documentRules[mergeId].bind(null);
        counter += 1;
    }
;;; kukit.logDebug(counter + ' rules bound to document.');
};
this.initialize.apply(this, arguments);
};

}();                              /// MODULE END
