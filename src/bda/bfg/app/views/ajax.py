import json
from zope.interface import implements
from zope.interface import Interface
from zope.interface import Attribute
from repoze.bfg.interfaces import IRequest
from repoze.bfg.threadlocal import get_current_registry
from repoze.bfg.view import bfg_view
from bda.bfg.tile import (
    ITile,
    render_tile,
    render_to_response,
)

class IAjaxActions(Interface):
    """Interface for ajax actions definition.
    
    An implementation of this interface must be registered with
    ``registerAjaxActions``.
    
    You have to provide the ``__init__`` function accepting
    ``model`` and ``request`` as parameters.
    
    You can use the ``AjaxActions`` base class which already implements the
    signature.
    """
    actions = Attribute(u'List of tilenames')

class AjaxActions(object):
    """Abstract IAjaxActions implementation.
    """
    implements(IAjaxActions)
    
    actions = list()
    
    def __init__(self, model, request):
        self.model = model
        self.request = request

def registerAjaxActions(name, actions, interface=None):
    """registers ajax actions.
    
    ``name``
        identifier of the action (for later lookup).
    
    ``actions``
        the ``IAjaxActions`` implementation to register.
    
    ``interface`` 
        Interface or Class of the bfg model the action is registered for.
    """
    registry = get_current_registry()
    registry.registerAdapter(actions, [interface, IRequest], IAjaxActions, name, 
                             event=False)

@bfg_view(name='ajaxactions', accept='application/json', renderer='json')
def ajax_actions(model, request):
    """Lookup ajaxactions by name.
    
    Request must provide the parameter ``name`` containing the ajax actions
    registration name.
    """
    registry = get_current_registry()
    name = request.params.get('name')
    action = registry.getMultiAdapter((model, request), IAjaxActions, name=name)
    return action.actions

@bfg_view(name='ajaxaction', accept='application/json', renderer='json')
def ajax_tile(model, request):
    """Render an ajax action by name.
    
    Request must provide the parameter ``name`` containing the view or tile
    name.
    """
    name = request.params.get('name')
    rendered = render_tile(model, request, name)
    # XXX: if tile not renderable, try to render bgf view with same name.
    return [name, rendered]