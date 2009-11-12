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

/* Core plugins and utilities */

kukit.pl = new function() {   /// MODULE START

var pl = this;

/* 
* Event plugins 
* 
* __trigger_event__(name, parms, node)
* is a method bound to each class, so methods can call
* it up to call an event action bound through kss.
*
* The event binder hooks
* __bind__(name, parms, func_to_bind)
* should be defined to make binding of event to the given function.
*
* The event action hooks
* __exec__(name, parms, node)
* can be defined to specify a default event action.
*/

pl.getTargetForBrowserEvent = function(e) {
    // this prevents the handler to be called on wrong elements, which
    // can happen because of propagation or bubbling
    // XXX this needs to be tested in all browsers
    if (!e) var e=window.event;
    var target = null;
    if (e.target) {
        target = e.target;
    } else if (e.srcElement) {
        target = e.srcElement;
    }
    /* ???
    if (e.currentTarget)
        if (target != e.currentTarget)
            target = null;*/
    return target;
};

/*
* function registerBrowserEvent
*
* This can be used to register native events in a way that
* they handle allowbubbling, preventdefault and preventbubbling as needed.
* (The handling of these parms are optional, it is allowed not to have them
* in the oper.parms.)
*
* The register function can also take a filter function as parameter. 
* This function needs to receive oper as a parameter,
* where 'browserevent' will be set on oper too as the native browser event.
* The function must return true if it wants the event to execute,
* false otherwise.
* If it returns false, the event will not be prevented and counts as if
* were not called.
* This allows for certain event binder like key handlers, to put an extra
* condition on the triggering of event.
*
* The eventName parameter is entirely optional and
* can be used to set up a different
* event from the desired one.
*/

pl.registerBrowserEvent = function(oper, filter, eventName) {
    var func_to_bind = oper.makeExecuteActionsHook(filter);
    if (! eventName)
        eventName = oper.getEventName();
    var func = function(e) {
        var target = pl.getTargetForBrowserEvent(e);
        // change suggested by Martin Heidegger
        // TODO GC is asking Martin to explain his reasoning
        //var target = this;
        if (oper.parms.allowbubbling || target == oper.node) {
            // Execute the action, provide browserevent on oper
            // ... however, do it protected. We want the preventdefault
            // in any case!
            var exc;
            var success;
            try {
                success = func_to_bind({'browserevent': e});
            } catch(exc1) {
                exc = exc1;    
            }
            if (success || exc) {
                // This should only be skipped, if the filter told
                // us that we don't need this event to be executed.
                // If an exception happened during the event execution,
                // we do yet want to proceed with the prevents.
                //
                // Cancel default event ?
                if (oper.parms.preventdefault) {
                    // W3C style
                    if (e.preventDefault)
                        e.preventDefault();
                    // MS style
                    try { e.returnValue = false; } catch (exc2) {}
                }
                // Prevent bubbling to other kss events ?
                if (oper.parms.preventbubbling) {
                    if (!e) var e = window.event;
                    e.cancelBubble = true;
                    if (e.stopPropagation) e.stopPropagation();
                }
            }
            //
            if (exc != null) {
                // throw the original exception
                throw exc;
            }
;;;     } else {
;;;         var msg = 'Ignored bubbling event for event [' + eventName;
;;;         msg += '], target [' + target.tagName + '], EventRule #';
;;;         msg += oper.eventRule.getIndex() + ' mergeId [';
;;;         msg += oper.eventRule.kssSelector.mergeId + '].'; 
;;;         kukit.log(msg);
        }
    };

    // register the event listener
    kukit.ut.registerEventListener(oper.node, eventName, func);
     
    //
    // XXX Safari hack
    // necessary since Safari does not prevent the <a href...> following
    // (in case of allowbubbling we have to apply it to all clicks, as there
    // might be a link inside that we cannot detect on the current node)
    //
    if (oper.parms.preventdefault && kukit.HAVE_SAFARI 
            && (oper.parms.allowbubbling || eventName == 'click'
            && oper.node.tagName.toLowerCase() == 'a')) {
        oper.node.onclick = function cancelClickSafari() {
            return false;
        };
    }
};

/*
* class NativeEventBinder
*/
pl.NativeEventBinder = function() {

this.__bind__node = function(name, func_to_bind, oper) {
;;; if (oper.node == null) {
;;;     throw new Error('Native event [' + name + '] must be bound to a node.');
;;; }
    this.__bind__(name, func_to_bind, oper);
};

this.__bind__nodeorwindow = function(name, func_to_bind, oper) {
    if (oper.node == null) {
        oper.node = window;
    }
    this.__bind__(name, func_to_bind, oper);
};

this.__bind__window = function(name, func_to_bind, oper) {
;;; if (oper.node != null) {
;;;     throw new Error('Native event [' + name + '] must not be bound to a node.');
;;; }
    oper.node = window;
    this.__bind__(name, func_to_bind, oper);
};

this.__bind__nodeordocument = function(name, func_to_bind, oper) {
    if (oper.node == null) {
        oper.node = document;
    }
    this.__bind__(name, func_to_bind, oper);
};

this.__bind__ = function(name, func_to_bind, oper) {
;;; oper.componentName = 'native event binding';
    oper.evaluateParameters([], 
        {'preventdefault': '', 'allowbubbling': '', 'preventbubbling': ''});
    oper.evalBool('preventdefault');
    oper.evalBool('allowbubbling');
    oper.evalBool('preventbubbling');
    if (oper.parms.preventdefault) {
        if (name != 'click') {
;;;         kukit.E = 'In native events only the click event can have';
;;;         kukit.E += ' [preventdefault] parameter.';
            throw new Error(kukit.E);
        }
    }
    // we give the name parameter to the registration, so we
    // really bind to the event name we want.
    pl.registerBrowserEvent(oper, null, name);
};

this.__bind_key__ =
    function(name, func_to_bind, oper) {
;;; oper.componentName = 'native key event binding';
    oper.evaluateParameters([],
        {'preventdefault': 'true', 'allowbubbling': '',
         'preventbubbling': '', 'keycodes': ''});
    oper.evalList('keycodes');
    oper.evalBool('preventdefault');
    oper.evalBool('allowbubbling');
    oper.evalBool('preventbubbling');
    var selected_keycodes_only = false;
    if (oper.parms.keycodes.length > 0) {
        // Convert keyCode to dict
        var keycodes = {};
        for (var i=0; i<oper.parms.keycodes.length; i++) {
            var keyCode = oper.parms.keycodes[i];
            keycodes[keyCode] = true;
        }
        // Set filter so that only the specified keys should trigger.
        selected_keycodes_only = true;
    }
    // We set a filter to execute in any case. This will be used to 
    // set the keycode on the defaultParameters, and also to select 
    // if we want the actions to execute or not.
    var filter = function(oper) {
        // XXX this is still a bit wrong... shift, control, altgr keys
        // may work inconsistently through events and browsers.
        // We attempt to fix this for the alphabet at least
        // (a..z, A..Z)
        var keyCode = oper.browserevent.keyCode;
        //kukit.log('keyCode: ' + keyCode);
        if (keyCode == 0) {
            // need to check also charCode. In case of non-control
            // characters on IE this will have the value.
            keyCode = oper.browserevent.charCode;
            //kukit.log('charCode: ' + keyCode);
        } else {
            // Because of IE madness, we need to consider the shift
            // state in order to have a consistent result.
            if (keyCode >= 65 && keyCode <= 90 && 
                    oper.browserevent.shiftKey == false) { // 'A' <= key <= 'Z'
                // make it a small cap!
                keyCode = keyCode + 32;
                //kukit.log('keyCode compensated: ' + keyCode);
            }
        }
        // Stringify the keycode.
        if (keyCode) {
            keyCode = keyCode.toString();
        } else {
            kukit.logWarning(keyCode);
            keyCode = '0';
        }
        kukit.log(keyCode);
        // Store the keycode on parms, so actions can access it
        // with the value provider pass(keycode).
        oper.defaultParameters = {keycode: keyCode};
        // Return filter result.
        if (selected_keycodes_only) {
            if (keyCode == '0') {
                // Key pressed without an ascii value, like shift or altgr
                // We ignore this.
                return false;
            } else {
                return keycodes[keyCode];
            }
        } else {
            // no filtering: execute the actions in case of any key.
            return true;
        }
    };
    pl.registerBrowserEvent(oper, filter);
};
};


/*
* class TimeoutEventBinder
*
*  Timer events. The binding of this event will start one counter
*  per event rule. No matter how many nodes matched it. 
*  The timer will tick for ever,
*  unless the binding node has been deleted, in which case it stops,
*  or it runs only once if repeat=false is given.
*/
pl.TimeoutEventBinder = function() {

this.initialize = function() {
    this.counters = {};
};

this.__bind__ = function(name, func_to_bind, oper) {
;;; oper.componentName = 'timeout event binding';
    oper.evaluateParameters(['delay'], {'repeat': 'true'});
    oper.evalBool('repeat');
    var key = oper.eventRule.getIndex();
    if (! (oper.parms.repeat && this.counters[key])) {
;;;     var msg = 'Timer event key entered for actionEvent #' + key;
;;;     msg += ', selector [' + oper.eventRule.kssSelector.css + '].';
;;;     kukit.logDebug(msg);
        var f = function() {
            // check if the node has been deleted
            // and weed it out if so
            if (oper.node != null && ! oper.node.parentNode) {
;;;         var msg = 'Timer event key deleted for actionEvent #' + key;
;;;         msg += ', selector [' + oper.eventRule.kssSelector.css + '].';
;;;         kukit.logDebug(msg);
                this.clear();
            } else {
                func_to_bind();
            }
        };
        var delay = oper.parms.delay;
        var repeat = oper.parms.repeat;
        var counter = new kukit.ut.TimerCounter(delay, f, repeat); 
        this.counters[key] = counter;
        // Start the counter
        counter.start();
;;; } else {   
;;;     // Don't bind the counter if we matched this eventRule already
;;;     // (this is only checked if this event is repeating)
;;;     var msg = 'Timer event key ignored for actionEvent #' + key;
;;;     msg += ', selector [' + oper.eventRule.kssSelector.css + '].';
;;;     kukit.logDebug(msg);
    }
};
this.initialize.apply(this, arguments);
};

/*
* class LoadEventBinder
*/
pl.LoadEventBinder = function() {

this.processParameters =
    function(oper, iload) {
    if (! oper) {
        return;
    }
    if (iload) {
;;;     oper.componentName = '[iload] event binding';
        oper.evaluateParameters(['autodetect'],
            {'initial': 'true', 'insert': 'true'});
        // autodetect=false changes the iload autosense method to one
        // that requires that code in the iframe set the _kssReadyForLoadEvent
        // attribute on the document. Setting this attribute is explicitely 
        // required if autodetect is off, since we would never notice
        // if the document has arrived in this case.
        oper.evalBool('autodetect');
    } else {
;;;     oper.componentName = '[load] event binding';
        oper.evaluateParameters([], {'initial': 'true', 'insert': 'true'});
    }
    oper.evalBool('initial');
    oper.evalBool('insert');
    var phase;
    if (oper.node == null) {
        // if the event is bound to a document node,
        // we are in phase 1.
        phase = 1;
    } else {
        // get the phase from the node
        phase = oper.node._kukitMark;
    }
    if (phase == 1 && ! oper.parms.initial) {
;;;     var msg = 'EventRule #' + oper.eventRule.getIndex() + ' mergeId [';
;;;     msg += oper.eventRule.kssSelector.mergeId + '] event ignored,';
;;;     msg += ' oninitial=false.';
;;;     kukit.logDebug(msg);
        return;
    }
    if (phase == 2 && ! oper.parms.insert) {
;;;     var msg = 'EventRule #' + oper.eventRule.getIndex() + ' mergeId [';
;;;     msg += oper.eventRule.kssSelector.mergeId + '] event ignored,';
;;;     msg += ' oninsert=false.';
;;;     kukit.logDebug(msg);
        return;
    }
    return oper;
};

this.__bind__ = function(opers_by_eventName) {
    // This bind method handles load and iload events together, and 
    // opers_by_eventName is
    // a dictionary of opers which can contain a load and an iload key,
    // either one or both.
    var loadoper = opers_by_eventName.load;
    var iloadoper = opers_by_eventName.iload;
    loadoper = this.processParameters(loadoper);
    iloadoper = this.processParameters(iloadoper, true);
    var anyoper = loadoper || iloadoper;
    if (! anyoper) {
        return;
    }
    if (anyoper.node != null && 
        anyoper.node.tagName.toLowerCase() == 'iframe') {
        // In an iframe.
        //
        // BBB If there is only a load (and no iload) event bound to this node, 
        // we interpret it as an iload event, but issue deprecation warning.
        // This conserves legacy behaviour when the load event was actually
        // doing an iload, when it was bound to an iframe node.
        // The deprecation tells that the event should be changed 
        // from load to iload.
        if (loadoper && ! iloadoper) {
            iloadoper = loadoper;
            loadoper = null;
            // with the legacy loads we suppose autodetect=false
            iloadoper.parms.autodetect = false;
;;;         var msg = 'Deprecated the use of [load] event for iframes. It';
;;;         msg += ' will behave differently in the future. Use the';
;;;         msg += ' [iload] event (maybe with [evt-iload-autodetect:';
;;;         msg += ' false]) instead !';
;;;         kukit.logWarning(msg);
        } 
    } else {
        // Not an iframe. So iload is not usable.
        if (iloadoper) {
;;;         kukit.E = '[iload] event can only be bound to an iframe node.';
            throw new Error(kukit.E);
        }
    }
    // Now, bind the events.
    if (loadoper) {
;;;     var msg = 'EventRule #' + loadoper.eventRule.getIndex() + ' mergeId [';
;;;     msg += loadoper.eventRule.kssSelector.mergeId;
;;;     msg += '] selected normal postponed execution.';
;;;     kukit.logDebug(msg);
        // for any other node than iframe, or even for iframe in phase1,
        // we need to execute immediately.
        var func_to_bind = loadoper.makeExecuteActionsHook();
        var remark = '';
;;;     remark += '[load] event execution for ';
;;;     // loadoper can execute on document!
;;;     // Is this the case? 
;;;     if (loadoper.node == null) {
;;;         // document:load
;;;         remark += '[document]';
;;;     } else {
;;;         // <node>:load
;;;         remark += 'node [';
;;;         remark += loadoper.node.tagName.toLowerCase();
;;;         remark += ']';
;;;     }
        kukit.engine.bindScheduler.addPost(func_to_bind, remark);
    }
    if (iloadoper) {
        var phase = iloadoper.node._kukitMark;
        // For phase 2 we need to execute posponed, for phase1 immediately.
        // XXX it would be better not need this and do always postponed.
        if (phase == 2 || (phase == 1 && kukit.engine.initializedOnDOMLoad)) {
;;;         var msg = 'EventRule #' + iloadoper.eventRule.getIndex();
;;;         msg += ' mergeId [' + iloadoper.eventRule.kssSelector.mergeId;
;;;         msg += ' event selected delayed execution (when iframe loaded)';
;;;         kukit.logDebug(msg);
            // We want the event execute once the iframe is loaded.
            // In a somewhat tricky way, we start the scheduler only from
            // the normal delayed execution. This will enable that in
            // case we had a load event on the same node, it could modify
            // the name and id parms and we only start
            // the autosense loop (which is based on name and id) after the
            // load event's action executed. 
            // (Note, oper.node.id may lie in the log then and show the 
            // original, unchanged id but we ignore this for the time.)
            var g = function() {
                var f = function() {
                    var func_to_bind = iloadoper.makeExecuteActionsHook();
                    var remark = '';
;;;                 remark += '[iload] event execution for iframe [';
;;;                 remark += iloadoper.node.name + ']';
                    kukit.engine.bindScheduler.addPost(func_to_bind, remark);
                };
                new kukit.dom.EmbeddedContentLoadedScheduler(iloadoper.node.id,
                    f, iloadoper.parms.autodetect);
            };
            var remark = '';
;;;         remark += 'Schedule [iload] event for iframe ';
;;;         remark += iloadoper.node.name + ']';
            kukit.engine.bindScheduler.addPost(g, remark);
        } else {
;;;         var msg = 'EventRule #' + iloadoper.eventRule.getIndex();
;;;         msg += ' mergeId [';
;;;         msg += iloadoper.eventRule.kssSelector.mergeId;
;;;         msg += '] event selected normal postponed execution.';
;;;         kukit.logDebug(msg);
            var func_to_bind = iloadoper.makeExecuteActionsHook();
            var remark = '';
;;;         remark += 'Execute [iload] event for iframe ';
;;;         remark += iloadoper.node.name + ']';
            kukit.engine.bindScheduler.addPost(func_to_bind, remark);
        }
    }
};

};

/*
* class SpinnerEventBinder
*
* Spinner support. Besides the event itself we use some utility
* classes to introduce lazyness (delay) for the spinner.
*/
pl.SpinnerEventBinder = function() {

this.initialize = function() {
    this.state = false;
    var self = this;
    var _timeoutSetState = function(spinnerevent) {
       self.timeoutSetState(spinnerevent);
    };
    this.scheduler = new kukit.ut.Scheduler(_timeoutSetState);
};

this.__bind__ = function(name, func_to_bind, oper) {
;;; oper.componentName = '[spinner] event binding';
    oper.evaluateParameters([], {'laziness': 0});
    oper.evalInt('laziness');
    // Register the function with the global queue manager
    var state_to_bind = (name == 'spinneron');
    var self = this;
    var func = function() {
        self.setState(func_to_bind, state_to_bind, oper.parms.laziness);
    };
    kukit.engine.requestManager.registerSpinnerEvent(func, state_to_bind);
};

this.setState = function(func_to_bind, state, laziness) {
    // This is called when state changes. We introduce laziness
    // before calling the func.
    this.func_to_bind = func_to_bind;
    this.state = state;
    var now = (new Date()).valueOf();
    var wakeUp = now + laziness;
    this.scheduler.setNextWakeAtLeast(wakeUp);
};

this.timeoutSetState = function() {
    // really call the bound actions which should set the spinner
    var func = this.func_to_bind;
    func();
};
this.initialize.apply(this, arguments);
};

}();                              /// MODULE END

/*
* Registration of all the native events that can bound
* to a node or to document 
*  (= document or window, depending on the event specs)
*  Unsupported are those with absolute no hope to work in a cross browser way
*  Preventdefault is only allowed for click and key events, currently
*/
kukit.eventsGlobalRegistry.register(null, 'blur', kukit.pl.NativeEventBinder,
    '__bind__nodeorwindow', null);
kukit.eventsGlobalRegistry.register(null, 'focus', kukit.pl.NativeEventBinder,
    '__bind__nodeorwindow', null);
kukit.eventsGlobalRegistry.register(null, 'resize', kukit.pl.NativeEventBinder,
    '__bind__nodeorwindow', null);
kukit.eventsGlobalRegistry.register(null, 'click', kukit.pl.NativeEventBinder,
    '__bind__nodeordocument', null);
kukit.eventsGlobalRegistry.register(null, 'dblclick',
    kukit.pl.NativeEventBinder, '__bind__node', null);
kukit.eventsGlobalRegistry.register(null, 'mousedown',
    kukit.pl.NativeEventBinder, '__bind__nodeordocument', null);
kukit.eventsGlobalRegistry.register(null, 'mouseup',
    kukit.pl.NativeEventBinder, '__bind__nodeordocument', null);
kukit.eventsGlobalRegistry.register(null, 'mousemove',
    kukit.pl.NativeEventBinder, '__bind__nodeordocument', null);
kukit.eventsGlobalRegistry.register(null, 'mouseover',
    kukit.pl.NativeEventBinder, '__bind__node', null);
kukit.eventsGlobalRegistry.register(null, 'mouseout',
    kukit.pl.NativeEventBinder, '__bind__node', null);
kukit.eventsGlobalRegistry.register(null, 'change',
    kukit.pl.NativeEventBinder, '__bind__node', null);
kukit.eventsGlobalRegistry.register(null, 'reset',
    kukit.pl.NativeEventBinder, '__bind__node', null);
kukit.eventsGlobalRegistry.register(null, 'select',
    kukit.pl.NativeEventBinder, '__bind__node', null);
kukit.eventsGlobalRegistry.register(null, 'submit',
    kukit.pl.NativeEventBinder, '__bind__node', null);
kukit.eventsGlobalRegistry.register(null, 'keydown',
    kukit.pl.NativeEventBinder, '__bind_key__', null);
kukit.eventsGlobalRegistry.register(null, 'keypress',
    kukit.pl.NativeEventBinder, '__bind_key__', null);
kukit.eventsGlobalRegistry.register(null, 'keyup',
    kukit.pl.NativeEventBinder, '__bind_key__', null);
//kukit.eventsGlobalRegistry.register(null, 'unload',
//    kukit.pl.NativeEventBinder, '__bind__window', null);

kukit.eventsGlobalRegistry.register(null, 'timeout',
    kukit.pl.TimeoutEventBinder, '__bind__', null);

// Use the [node] iterator to provide expected invocation
// and call signature of the bind method.
kukit.eventsGlobalRegistry.registerForAllEvents(null, ['load', 'iload'],
    kukit.pl.LoadEventBinder, '__bind__', null, 'Node');


kukit.eventsGlobalRegistry.register(null, 'spinneron',
    kukit.pl.SpinnerEventBinder, '__bind__', null);
kukit.eventsGlobalRegistry.register(null, 'spinneroff',
    kukit.pl.SpinnerEventBinder, '__bind__', null);

/* Core actions
*
* The core client actions that can be executed on the client
* side.
*
* They also get registered as commands
*/
kukit.actionsGlobalRegistry.register('error', function (oper) {
    throw new Error('The builtin error action should never execute.');
    }
);
kukit.commandsGlobalRegistry.registerFromAction('error',
    kukit.cr.makeGlobalCommand);

kukit.actionsGlobalRegistry.register('logDebug', function (oper) {
    var name = '[logDebug] action';
    oper.evaluateParameters([], {'message': '[logDebug] action'}, name);
    var message = oper.parms.message;
;;; message += oper.debugInformation();    
    kukit.logDebug(message); 
;;; if (kukit.hasFirebug) {
;;;     kukit.logDebug(oper.node);
;;; }
});
kukit.commandsGlobalRegistry.registerFromAction('logDebug',
    kukit.cr.makeGlobalCommand);

kukit.actionsGlobalRegistry.register('log', function (oper) {
    oper.evaluateParameters([], {'message': 'Log action'}, 'log action');
    var message = oper.parms.message;
;;; message += oper.debugInformation();    
    kukit.log(message);
});
kukit.commandsGlobalRegistry.registerFromAction('log',
    kukit.cr.makeGlobalCommand);

kukit.actionsGlobalRegistry.register('alert', function (oper) {
    oper.evaluateParameters([], {'message': 'Alert action'}, 'alert action');
    var message = oper.parms.message;
;;; message += oper.debugInformation();    
    alert(message);
});
kukit.commandsGlobalRegistry.registerFromAction('alert', 
    kukit.cr.makeGlobalCommand);

/* Core commands 
*
* All the commands are also client actions.
*/

kukit.actionsGlobalRegistry.register('replaceInnerHTML', function(oper) {
/*
*  accepts both string and dom.
*/
;;; oper.componentName = '[replaceInnerHTML] action';
    oper.evaluateParameters(['html'], {'withKssSetup': true});
    oper.evalBool('withKssSetup');
    var node = oper.node;
    node.innerHTML = oper.parms.html;
    var insertedNodes = [];
    for (var i=0; i<node.childNodes.length; i++) {
        insertedNodes.push(node.childNodes[i]);
    }
;;; kukit.logDebug(insertedNodes.length + ' nodes inserted.');
    if (oper.parms.withKssSetup) {
        kukit.engine.setupEvents(insertedNodes);
    }
});
kukit.commandsGlobalRegistry.registerFromAction('replaceInnerHTML',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('replaceHTML', function(oper) {
/*
*  accepts both string and dom.
*/
;;; oper.componentName = '[replaceHTML] action';
    oper.evaluateParameters(['html'], {'withKssSetup':true});
    oper.evalBool('withKssSetup');
    var node = oper.node;
    var elements = kukit.dom.parseHTMLNodes(oper.parms.html);
    var length = elements.length;
;;; kukit.logDebug(length + ' nodes inserted.');
    if (length > 0) {
        var parentNode = node.parentNode;
        var insertedNodes = [];
        // insert the last node
        var next = elements[length-1];
        parentNode.replaceChild(next, node);
        insertedNodes.push(next);
        // then we go backwards with the rest of the nodes
        for (var i=length-2; i>=0; i--) {
            var inserted = parentNode.insertBefore(elements[i], next);
            insertedNodes.push(inserted);
            next = inserted;
        }
        if (oper.parms.withKssSetup) {
            kukit.engine.setupEvents(insertedNodes);
        }
    }
});
kukit.commandsGlobalRegistry.registerFromAction('replaceHTML',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('setAttribute', function(oper) {
;;; oper.componentName = '[setAttribute] action';
    oper.evaluateParameters(['name', 'value'], {});
    if (oper.parms.name.toLowerCase() == 'style') {
;;;     kukit.E = '[style] attribute is not allowed with [setAttribute]';
        throw new Error(kukit.E);
    }
    kukit.dom.setAttribute(oper.node, oper.parms.name, 
        oper.parms.value);
});
kukit.commandsGlobalRegistry.registerFromAction('setAttribute',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('setKssAttribute', function(oper) {
;;; oper.componentName = '[setKssAttribute] action';
    oper.evaluateParameters(['name', 'value'], {});
    kukit.dom.setKssAttribute(oper.node, oper.parms.name, 
        oper.parms.value);
});
kukit.commandsGlobalRegistry.registerFromAction('setKssAttribute',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('setStyle', function(oper) {
;;; oper.componentName = '[setStyle] action';
    oper.evaluateParameters(['name', 'value'], {});
    oper.node.style[oper.parms.name] = oper.parms.value;
});
kukit.commandsGlobalRegistry.registerFromAction('setStyle', 
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('addClass', function(oper) {
;;; oper.componentName = '[addClass] action';
    oper.evaluateParameters(['value'], {});
    kukit.dom.addClassName(oper.node, oper.parms.value);
});
kukit.commandsGlobalRegistry.registerFromAction('addClass',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('removeClass', function(oper) {
;;; oper.componentName = '[removeClass] action';
    oper.evaluateParameters(['value'], {});
    kukit.dom.removeClassName(oper.node, oper.parms.value);
});
kukit.commandsGlobalRegistry.registerFromAction('removeClass',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('insertHTMLAfter', function(oper) {
;;; oper.componentName = '[insertHTMLAfter] action';
    oper.evaluateParameters(['html'], {'withKssSetup':true});
    oper.evalBool('withKssSetup');
    var content = kukit.dom.parseHTMLNodes(oper.parms.html);
    var parentNode = oper.node.parentNode;
    var toNode = kukit.dom.getNextSiblingTag(oper.node);
    if (toNode == null) {
        kukit.dom.appendChildren(content, parentNode);
    } else {
        kukit.dom.insertBefore(content, parentNode, toNode);
    }
;;; kukit.logDebug(content.length + ' nodes inserted.');
    // update the events for the new nodes
    if (oper.parms.withKssSetup) {
        kukit.engine.setupEvents(content);
    }
});
kukit.commandsGlobalRegistry.registerFromAction('insertHTMLAfter',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('insertHTMLBefore', function(oper) {
;;; oper.componentName = '[insertHTMLBefore] action';
    oper.evaluateParameters(['html'], {'withKssSetup':true});
    oper.evalBool('withKssSetup');
    var content = kukit.dom.parseHTMLNodes(oper.parms.html);
    var toNode = oper.node;
    var parentNode = toNode.parentNode;
    kukit.dom.insertBefore(content, parentNode, toNode);
;;; kukit.logDebug(content.length + ' nodes inserted.');
    // update the events for the new nodes
    if (oper.parms.withKssSetup) {
        kukit.engine.setupEvents(content);
    }
});
kukit.commandsGlobalRegistry.registerFromAction('insertHTMLBefore',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('insertHTMLAsLastChild', function(oper) {
;;; oper.componentName = '[insertHTMLAsLastChild] action';
    oper.evaluateParameters(['html'], {'withKssSetup':true});
    oper.evalBool('withKssSetup');
    var content = kukit.dom.parseHTMLNodes(oper.parms.html);
    kukit.dom.appendChildren(content, oper.node);
;;; kukit.logDebug(content.length + ' nodes inserted.');
    // update the events for the new nodes
    if (oper.parms.withKssSetup) {
        kukit.engine.setupEvents(content);
    }
});
kukit.commandsGlobalRegistry.registerFromAction('insertHTMLAsLastChild',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('insertHTMLAsFirstChild', function(oper) {
;;; oper.componentName = '[insertHTMLAsFirstChild] action';
    oper.evaluateParameters(['html'], {'withKssSetup':true});
    oper.evalBool('withKssSetup');
    var content = kukit.dom.parseHTMLNodes(oper.parms.html);
    var parentNode = oper.node;
    var toNode = parentNode.firstChild;
    if (toNode == null) {
        kukit.dom.appendChildren(content, parentNode);
    } else {
        kukit.dom.insertBefore(content, parentNode, toNode);
    }
;;; kukit.logDebug(content.length + ' nodes inserted.');
    // update the events for the new nodes
    if (oper.parms.withKssSetup) {
        kukit.engine.setupEvents(content);
    }
});
kukit.commandsGlobalRegistry.registerFromAction('insertHTMLAsFirstChild',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('deleteNodeAfter', function(oper) {
;;; oper.componentName = '[deleteNodeAfter] action';
;;; oper.evaluateParameters([], {});
    var parentNode = oper.node.parentNode;
    var toNode = kukit.dom.getNextSiblingTag(oper.node);
    if (toNode != null) {
        parentNode.removeChild(toNode);
    }  
});
kukit.commandsGlobalRegistry.registerFromAction('deleteNodeAfter', 
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('deleteNodeBefore', function(oper) {
;;; oper.componentName = '[deleteNodeBefore] action';
;;; oper.evaluateParameters([], {});
    var parentNode = oper.node.parentNode;
    var toNode = kukit.dom.getPreviousSiblingTag(oper.node);
    parentNode.removeChild(toNode);
});
kukit.commandsGlobalRegistry.registerFromAction('deleteNodeBefore', 
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('deleteNode', function(oper) {
;;; oper.componentName = '[deleteNode] action';
;;; oper.evaluateParameters([], {});
    var parentNode = oper.node.parentNode;
    parentNode.removeChild(oper.node);
});
kukit.commandsGlobalRegistry.registerFromAction('deleteNode', 
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('clearChildNodes', function(oper) {
;;; oper.componentName = '[clearChildNodes] action';
    // TODO get rid of none
    oper.evaluateParameters([], {'none': false});
    kukit.dom.clearChildNodes(oper.node);
});
kukit.commandsGlobalRegistry.registerFromAction('clearChildNodes',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('focus', function(oper) {
;;; oper.componentName = '[focus] action';
    // TODO get rid of none
    oper.evaluateParameters([], {'none': false});
    kukit.dom.focus(oper.node);
});
kukit.commandsGlobalRegistry.registerFromAction('focus',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('blur', function(oper) {
;;; oper.componentName = '[blur] action';
    // TODO get rid of none
    oper.evaluateParameters([], {'none': false});
    kukit.dom.blur(oper.node);
});
kukit.commandsGlobalRegistry.registerFromAction('blur',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('moveNodeAfter', function(oper) {
;;; oper.componentName = '[moveNodeAfter] action';
;;; oper.evaluateParameters(['html_id'], {});
    var node = oper.node;
    var parentNode = node.parentNode;
    parentNode.removeChild(node);
    var toNode = document.getElementById(oper.parms.html_id);
    var nextNode = kukit.dom.getNextSiblingTag(toNode);
    if (nextNode == null) {
        toNode.parentNode.appendChild(node);
    } else {
        parentNode.insertBefore(node, nextNode);
    }
});
kukit.commandsGlobalRegistry.registerFromAction('moveNodeAfter',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('moveNodeBefore', function(oper) {
;;; oper.componentName = '[moveNodeBefore] action';
;;; oper.evaluateParameters(['html_id'], {});
    var node = oper.node;
    // no need to remove it, as insertNode does it anyway
    // var parentNode = node.parentNode;
    // parentNode.removeChild(node);
    var toNode = document.getElementById(oper.parms.html_id);
    var parentNode = toNode.parentNode;
    parentNode.insertBefore(node, toNode);
});
kukit.commandsGlobalRegistry.registerFromAction('moveNodeBefore',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('moveNodeAsLastChild', function(oper) {
;;; oper.componentName = '[moveNodeAsLastChild] action';
;;; oper.evaluateParameters(['html_id'], {});
    var node = oper.node;
    // no need to remove it, as insertNode does it anyway
    // var parentNode = node.parentNode;
    // parentNode.removeChild(node);
    var parentNode = document.getElementById(oper.parms.html_id);
    parentNode.appendChild(node);
});
kukit.commandsGlobalRegistry.registerFromAction('moveNodeAsLastChild', 
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('copyChildNodesFrom', function(oper) {
;;; oper.componentName = '[copyChildNodesFrom] action';
;;; oper.evaluateParameters(['html_id'], {});
    var fromNode = document.getElementById(oper.parms.html_id);
    Sarissa.copyChildNodes(fromNode, oper.node);
});
kukit.commandsGlobalRegistry.registerFromAction('copyChildNodesFrom',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('copyChildNodesTo', function(oper) {
;;; oper.componentName = '[copyChildNodesTo] action';
;;; oper.evaluateParameters(['html_id'], {});
    toNode = document.getElementById(oper.parms.html_id);
    Sarissa.copyChildNodes(oper.node, toNode);
});
kukit.commandsGlobalRegistry.registerFromAction('copyChildNodesTo',
    kukit.cr.makeSelectorCommand);

kukit.actionsGlobalRegistry.register('setStateVar', function(oper) {
;;; oper.componentName = '[setStateVar] action';
;;; oper.evaluateParameters(['varname', 'value'], {});
    kukit.engine.stateVariables[oper.parms.varname] =
        oper.parms.value;
});
kukit.commandsGlobalRegistry.registerFromAction('setStateVar',
    kukit.cr.makeGlobalCommand);

kukit.actionsGlobalRegistry.register('continueEvent', function(oper) {
    // Trigger continuation event. Event will be triggered on the same node
    // or on all the nodes bound for the current event state.
    // allows excess parms in the following check.
;;; oper.componentName = '[continueEvent] action';
    oper.evaluateParameters(['name'], {'allnodes': 'false'}, '', true);
    oper.evalBool('allnodes', 'continueEvent');
    var parms = oper.parms;
    var binder = oper.binder;
    var allNodes = parms.allnodes;
    // marshall it, the rest of the parms will be passed
    var actionParameters = {};
    for (var key in parms) {
        if (key != 'name' && key != 'allnodes') {
            actionParameters[key] = parms[key];
        }
    }
    if (parms.allnodes) {
        binder.continueEventAllNodes(parms.name,
            actionParameters);
    } else {
        // execution happens on the orignode
        binder.continueEvent(parms.name, oper.orignode,
            actionParameters);
    }
});
kukit.commandsGlobalRegistry.registerFromAction('continueEvent',
    kukit.cr.makeGlobalCommand);

kukit.actionsGlobalRegistry.register('executeCommand', function(oper) {
    // Allows executing a local action on a different selection.
    //
    // allows excess parms in the following check
;;; oper.componentName = '[executeCommand] action';
;;; var msg = 'Deprecated the [executeCommand] action, use [kssSelector] in a standard action!';
;;; kukit.logWarning(msg);
    oper.evaluateParameters(['name', 'selector'],
                       {'selectorType': null},
                       '', true);
    var parms = oper.parms;
    // marshall it, the rest of the parms will be passed
    var actionParameters = {};
    for (var key in parms) {
        if (key != 'name' && key != 'selector' && key != 'selectorType') {
            actionParameters[key] = parms[key];
        }
    }
    var command = new kukit.cr.makeCommand(parms.selector,
            parms.name, parms.selectorType, actionParameters);
    command.execute(oper);
});


// Add/remove a class to/from a node
kukit.actionsGlobalRegistry.register('toggleClass', function (oper) {
;;; oper.componentName = '[toggleClass] action';
    // BBB 4 month, until 2007-10-18
    // oper.evaluateParameters(['value'], {});
    kukit.actionsGlobalRegistry.BBB_classParms(oper);

    var node = oper.node;
    var className = oper.parms.value;

    var nodeclass = kukit.dom.getAttribute(node, 'class');
    var classFoundAtIndex = -1;
    var parts = nodeclass.split(' ');
    for(var i=0; i<parts.length; i++){
        if(parts[i]==className){
            classFoundAtIndex = i;
        }
    }
    if(classFoundAtIndex==-1){
        parts.push(className);
    } else {
        parts.splice(classFoundAtIndex, 1);
    }
    kukit.dom.setAttribute(node, 'class', parts.join(' '));
});
kukit.commandsGlobalRegistry.registerFromAction('toggleClass',
    kukit.cr.makeSelectorCommand);

/*
*  XXX Compatibility settings for old command names.
*  These will be removed as soon as all current use cases are changed.
*  Do not use these as your code will break!
* 
*/
// BBB remove at 2007-10-18
kukit.commandsGlobalRegistry.registerFromAction('replaceInnerHTML', 
    kukit.cr.makeSelectorCommand, 'setHtmlAsChild');
kukit.commandsGlobalRegistry.registerFromAction('replaceHTML',
    kukit.cr.makeSelectorCommand, 'replaceNode');
kukit.commandsGlobalRegistry.registerFromAction('insertHTMLAfter',
    kukit.cr.makeSelectorCommand, 'addAfter');
kukit.commandsGlobalRegistry.registerFromAction('deleteNodeAfter',
    kukit.cr.makeSelectorCommand, 'removeNextSibling');
kukit.commandsGlobalRegistry.registerFromAction('deleteNodeBefore',
    kukit.cr.makeSelectorCommand, 'removePreviousSibling');
kukit.commandsGlobalRegistry.registerFromAction('deleteNode',
    kukit.cr.makeSelectorCommand, 'removeNode');
kukit.commandsGlobalRegistry.registerFromAction('clearChildNodes',
    kukit.cr.makeSelectorCommand, 'clearChildren');
kukit.commandsGlobalRegistry.registerFromAction('copyChildNodesFrom',
    kukit.cr.makeSelectorCommand, 'copyChildrenFrom');
kukit.commandsGlobalRegistry.registerFromAction('copyChildNodesTo',
    kukit.cr.makeSelectorCommand, 'copyChildrenTo');
kukit.commandsGlobalRegistry.registerFromAction('setStateVar',
    kukit.cr.makeGlobalCommand, 'setStatevar');
// BBB 4 month, until 2007-10-18
kukit.actionsGlobalRegistry.register('addClassName', function(oper) {
;;; var msg = 'Deprecated the [addClassName]  action, use [addClass] instead!';
;;; kukit.logWarning(msg);
;;; oper.componentName = '[addClassName] action';
    kukit.actionsGlobalRegistry.BBB_classParms(oper);
    kukit.actionsGlobalRegistry.get('addClass')(oper);
});
kukit.commandsGlobalRegistry.registerFromAction('addClassName',
    kukit.cr.makeSelectorCommand);
// BBB 4 month, until 2007-10-18
kukit.actionsGlobalRegistry.register('removeClassName', function(oper) {
;;; var msg = 'Deprecated the [removeClassName]  action, use [removeClass]';
;;; msg += 'instead !';
;;; kukit.logWarning(msg);
;;; oper.componentName = 'removeClassName action';
    kukit.actionsGlobalRegistry.BBB_classParms(oper);
    kukit.actionsGlobalRegistry.get('removeClass')(oper);
});
kukit.commandsGlobalRegistry.registerFromAction('removeClassName',
    kukit.cr.makeSelectorCommand);

// BBB 4 month, until 2007-10-18
kukit.actionsGlobalRegistry.BBB_classParms = function(oper) {
    var old;
    var has_old;
    if (typeof(oper.parms.className) != 'undefined') {
        old = oper.parms.className;
        has_old = true;
;;; var msg = 'Deprecated the [className] parameter in ' + oper.componentName;
;;; msg += ', use [value] instead !';
;;; kukit.logWarning(msg); 
    }
    if (typeof(oper.parms.name) != 'undefined') {
        old = oper.parms.name;
        has_old = true;
;;;     var msg = 'Deprecated the [name] parameter in ' + oper.componentName;
;;;     msg += ', use [value] instead !';
;;;     kukit.logWarning(msg);
    }
    if (has_old) {
        if (typeof(oper.parms.value) == 'undefined') {
            oper.parms = {value: old};
        } else {
            oper.parms = {};
        }
    }
};
// end BBB

