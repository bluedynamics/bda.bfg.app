from zope.interface import implements
from zodict.node import Node
from repoze.bfg.threadlocal import get_current_request
from repoze.bfg.security import Everyone
from repoze.bfg.security import Allow
from repoze.bfg.security import Deny
from repoze.bfg.security import ALL_PERMISSIONS
from repoze.bfg.security import authenticated_userid

class Base(Node):
    """Base application model node.
    """
    __acl__ = [
        (Allow, 'group:authenticated', 'view'),
        (Deny, Everyone, ALL_PERMISSIONS),
    ]
    factories = {}
    in_navtree = True
    
    def __init__(self):
        Node.__init__(self)

    def __iter__(self):
        keys = set()
        for key in self.factories.keys():
            keys.add(key)
        for key in Node.__iter__(self):
            keys.add(key)
        for key in keys:
            yield key
    
    iterkeys = __iter__
    
    def __getitem__(self, key):
        try:
            child = Node.__getitem__(self, key)
        except KeyError, e:
            if not key in self:
                raise KeyError
            child = self.factories[key]()
            self[key] = child
        return child
    
    @property
    def title(self):
        return self.__name__