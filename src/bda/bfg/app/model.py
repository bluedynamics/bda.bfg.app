from zope.interface import implements
from zodict.node import LifecycleNode, AttributedNode
from repoze.bfg.threadlocal import get_current_request
from repoze.bfg.security import Everyone
from repoze.bfg.security import Allow
from repoze.bfg.security import Deny
from repoze.bfg.security import ALL_PERMISSIONS
from repoze.bfg.security import authenticated_userid
from bda.bfg.app.interfaces import (
    IApplicationNode,
    IFactoryNode,
    IMetadata,
)

class BaseNode(AttributedNode):
#class BaseNode(LifecycleNode):
    implements(IApplicationNode)
    
    __acl__ = [
        (Allow, 'group:authenticated', 'view'),
        (Allow, Everyone, 'login'),
        (Deny, Everyone, ALL_PERMISSIONS),
    ]
    
    properties = dict()
    
    @property
    def metadata(self):
        return BaseMetadata(self.attrs)
    
    @property
    def title(self):
        if self.metadata.get('title'):
            return self.metadata.title
        return self.__name__
    
class FactoryNode(BaseNode):
    implements(IFactoryNode)
    
    factories = {}
    
    def __iter__(self):
        keys = set()
        for key in self.factories.keys():
            keys.add(key)
        for key in AttributedNode.__iter__(self):
        #for key in LifecycleNode.__iter__(self):
            keys.add(key)
        for key in keys:
            yield key
    
    iterkeys = __iter__
    
    def __getitem__(self, key):
        try:
            child = AttributedNode.__getitem__(self, key)
            #child = LifecycleNode.__getitem__(self, key)
        except KeyError, e:
            if not key in self:
                raise KeyError
            child = self.factories[key]()
            self[key] = child
        return child

class NodeAdapter(BaseNode):
    
    def __init__(self, node, name, parent):
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

class BaseMetadata(object):
    implements(IMetadata)
    
    def __init__(self, data):
        object.__setattr__(self, 'data', data)
    
    def __getitem__(self, key):
        return self._data()[key]
    
    def get(self, key, default=None):
        return self._data().get(key, default)
    
    def __contains__(self, key):
        return key in self._data()
    
    def __getattr__(self, name):
        return self._data().get(name)
    
    def __setattr__(self, name, value):
        self._data()[name] = value
    
    def _data(self):
        return object.__getattribute__(self, 'data')