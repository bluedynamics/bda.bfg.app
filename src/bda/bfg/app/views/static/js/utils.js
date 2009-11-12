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

/* Create kukit namespace */

if (typeof(kukit) == 'undefined') {
    var kukit = {};
}

;;; /*  ----------------------------------------------------------------
;;;  *  Lines starting with the ;;; are only cooked in development mode.
;;;  *  ----------------------------------------------------------------
;;;  */

/*
 * kukit.E is a proxy variable used globally for error and info messages.
 * This assure the following code can be used:
 *    
 *     ;;; kukit.E = 'This is the error message';
 *     throw new Error(kukit.E);
 *
 * or:
 *
 *     ;;; kukit.E = 'The event' + event + ' caused problems';
 *     method_with_info(x, kukit.E);
 *
 * or even:
 *
 *     ;;; kukit.E = 'The event' + event + ' caused problems ';
 *     ;;; kukit.E += 'and this is a very long line ';
 *     ;;; kukit.E += 'so we split it to parts for better readibility';
 *     ;;; kukit.logWarning(kukit.E);
 *
 */
kukit.E = 'Unknown message (kss optimized for production mode)';

// Browser identification. We need these switches only at the moment.
try {
    kukit.HAVE_SAFARI = navigator.vendor && 
        navigator.vendor.indexOf('Apple') != -1;
    kukit.HAVE_IE = eval("_SARISSA_IS_IE");
} catch (e) {}

;;; // Activation of extra logging panel: if necessary
;;; // this allows to start the logging panel from the browser with
;;; //    javascript:kukit.showLog();
;;; kukit.showLog = function() {
;;;     var msg = 'Logging is on the console: request to show logging pane';
;;;     msg += ' ignored.';
;;;     kukit.logWarning(msg);
;;; };

/*
 * Cookie handling code taken from: 
 * http://www.quirksmode.org/js/cookies.html
 * Cookie handling is in dom.js, but this method
 * is needed right here for log handling.
 */

kukit.readCookie = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

// a null function that is used for logging
kukit._null = function() {};

kukit._COOKIE_LOGLEVEL = '__kss_loglevel';

// an empty logger
kukit._logger = new function() {

    this.updateLogLevel = function() {
;;;     // set default level
;;;     this.loglevel = 0;
;;;     // read the cookie
;;;     /// (ignore if we run from test)
;;;     var cookie;
;;;     try {
;;;         // in test, document would throw ReferenceError
;;;         var _dummy = document;
;;;     } catch(e) {
;;;         var _dummy;
;;;     }
;;;     if (_dummy && typeof(document.cookie) != 'undefined') {
;;;         cookie = kukit.readCookie(kukit._COOKIE_LOGLEVEL);
;;;     }
;;;     if (cookie) {
;;;         // decode it to a numeric level
;;;         cookie = cookie.toLowerCase();
;;;         // Cookies are quoted in Zope, for some reason (???)
;;;         // ie we get '"VALUE"' here. Let's compensate this.
;;;         if (cookie.substr(0, 1) == '"') {
;;;             cookie = cookie.substr(1, cookie.length - 2);
;;;         }
;;;         if (cookie == 'debug') this.loglevel = 0;
;;;         if (cookie == 'info') this.loglevel = 1;
;;;         if (cookie == 'warning') this.loglevel = 2;
;;;         if (cookie == 'error') this.loglevel = 3;
;;;     };
        // Call the function that sets up the handlers
        this._setupHandlers();
        // Wrap the just set up handlers, to include wrapping
;;;     this.logDebug = this._logFilter(this.logDebug, 0);
;;;     this.log = this._logFilter(this.log, 1);
;;;     this.logWarning = this._logFilter(this.logWarning, 2);
;;;     this.logError = this._logFilter(this.logError, 3);
;;;     this.logFatal = this._logFilter(this.logFatal, 3);
    };

    // Log filter, for use from the handlers.
;;; this._logFilter = function(f, currentlevel) {
;;;     return (currentlevel >= this.loglevel) ? f : kukit._null;
;;; };

    // This sets up the handlers and allows to set them
    // up again with a different cookie setting.
    // Will be overwritten by different loggers.
    this._setupHandlers = function() {
        this.logDebug = kukit._null;
        this.log = kukit._null;
        this.logWarning = kukit._null;
        this.logError = kukit._null;
        this.logFatal = kukit._null;
    };
}();

// Stub functions that can be used for logging
kukit.logDebug = function(message) {kukit._logger.logDebug(message);};
kukit.log = function(message) {kukit._logger.log(message);};
kukit.logWarning = function(message) {kukit._logger.logWarning(message);};
kukit.logError = function(message) {kukit._logger.logError(message);};
kukit.logFatal = function(message) {kukit._logger.logFatal(message);};

// Function to change the log level from javascript
// level must be one of "DEBUG", "INFO", "WARNING", "ERROR".
// (Small caps are tolerated as well)
kukit.setLogLevel = function(level) {
;;;     // Store it in the cookie so that it persists through requests.
;;;     kukit.dom.createCookie(kukit._COOKIE_LOGLEVEL, level);
;;;     // re-establish the log handlers, based on this cookie setting
;;;     kukit._logger.updateLogLevel();
};

// We want a way of knowing if Firebug is available :
// it is very convenient to log a node in Firebug;
// you get a clickable result that brings you to Firebug inspector.
// The pattern is the following :
//  if (kukit.hasFirebug) {
//     kukit.log(node);
//  }

;;; // check whether the logging stuff of Firebug is available
;;; kukit.hasFirebug = function() {
;;;    var result = typeof console != 'undefined';
;;;    result = result && typeof console.log != 'undefined';
;;;    result = result && typeof console.debug != 'undefined';
;;;    result = result && typeof console.error != 'undefined';
;;;    result = result && typeof console.warn != 'undefined';
;;;    return result;
;;; }();

;;; // Set up logging for FireBug
;;; if (kukit.hasFirebug) {
;;;     kukit._logger._setupHandlers = function() {
;;;         // for debug level we also log as 'info', because we do
;;;         // not want FireBug to display line information.
;;;         this.logDebug = console.log;
;;;         this.log = console.log;
;;;         this.logWarning = console.warn;
;;;         this.logError = console.error;
;;;         this.logFatal = console.error;
;;;     };
;;; }

;;; // check whether the logging stuff of MochiKit is available
;;; kukit.hasMochiKit = function() {
;;;    var result = typeof MochiKit != 'undefined';
;;;    result = result && typeof MochiKit.Logging != 'undefined';
;;;    result = result && typeof MochiKit.Logging.log != 'undefined';
;;;    return result;
;;; }();

;;; // Set up logging for MochiKit
;;; if (! kukit.hasFirebug && kukit.hasMochiKit) {
;;;     kukit._logger._setupHandlers = function() {
;;;         this.logDebug = MochiKit.Logging.logDebug;
;;;         this.log = MochiKit.Logging.log;
;;;         this.logWarning = MochiKit.Logging.logWarning;
;;;         this.logError = MochiKit.Logging.logError;
;;;         this.logFatal = MochiKit.Logging.logFatal;
;;;     };
;;;     // make convenience url
;;;     //    javascript:kukit.showLog();
;;;     // instead of the need to say
;;;     //    javascript:void(createLoggingPane(true));
;;;     kukit.showLog = function() {
;;;         createLoggingPane(true);
;;;     };
;;; }

;;; // check whether the logging stuff of Safari is available
;;; kukit.hasSafari = function() {
;;;    var result = typeof console != 'undefined';
;;;    result = result && typeof console.log != 'undefined';
;;;    return result;
;;; }();

;;; // Set up logging for Safari
;;; if (! kukit.hasFirebug && ! kukit.hasMochiKit && kukit.hasSafari) {
;;;     kukit._logger._setupHandlers = function() {
;;;         this.logDebug = function(str) { console.log('DEBUG: '+str); };
;;;         this.log = function(str) { console.log('INFO: '+str); };
;;;         this.logWarning = function(str) { console.log('WARNING: '+str); };
;;;         this.logError = function(str) { console.log('ERROR: '+str); };
;;;         this.logFatal = function(str) { console.log('FATAL: '+str); };
;;;     };
;;; }

// Initialize the logger with the solution we've just detected
kukit._logger.updateLogLevel();

// log a startup message
;;; kukit.log('Loading KSS engine.');

/* utilities */

kukit.ut = new function() {   /// MODULE START

var ut = this;


/* 
* class FifoQueue
*/
ut.FifoQueue = function () {

this.initialize = function () {
    this.reset();
};

this.reset = function() {
    this.elements = new Array();
};

this.push = function(obj) {
    this.elements.push(obj);
};

this.pop = function() {
    return this.elements.shift();
};

this.empty = function() {
    return ! this.elements.length;
};

this.size = function() {
    return this.elements.length;
};

this.front = function() {
    return this.elements[0];
};
this.initialize.apply(this, arguments);
};

/*
* class SortedQueue
*/
ut.SortedQueue = function() {

this.initialize = function(comparefunc) {
    // comparefunc(left, right) determines the order by returning 
    // -1 if left should occur before right,
    // +1 if left should occur after right or 
    //  0 if left and right  have no preference as to order.
    // If comparefunc is not specified or is undefined,
    // the default order specified by < used.
    if (comparefunc) {
        this.comparefunc = comparefunc;
    }
    this.reset();
};

this.comparefunc = function(a, b) {
    if (a < b) {
        return -1;
    } else if (a > b) {
        return +1;
    } else {
        return 0;
    }
};

this.reset = function() {
    this.elements = new Array();
};

this.push = function(obj) {
    // Find the position of the object.
    var i = 0;
    var length = this.elements.length;
    while (i < length && this.comparefunc(this.elements[i], obj) == -1) {
        i ++;
    }
    // and insert it there
    this.elements.splice(i, 0, obj);
};

this.pop = function() {
    // takes minimal element
    return this.elements.shift();
};

this.popn = function(n) {
    // takes first n minimal element
    return this.elements.splice(0, n);
};

this.empty = function() {
    return ! this.elements.length;
};

this.size = function() {
    return this.elements.length;
};

this.get = function(n) {
    return this.elements[n];
};

this.front = function() {
    return this.elements[0];
};
this.initialize.apply(this, arguments);
};

ut.evalBool = function(value, errname) {
    if (value == 'true' || value == 'True' || value == '1') {
        value = true;
    } else if (value == 'false' || value == 'False' || value == '0'
        || value == '') {
        value = false;
;;;     } else {
;;;         throw new Error('Bad boolean value "' + value + '" ' + errname);
    }
    return value;
};

ut.evalInt = function(value, errname) {
;;;     try {
        value = parseInt(value);
;;;     } catch(e) {
;;;         throw new Error('Bad integer value "' + value + '" ' + errname);
;;;     }
    return value;
};

ut.evalList = function(value, errname) {
;;; try {
        // remove whitespace from beginning, end
        value = value.replace(/^ +/, '');
        //while (value && value.charAt(0) == ' ') {
        //    value = value.substr(1);
        //}
        value = value.replace(/ +$/, '');
        if (value == '') {
            value = [];
        } else {
            // do the splitting
            value = value.split(/ *, */);
        }
;;; } catch(e) {
;;;     throw new Error('Bad list value "' + value + '" ' + errname);
;;; }
    return value;
};

/* 
* class TimerCounter
*
* for repeating or one time timing
*/
ut.TimerCounter = function() {

this.initialize = function(delay, func, restart) {
    this.delay = delay;
    this.func = func;
    if (typeof(restart) == 'undefined') {
        restart = false;
    }
    this.restart = restart;
    this.timer = null;
};

this.start = function() {
    if (this.timer) {
;;;     kukit.E = 'Timer already started.';

        throw new Error(kukit.E);
    }
    var self = this;
    var func = function() {
        self.timeout();
    };
    this.timer = setTimeout(func, this.delay);
};

this.timeout = function() {
    // Call the event action
    this.func();
    // Restart the timer
    if (this.restart) {
        this.timer = null;
        this.start();
    }
};

this.clear = function() {
    if (this.timer) {
        window.clearTimeout(this.timer);
        this.timer = null;
    }
    this.restart = false;
};
this.initialize.apply(this, arguments);
};

/*
* class Scheduler
*/
ut.Scheduler = function() {

this.initialize = function(func) {
    this.func = func;
    this.timer = null;
    this.nextWake = null;
};

this.setNextWake = function(ts) {
    // Sets wakeup time, null clears
    if (this.nextWake) {
        this.clear();
    }
    if (! ts) {
        return;
    }
    var now = (new Date()).valueOf();
    if (ts > now) {
        this.nextWake = ts;
        var self = this;
        var func = function() {
            self.timeout();
        };
        this.timer = setTimeout(func, ts - now);
    } else {
        // if in the past, run immediately
        this.func();
    }
};

this.setNextWakeAtLeast = function(ts) {
    // Sets wakeup time, unless it would wake up later than the
    // currently set timeout. Null clears the timer.
    if (! ts || ! this.nextWake || ts < this.nextWake) {
        this.setNextWake(ts);
    } else {
        var now = (new Date()).valueOf();
        // XXX why compute now and not use it ?
    }
};

this.timeout = function() {
    // clear the timer
    this.timer = null;
    this.nextWake = null;
    // Call the event action
    this.func();
};

this.clear = function() {
    if (this.nextWake) {
        window.clearTimeout(this.timer);
        this.timer = null;
        this.nextWake = null;
    }
};
this.initialize.apply(this, arguments);
};

/* 
* class SerializeScheduler
*
* Scheduler for serializing bind and load procedures
*/
ut.SerializeScheduler = function() {

this.initialize = function() {
    this.items = [];
    this.lock = false;
};

this.addPre = function(func, remark) {
    this.items.push({func: func, remark: remark});
    this.execute();
};

this.addPost = function(func, remark) {
    this.items.unshift({func: func, remark: remark});
    this.execute();
};

this.execute = function() {
    if (! this.lock) {
        this.lock = true;
        while (true) {
            var item = this.items.pop();
            if (! item) {
                break;
            }
;;;         kukit.log(item.remark + ' starts.');
;;;         var ts_start = (new Date()).valueOf();
            try {
                item.func();
            } catch(e) {
                this.lock = false;
                throw e;
            }
;;;         var ts_end = (new Date()).valueOf();
;;;         var msg = item.remark + ' finished in ';
;;;         msg += (ts_end - ts_start) + ' ms.';
;;;         kukit.log(msg);
        }
        this.lock = false;
    }
};
this.initialize.apply(this, arguments);
};

/* Browser event binding */

/* extracted from Plone */
// cross browser function for registering event handlers
ut.registerEventListener = function(elem, event, func) {
    if (elem.addEventListener) {
        elem.addEventListener(event, func, false);
        return true;
    } else if (elem.attachEvent) {
        var result = elem.attachEvent("on"+event, func);
        return result;
    }
    // maybe we could implement something with an array
    return false;
};

if (typeof(window) != 'undefined') {
    ut.registerEventListener(window, "load", kukit.bootstrap);
}

/* collecting keys-values into a dict or into a tuple list */

/*
* class DictCollector
*/
ut.DictCollector = function() {

this.initialize = function() {
    this.result = {};
};

this.add = function(key, value) {
    this.result[key] = value;
};
this.initialize.apply(this, arguments);
};

/*
* class TupleCollector
*/
ut.TupleCollector = function() {

this.initialize = function() {
    this.result = [];
};

this.add = function(key, value) {
    this.result.push([key, value]);
};
this.initialize.apply(this, arguments);
};

ut.calculateBase = function(documentInstance, pageLocation) {
    var base = '';
    // fetch base from specific link in case of ill situations
    // like default pages in Plone 
    var nodes = documentInstance.getElementsByTagName("link");
    if (nodes.length > 0) {
        for (var i=0; i<nodes.length; i++) {
            var link = nodes[i];
            if (link.rel == 'kss-base-url') {
                var base = link.href;
                // XXX Special handling for Plone and systems that has a broken
                // url generated in base.
                //
                // kss-base-url is currently giving us the page url without the
                // trailing / and the method called within the page. Page is always the
                // real page we are viewing, without the trailing method section. 
                //
                // Examples:
                //
                // url entered in browser                        kss-base-url
                // ----------------------                        ------------
                // http://127.0.0.1:8080/portal                  ...portal/front-page
                // http://127.0.0.1:8080/portal/view             ...portal
                // http://127.0.0.1:8080/portal/front-page       ...portal/front-page
                // http://127.0.0.1:8080/portal/front-page/view  ...portal/front-page
                //
                // ... so, we *always* need to put a trailing slash to the end
                // to be standard compatible and compensate for the following
                // code, that correctly removes the part after the last slash.
                //
                if (! /\/$/.test(base)) {
                    // (actually, we always get here right now
                    // since it never has the /, but to be sure,
                    // we only add it if it's not there)
                    base = base + '/';
                }
            }
        }
    }
    // if no override, fetch as usual first from base tag
    // then from page url if no base tag
    if (!base) {
        nodes = documentInstance.getElementsByTagName("base");
        if (nodes.length != 0) {
            var base = nodes[0].href;
        } else {
            var base = pageLocation;
        }
    }
    // remove last piece until '/'
    var pieces = base.split('/');
    pieces.pop();
    // base url needs a trailing '/' 
    base = pieces.join('/') + '/';
    return base;
};

}();                              /// MODULE END

