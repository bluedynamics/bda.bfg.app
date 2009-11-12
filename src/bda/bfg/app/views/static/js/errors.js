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

kukit.err = new function () {        /// MODULE START

var err = this;

/* 
* Exception factory 
*
* Create exception helpers:
*
*    this.explicitError = function(errorcommand){
*        var kw = {'foo': 'blah'};
*        return setErrorInfo(null, 'ExplicitError', message, kw);
*     };
*
>
* Throwing:
*    (There is no longer a "new" before creating the exception.)
*
* throw kukit.mymodule.explicitError("There was an error in my program.");
*
* Catching example:
*
*   ...
*    } catch(e) {
*        if (e.name == 'explicitError') {
*            ...
*        } else {
*            throw(e);
*        }
*    }
*
* It is allowed to make a new error from a previous one, see examples in this file.
* However you should use annotation and always throw back the original error,
* otherwise traceback information will be lost.
*
*/

/*
*  class ErrorAnnotation
*/

var ErrorAnnotation = function() {

    this.constructError = function(e, name, message, kw) {
;;;     if (typeof(kw) == "undefined") {
;;;         kw = {};
;;;     }
        this.kw = kw;
;;;     this.message = name + ': ' + message;
;;;     var addMessage = true;
        if (!e) {
;;;         e = new Error(message);
;;;         addMessage = false;
;;;     } else if (typeof(e) == "string") {
;;;         kukit.E = 'Do not raise string exceptions, as we cannot ';
;;;         kukit.E += 'annotate them properly. Use: throw new Error(msg);';
            e = new Error(kukit.E);
        }
;;;     this.previous_info = e.info;
        e.name = name;
        e.info = this;
;;;     if (addMessage) {
;;;         var fullMessage = message + ' [' + e.message + ']';
;;;         // for FF, and Safari:
;;;         e.message = fullMessage;
;;;         // for IE, message is ignored, description is used.
;;;         e.description = fullMessage;
;;;         }
        return e;
    };
;;;
;;; this._logRecursive = function() {
;;;     kukit.logError(this.message);
;;;     if (this.previous_info) {
;;;         this.previous_info._logRecursive();
;;;     }
;;; };
;;;
;;; this.log = function() {
;;;     // This is for debugging only, normal error handling
;;;     // does not use it.
;;;     kukit.logFatal('KSS error, stack information follows:');
;;;     this._logRecursive();
;;; };

};

var setErrorInfo = function(e, name, message, kw) {
    return new ErrorAnnotation().constructError(e, name, message, kw);
};

/* Protects a function */


/* 
 * Explicit error represents that the server side action failed and
 * we need to handle this with an explicit error action defined from
 * kss.
 * There are three main cases when this can happen:
 * 
 * 1. In case the server explicitely sent us an error (hence the 
 *    name of this class) the parameter will contain the kss 
 *    command from the payload.
 *
 * 2. If a payload response parsing error lead us here, then it
 *    will contain a string of the error message.
 *
 * 3. If a timeout of the response happened, the parameter will 
 *    contain the text "timeout".
 */
err.explicitError = function(errorcommand){
    var kw = {'errorcommand': errorcommand};
;;; kukit.E = 'Explicit error';
    return setErrorInfo(null, 'ExplicitError', kukit.E, kw);
};

err.responseParsingError = function(message){
    return setErrorInfo(null, 'ResponseParsingError', message);
};

;;; err.ruleMergeError = function(message){
;;;    return setErrorInfo(null, 'RuleMergeError', message);
;;; };

;;; err.kssSelectorError = function(message){
;;;    return setErrorInfo(null, 'RuleMergeError', message);
;;; };


err.parsingError = function(message, cursor){
   var kw = {};
;;;    if (cursor) {
;;;         kw.errpos = cursor.pos;
;;;         kw.errrow = cursor.row;
;;;         kw.errcol = cursor.col;
;;;         message += ', at row ' + kw.errrow + ', column ' + kw.errcol;
;;;    } else {
;;;         kw.errpos = null;
;;;         kw.errrow = null;
;;;         kw.errcol = null;
;;;    }
   return setErrorInfo(null, 'ParsingError', message, kw);
};


/* Exceptions that re-throw (annotate) an already caught error */

;;; err.commandExecutionError = function(e, command){
;;;    var message = 'Command [' + command.name + '] failed';
;;;    return setErrorInfo(e, 'CommandExecutionError', message);
;;; };


;;; err.eventBindError = function(e, eventNames, eventNamespaces){
;;;    var kw = {};
;;;    kw.eventNames = eventNames;
;;;    kw.eventNamespaces = eventNamespaces;
;;;    var message = 'When binding event name(s) [' + eventNames;
;;;    message += '] in namespace [' + eventNamespaces + '].';
;;;    return setErrorInfo(e, 'EventBindError', message, kw);
;;; };


;;; err.undefinedEventError = function(e, message){
;;;    return setErrorInfo(e, 'UndefinedEventError', message);
;;; };


;;; err.kssParsingError = function(e, url){
;;;    var kw = {url: url};
;;;    var message = 'Error parsing KSS at ' + url;
;;;    return setErrorInfo(e, 'KssParsingError', message, kw);
;;; };


;;; err.eventSetupError = function(e, message){
;;;    var message = 'Error setting up events';
;;;    return setErrorInfo(e, 'EventSetupError', message);
;;; };

}();                              /// MODULE END

