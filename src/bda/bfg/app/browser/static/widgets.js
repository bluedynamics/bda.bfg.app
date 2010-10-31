jQuery(document).ready(function() {
	// initial binding
	bdapp.livesearchbinder();
	bdapp.tabsbinder();
	bdapp.dropdownmenubinder();
	bdapp.datepickerbinder();
	bdapp.referencebrowserbinder();
	bdapp.richtextbinder();
	
	// add binders to bdajax binding callbacks
	bdajax.binders.tabsbinder = bdapp.tabsbinder;
	bdajax.binders.dropdownmenubinder = bdapp.dropdownmenubinder;
	bdajax.binders.datepickerbinder = bdapp.datepickerbinder;
	bdajax.binders.referencebrowserbinder = bdapp.referencebrowserbinder;
	bdajax.binders.referenceaddlinkbinder = bdapp.referenceaddlinkbinder;
	bdajax.binders.richtextbinder = bdapp.richtextbinder;
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
			showAnim: null,
            showOn: 'button',
            buttonImage: '/static/icons/calendar16_16.gif',
            buttonImageOnly: true
        });
    },
	
	referencebrowserbinder: function(context) {
		jQuery('input.referencebrowser', context).referencebrowser();
		jQuery('select.referencebrowser', context).referencebrowser();
	},
	
	referenceaddlinkbinder: function(context) {
		jQuery('a.addreference').bind('click', function(event) {
			event.preventDefault();
			referencebrowser.addreference(this);
		});
	},
	
	richtextbinder: function(context) {
        jQuery('textarea.richtext').tinymce({
            // Location of TinyMCE script
            script_url: '/tiny_mce/tiny_mce.js',
            // General options
            theme: "advanced",
            plugins: "pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,inlinepopups,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template,advlist",
            // Theme options
            theme_advanced_buttons1: "save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,styleselect,formatselect,fontselect,fontsizeselect",
            theme_advanced_buttons2: "cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,anchor,image,cleanup,help,code,|,insertdate,inserttime,preview,|,forecolor,backcolor",
            theme_advanced_buttons3: "tablecontrols,|,hr,removeformat,visualaid,|,sub,sup,|,charmap,emotions,iespell,media,advhr,|,print,|,ltr,rtl,|,fullscreen",
            theme_advanced_buttons4: "insertlayer,moveforward,movebackward,absolute,|,styleprops,|,cite,abbr,acronym,del,ins,attribs,|,visualchars,nonbreaking,template,pagebreak",
            theme_advanced_toolbar_location: "top",
            theme_advanced_toolbar_align: "left",
            theme_advanced_statusbar_location: "bottom",
            theme_advanced_resizing: true
            // Example content CSS (should be your site CSS)
            // content_css : "css/content.css",
            // Drop lists for link/image/media/template dialogs
            //template_external_list_url: "lists/template_list.js",
            //external_link_list_url: "lists/link_list.js",
            //external_image_list_url: "lists/image_list.js",
            //media_external_list_url: "lists/media_list.js",
            // Replace values for the template plugin
            //template_replace_values : {
            //    username : "Some User",
            //    staffid : "991234"
            //}
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
 *     <input type="hidden" name="foo.uid" value="" />
 * 
 * for single value reference or
 * 
 *     <select name="foo" class="referencebrowser" />
 * 
 * for multi valued reference.
 * 
 * Script
 * ------
 * 
 *     jQuery('input.referencebrowser').referencebrowser();
 */
jQuery.fn.referencebrowser = function() {
	var icon = jQuery('<a>&nbsp;</a>').attr('class', 'reference16_16');
    jQuery(this).after(icon);
	icon = jQuery(this).next();
	icon.unbind('click');
	icon.bind('click', function() {
		referencebrowser.target = jQuery(this).prev().get(0);
        referencebrowser.overlay = bdajax.overlay({
            action: 'referencebrowser',
            target: ''
        });
	});
}

referencebrowser = {
	
    overlay: null,
	
    target: null,
	
    addreference: function(elem) {
        elem = jQuery(elem);
        var uid = elem.attr('id');
        uid = uid.substring(4, uid.length);
        if (!uid) {
            return;
        }
        var label = jQuery('.reftitle', elem.parent()).html();
        var target = referencebrowser.target;
        var tag = target.tagName;
        target = jQuery(target);
        // text input for single valued
        if (tag == 'INPUT') {
            target.attr('value', label);
            var sel = '[name=' + target.attr('name') + '.uid]';
            jQuery(sel).attr('value', uid);
            referencebrowser.overlay.close();
            return;
        }
        // select input for multi valued
        if (tag == 'SELECT') {
            if (jQuery('[value=' + uid + ']', target.parent()).length) {
                return;
            }
            var option = jQuery('<option></option>')
                .val(uid)
                .html(label)
                .attr('selected', 'selected')
            ;
            target.append(option);
        }
    }
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