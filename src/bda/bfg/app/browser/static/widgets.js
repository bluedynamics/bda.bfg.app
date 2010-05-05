jQuery(document).ready(function() {
	dropdownmenubinder();
	bdajax.binders.dropdownmenubinder = dropdownmenubinder;
});

dropdownmenubinder = function(context) {
	jQuery('.dropdown').dropdownmenu();
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
jQuery.fn.dropdownmenu = function () {
	jQuery(this).unbind('click');
    jQuery('.icon a', this).bind('click', function(event) {
		event.preventDefault();
		var container = jQuery('.dropdown_items',
		                       jQuery(this).parent().parent());
		jQuery(document).bind('mousedown', function(event) {
            if (!event) {
                var event = window.event;
            }
            if (event.target) {
                var target = event.target;
            } else if (event.srcElement) {
                var target = event.srcElement;
            }
			if (!jQuery('.dropdown', jQuery(target)).get(0)) {
				return true;
			}
            container.css('display', 'none');
        });
		container.css('display', 'block');
	});
}