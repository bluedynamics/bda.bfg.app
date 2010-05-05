jQuery(document).ready(function() {
	bdapp.dropdownmenubinder();
	bdajax.binders.dropdownmenubinder = bdapp.dropdownmenubinder;
});

bdapp = {
	
	dropdownmenubinder: function(context) {
	    jQuery('.dropdown').dropdownmenu();
	}
	
}

// <div class="dropdown">
//    <div class="icon">
//      <a href="http://example.com">&nbsp;</a>
//    </div>
//    <ul class="dropdown_items" style="display:none;">
//      <li>
//        <a href="http://example.com/whatever">
//          Item title
//        </a>
//      </li>
//    </ul>
//  </div>
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