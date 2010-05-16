jQuery(document).ready(function() {
	bdapp.livesearchbinder();
	bdapp.tabsbinder();
	bdapp.dropdownmenubinder();
	bdapp.datepickerbinder();
	bdapp.referencebrowserbinder();
	bdajax.binders.tabsbinder = bdapp.tabsbinder;
	bdajax.binders.dropdownmenubinder = bdapp.dropdownmenubinder;
	bdajax.binders.datepickerbinder = bdapp.datepickerbinder;
	bdajax.binders.referencebrowserbinder = bdapp.referencebrowserbinder;
});

bdapp = {
	
	livesearchbinder: function(context) {
		jQuery('input#search-text').autocomplete({
            source: 'livesearch',
			minLength: 3,
			select: function(event, ui) {
				jQuery('input#search-text').val('');
				bdajax.action({
					name: 'content',
                    selector: '#content',
                    mode: 'inner',
                    url: ui.item.target,
					params: {}
				});
				bdajax.trigger('contextchanged',
				               '.contextsensitiv',
							   ui.item.target);
                return false;
            }
        });
	},
	
	tabsbinder: function(context) {
		// XXX: make it possible to bind ajax tabs by indicating ajax via 
		//      css class.
		jQuery("ul.tabs").tabs("div.tabpanes > div");
	},
	
	dropdownmenubinder: function(context) {
	    jQuery('.dropdown').dropdownmenu();
	},
	
	datepickerbinder: function(context) {
        jQuery('input.datepicker').datepicker({
            showOn: 'button',
            buttonImage: '/static/icons/calendar16_16.gif',
            buttonImageOnly: true
        });
    },
	
	referencebrowserbinder: function(context) {
		jQuery('.referencebrowser').referencebrowser({
            multiple: false
        });
		jQuery('.referencebrowser-multiple').referencebrowser({
            multiple: true
        });
	}
}

/*
 * Reference Browser
 * =================
 * 
 * Markup
 * ------
 * 
 *     <input type="text" name="foo" class="referencebrowser" />
 *     
 *     <input type="text" name="foo" class="referencebrowser-multiple" />
 * 
 * Script
 * ------
 * 
 *     jQuery('.referencebrowser').dropdownmenu({
 *         multiple: false
 *     });
 */
jQuery.fn.referencebrowser = function(options) {
	this.unbind('focus');
	this.bind('focus', function() {
		var overlay_api = bdajax.overlay({
	        action: 'referencebrowser',
			target: ''
	    });
	});
}

/* 
 * Dropdown menu
 * =============
 * 
 * Markup
 * ------
 * 
 *     <div class="dropdown">
 *       <div class="icon">
 *         <a href="http://example.com">&nbsp;</a>
 *       </div>
 *       <ul class="dropdown_items" style="display:none;">
 *         <li>
 *           <a href="http://example.com/whatever">
 *             Item title
 *           </a>
 *         </li>
 *       </ul>
 *     </div>
 * 
 * Script
 * ------
 * 
 *     jQuery('.dropdown').dropdownmenu({
 *         menu: '.dropdown_items',
 *         trigger: '.icon a'
 *     });
 */
jQuery.fn.dropdownmenu = function (options) {
	var selector = this.selector;
	var trigger = options ? (options.trigger ? options.trigger : '.icon a')
	                      : '.icon a';
	var menu = options ? (options.menu ? options.menu : '.dropdown_items')
                       : '.dropdown_items';
	jQuery(this).unbind('click');
    jQuery(trigger, this).bind('click', function(event) {
		event.preventDefault();
		var container = jQuery(menu, jQuery(this).parents(selector + ':first'));
		jQuery(document).bind('mousedown', function(event) {
            if (jQuery(event.target).parents(selector + ':first').length) {
                return true;
            }
            container.css('display', 'none');
        });
		container.css('display', 'block');
	});
}

/*
 * Configure datepicker languages.
 * 
 * XXX: Currently only 'de'.
 */
jQuery(function() {
    jQuery.datepicker.regional['de'] = {
        clearText: 'löschen',
        clearStatus: 'aktuelles Datum löschen',
        closeText: 'schließen',
        closeStatus: 'ohne Änderungen schließen',
        prevText: '&#x3c;zurück',
        prevStatus: 'letzten Monat zeigen',
        nextText: 'Vor&#x3e;',
        nextStatus: 'nächsten Monat zeigen',
        currentText: 'heute',
        currentStatus: '',
        monthNames: [
            'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
        ],
        monthNamesShort: [
            'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
            'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
        ],
        monthStatus: 'anderen Monat anzeigen',
        yearStatus: 'anderes Jahr anzeigen',
        weekHeader: 'Wo',
        weekStatus: 'Woche des Monats',
        dayNames: [
            'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
            'Donnerstag', 'Freitag', 'Samstag'
        ],
        dayNamesShort: [
            'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'
        ],
        dayNamesMin: [
            'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'
        ],
        dayStatus: 'Setze DD als ersten Wochentag',
        dateStatus: 'Wähle D, M d',
        dateFormat: 'dd.mm.yy',
        firstDay: 1, 
        initStatus: 'Wähle ein Datum',
        isRTL: false
    };
    jQuery.datepicker.setDefaults(jQuery.datepicker.regional['de']);
});