/*
 * bdajax.js
 * =========
 * 
 * AJAX convenience library.
 * 
 * This library provides functions for common ajax communication, event
 * rebinding and error handling.
 * 
 * XHTML namespace extension:
 * --------------------------
 * 
 * Beside functions you can use inside your own javascrips, this library
 * provides behaviour for performing ajax actions defined in the markup. This
 * action definitions use a XML namespace extension. Thus your markup must
 * define this namespace.
 * ::
 * 
 *     <html xmlns="http://www.w3.org/1999/xhtml"
 *           xmlns:ajax="http://namesspaces.bluedynamics.eu/ajax">
 *         ...
 *     </html>
 * 
 * You can define the following attributes in your markup (not all features
 * implemented yet):
 * 
 *   * ajax:action="actionname" - perform ajax action
 * 
 *   * ajax:actiomode="replace" (XXX)
 *       - replace - replace HTML at selector (default) 
 *       - inner - replace inner HTML at selector
 * 
 *   * ajax:actions="actionsname" - perform ajax actions querying actions from
 *                                  the server
 * 
 *   * ajax:actions="actionname1 actionname2" - perform ajax actions directly (XXX)
 * 
 *   * ajax:selector="a.someclass" (XXX)
 * 
 *   * ajax:event="eventname" - trigger event on selector (XXX)
 * 
 *   * ajax:call="someLocalFunction" - call function with selector (XXX)
 * 
 * Perform a single action
 * -----------------------
 * 
 * Tell ``bdajax`` to bind an ``action`` in the markup.
 * ::
 * 
 *     <a href="http://fubar.org/subpath/to/context/viewname?param=value"
 *        ajax:target="http://fubar.org/subpath/to/context?param=value"
 *        ajax:action="somename"
 *     >fubar</a>
 * 
 * ``bdajax`` binds on page load the click event to ``bdajax.action`` callback
 * on all dom elements defining an ``ajax:action`` attribute. This attribute
 * contains the actionname which gets send to the server.
 * 
 * ``ajax.target`` is used to define the context on which the request is made
 * and the query string you want to deliver. We need this because href might
 * map to something completely different for a non-javascript fallback or the
 * dom element is not a hyperlink at all.
 * 
 * When the action is triggered, ``bdajax`` calls a view named ``ajaxaction``
 * and expects a JSON response (see ``bdajax._action`` for details).
 * 
 * Perform multiple actions
 * ------------------------
 * 
 * Tell ``bdajax`` to bind multiple ``actions`` in the markup.
 * ::
 * 
 *     <a href="http://fubar.org/subpath/to/context/viewname?param=value"
 *        ajax:target="http://fubar.org/subpath/to/context?param=value"
 *        ajax:actions="somename"
 *     >fubar</a>
 * 
 * ``bdajax`` binds on page load the click event to ``bdajax.actions`` callback
 * on all dom elements defining an ``ajax:actions`` attribute. This attribute
 * contains the actions ``name`` which gets send to the server.
 * 
 * ``ajax.target`` is behaves the same way as when performing a single action.
 * 
 * When actions is triggered, ``bdajax`` calls a view named ``ajaxactions``
 * and expects a JSON response containing a list of single actions which are
 * then executed in sequence order (see ``bdajax._actions`` for details).
 * 
 * Credits:
 * --------
 * 
 *     * Written by Robert Niederreiter <rnix@squarewave.at>
 * 
 * Dependencies:
 * -------------
 *     * jQuery
 *     * jQuery tools
 */

jQuery(document).ready(function() {
	jQuery('#ajax-spinner')
        .hide()
        .ajaxStart(function() {
            jQuery(this).show();
        })
        .ajaxStop(function() {
            jQuery(this).hide();
        })
    ;
	jQuery('a[ajax\\:actions]').actions();
    jQuery('a[ajax\\:action]').action();
});

/*
 * jQuery plugin for bdajax.action
 */
jQuery.fn.action = function() {
    jQuery(this).bind('click', bdajax.action);
}

/*
 * jQuery plugin for bdajax.actions
 */
jQuery.fn.actions = function() {
    jQuery(this).bind('click', bdajax.actions);
}

bdajax = {
	
	/*
	 * Strip query from URL if existent and return.
	 * 
	 * @param url: Request URL as string.
	 */
	parseurl: function(url) {
        var idx = url.indexOf('?');
        if (idx != -1) {
            url = url.substring(0, idx);
        }
		return url;
	},
	
	/*
     * Parse query string from URL if existent and return query parameters as
     * object.
     * 
     * @param url: Request URL as string.
     */
	parsequery: function(url) {
		var params = {};
		var idx = url.indexOf('?');
        if (idx != -1) {
            var parameters = url.slice(idx + 1).split('&');
            for (var i = 0;  i < parameters.length; i++) {
                var param = parameters[i].split('=');
                params[param[0]] = param[1];
            }
        }
		return params;
	},
	
	/*
     * Error messages.
     */
    ajaxerrors: {
        timeout: 'The request has timed out. Pleasae try again.',
        error: 'An error occoured while processing the request. Aborting.',
        parsererror: 'The Response could not be parsed. Aborting.',
        unknown: 'An unknown error occoured while request. Aborting.'
    },
    
    /*
     * Get error message.
     * 
     * @param status: ``jQuery.ajax`` error callback status
     */
    ajaxerror: function(status) {
        if (status == 'notmodified') { return; }
        if (status == null) { status = 'unknown' }
        return bdajax.ajaxerrors[status];
    },
	
	/*
	 * Perform an ajax request.
	 * 
	 * By default it sends requests of type ``html`` and displays a
	 * ``bdajax.error`` Message if request fails.
	 * 
	 * Example:
	 * 
	 *     bdajax.request({
	 *         success: function(data) {
     *             // do something with data.
     *         },
	 *         url: 'foo',
	 *         params: {
     *             a: 'a',
     *             b: 'b'
     *         },
	 *         type: 'json',
	 *         error: function() {
     *             // whatever you want to do on error
     *             bdajax.error('Request failed');
     *         }
	 *     });
	 * 
	 * The given ``url`` might contain a query string. The query is parsed and
	 * written to request parameters. If the same request parameter is defined
	 * in URL request query AND params object, latter one rules.
	 * 
	 * @param config: object containing request configuration.
	 *     Configuration fields:
	 *         success: Callback if request is successful.
	 *         url: Request url as string.
	 *         params: Query parameters for request as Object (optional). 
	 *         type: ``xml``, ``json``, ``script``, or ``html`` (optional).
	 *         error: Callback if request fails (optional).
	 */
	request: function(config) {
		var success = config.success
		var url = config.url
		var params = config.params
		var type = config.type
		var error = config.error
		if (url.indexOf('?') != -1) {
			var addparams = params;
			params = bdajax.parsequery(url);
			url = bdajax.parseurl(url);
			for (var key in addparams) {
                params[key] = addparams[key];
            }
		} else {
			if (!params) { params = {}; }
		}
		if (!type) { type = 'html'; }
	    if (!error) {
	        error = function(request, status) {
				var err = bdajax.ajaxerror(status);
				if (err) { bdajax.error(err); }
	        }
	    }
	    jQuery.ajax({
	        url: url,
	        dataType: type,
	        data: params,
	        success: success,
	        error: error
	    });
	},
	
	/*
	 * Perform JSON request to server and alter element(s).
	 * 
	 * This function expects as response an array containing a name
	 * mapping to class and/or id attributes of the dom element to alter
	 * and the html payload which is used as data replacement.
	 * 
	 * @param config: object containing action configuration.
     *     Configuration fields:
     *         name: Action name.
     *         element: Dom element the event is bound to. 
     *         event: thrown event.
	 */
	_action: function(config) {
		var target = jQuery(config.element).attr('ajax:target');
        var url = bdajax.parseurl(target);
        var params = bdajax.parsequery(target);
        params.name = config.name;
		var error = function(req, status, exception) {
            bdajax.error(exception);
        };
		bdajax.request({
            url: bdajax.parseurl(config.url) + '/' + config.view,
            type: 'json',
            params: config.params,
            success: function(data) {
                var name = data[0];
                jQuery('#' + name).replaceWith(data[1]);
                jQuery('.' + name).replaceWith(data[1]);
				jQuery('#' + name + ' a[ajax\\:action]').action();
                jQuery('#' + name + ' a[ajax\\:actions]').actions();
                jQuery('.' + name + ' a[ajax\\:action]').action();
                jQuery('.' + name + ' a[ajax\\:actions]').actions();
            },
            error: error
        });
		config.event.preventDefault();
	},
	
	/*
	 * Perform JSON request to server and perform specified action(s).
	 * 
	 * This function expects as response an array containing the action name(s)
     * mapping to given actions name.
	 * 
	 * @param config: object containing action configuration.
     *     Configuration fields:
     *         name: Actions name.
     *         element: Dom element the event is bound to. 
     *         event: thrown event.
	 */
	_actions: function(config) {
        var target = jQuery(config.element).attr('ajax:target');
        var url = bdajax.parseurl(target);
        var params = bdajax.parsequery(target);
        params.name = config.name;
        var error = function(req, status, exception) {
            bdajax.error(exception);
        };
        bdajax.request({
            url: url + '/ajaxactions',
            type: 'json',
            params: params,
            success: function(data) {
                if (!data) {
                    bdajax.error('Server response empty.');
                    return;
                }
                for (var i = 0; i < data.length; i++) {
                    params.name = data[i];
					bdajax.request({
			            url: bdajax.parseurl(url) + '/ajaxaction',
			            type: 'json',
			            params: params,
			            success: function(data) {
			                var name = data[0];
			                jQuery('#' + name).replaceWith(data[1]);
			                jQuery('.' + name).replaceWith(data[1]);
							jQuery('#' + name + ' a[ajax\\:action]').action();
                            jQuery('#' + name + ' a[ajax\\:actions]').actions();
							jQuery('.' + name + ' a[ajax\\:action]').action();
                            jQuery('.' + name + ' a[ajax\\:actions]').actions();
			            },
			            error: error
			        });
                }
            },
            error: error
        });
        config.event.preventDefault();
    },
	
	/*
	 * Callback handler for an action binding.
	 */
	action: function(event) {
		bdajax._action({
			name: jQuery(this).attr('ajax:action'),
			element: this,
            event: event
        });
	},
	
	/*
     * Callback handler for an actions binding.
     */
	actions: function(event) {
		bdajax._actions({
			name: jQuery(this).attr('ajax:actions'),
			element: this,
			event: event
		});
    },
	
	/*
     * Display System message as overlay.
     * 
     * @param message: Message to display as String or DOM element.
     */
    message: function(message) {
        jQuery('#ajax-message').overlay({
            expose: {
                color: '#fff',
                loadSpeed: 200
            },
            onBeforeLoad: function() {
                var overlay = this.getOverlay();
                jQuery('.message', overlay).html(message);
            },
            closeOnClick: false,
            api: true
        }).load();
    },
    
    /*
     * Display Error message as overlay.
     * 
     * @param message: Message to display as String or DOM element.
     */
    error: function(message) {
        jQuery("#ajax-message .message")
            .removeClass('error warning info')
            .addClass('error')
        ;
        bdajax.message(message);
    },
    
    /*
     * Display Info message as overlay.
     * 
     * @param message: Message to display as String or DOM element.
     */
    info: function(message) {
        jQuery("#ajax-message .message")
            .removeClass('error warning info')
            .addClass('info')
        ;
        bdajax.message(message);
    },
    
    /*
     * Display Warning message as overlay.
     * 
     * @param message: Message to display as String or DOM element.
     */
    warning: function(message) {
        jQuery("#ajax-message .message")
            .removeClass('error warning info')
            .addClass('warning')
        ;
        bdajax.message(message);
    }
};