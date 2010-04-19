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
    jQuery('a[ajax\\:tiles]').tiles();
});

jQuery.fn.actions = function() {
    jQuery(this).bind('click', bdajax.actions);
}

jQuery.fn.tiles = function() {
    jQuery(this).bind('click', bdajax.tiles);
}

bdajax = {
	
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
    },
	
	actions: function(event) {
        var target = jQuery(this).attr('ajax:target');
        var url = bdajax.parseurl(target);
        var params = bdajax.parsequery(target);
        params.name = jQuery(this).attr('ajax:actions');
        var err = function(req, status, exception) {
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
                            var single = jQuery('#' + name);
                            var multiple = jQuery('.' + name);
                            single.replaceWith(data[1]);
                            multiple.replaceWith(data[1]);
							jQuery('#' + name + ' a[ajax\\:actions]').actions();
                            jQuery('#' + name + ' a[ajax\\:tiles]').tiles();
                            jQuery('.' + name + ' a[ajax\\:actions]').actions();
                            jQuery('.' + name + ' a[ajax\\:tiles]').tiles();
                        },
                        error: err
                    });
                }
            },
            error: err
        });
        event.preventDefault();
    },
	
	tiles: function(event) {
		var target = jQuery(this).attr('ajax:target');
        var url = bdajax.parseurl(target);
		var params = bdajax.parsequery(target);
		params.name = jQuery(this).attr('ajax:tiles');
		var err = function(req, status, exception) {
            bdajax.error(exception);
        };
		bdajax.request({
			url: url + '/ajaxtiles',
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
						url: bdajax.parseurl(url) + '/ajaxtile',
						type: 'json',
						params: params,
						success: function(data) {
                            var name = data[0];
                            var single = jQuery('#' + name);
                            var multiple = jQuery('.' + name);
                            single.replaceWith(data[1]);
                            multiple.replaceWith(data[1]);
							jQuery('#' + name + ' a[ajax\\:actions]').actions();
                            jQuery('#' + name + ' a[ajax\\:tiles]').tiles();
							jQuery('.' + name + ' a[ajax\\:actions]').actions();
                            jQuery('.' + name + ' a[ajax\\:tiles]').tiles();
                        },
			            error: err
					});
                }
            },
			error: err
		});
        event.preventDefault();
	}
};