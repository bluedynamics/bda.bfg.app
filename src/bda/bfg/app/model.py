from zope.interface import implements
from zodict.node import LifecycleNode
from repoze.bfg.threadlocal import get_current_request
from repoze.bfg.security import Everyone
from repoze.bfg.security import Allow
from repoze.bfg.security import Deny
from repoze.bfg.security import ALL_PERMISSIONS
from repoze.bfg.security import authenticated_userid

class BaseNode(LifecycleNode):
    """Base application model node.
    """
    __acl__ = [
        (Allow, 'group:authenticated', 'view'),
        (Allow, Everyone, 'login'),
        (Deny, Everyone, ALL_PERMISSIONS),
    ]
    in_navtree = True

    @property
    def title(self):
        return self.__name__
    
class FactoryNode(BaseNode):
    """Base application model node with factories.
    """
    factories = {}
    
    def __iter__(self):
        keys = set()
        for key in self.factories.keys():
            keys.add(key)
        for key in LifecycleNode.__iter__(self):
            keys.add(key)
        for key in keys:
            yield key
    
    iterkeys = __iter__
    
    def __getitem__(self, key):
        try:
            child = LifecycleNode.__getitem__(self, key)
        except KeyError, e:
            if not key in self:
                raise KeyError
            child = self.factories[key]()
            self[key] = child
        return child
    
# BBB
Base = FactoryNode

class NodeAdapter(BaseNode):
    """Could be used to adapt other Node implementations you want to use as
    application model node.
    
    This object just calls the equivalent adapted node's functions on common
    read operations.
    """
    
    def __init__(self, node, name, parent):
        """Name and parent are used to hook the correct application hierarchy.
        """
        self.node = node
        self.__name__ = name
        self.__parent__ = parent
    
    def __getitem__(self, key):
        return self.node[key]
    
    def __contains__(self, key):
        return key in self.node.keys()
    
    def __len__(self):
        return len(self.node)
    
    def __iter__(self):
        for key in self.node:
            yield key
    
    iterkeys = __iter__
    
    def keys(self):
        return self.node.keys()
    
    def itervalues(self):
        for value in self.node.itervalues():
            yield value
    
    def values(self):
        return list(self.itervalues())
    
    def iteritems(self):
        for item in self.node.iteritems():
            yield item
    
    def items(self):
        return list(self.iteritems())
    
    def get(self, key, default=None):
        return self.node.get(key, default)
    
    @property
    def attrs(self):
        return self.node.attrs