from zope.interface import Attribute
from zope.interface.common.mapping import IReadMapping
from zodict.interfaces import IAttributedNode

class IApplicationNode(IAttributedNode):
    """Application Node interface.
    """
    
    __acl__ = Attribute(u"ACL")

    properties = Attribute(u"Properties for this application Node")
    
    metadata = Attribute(u"IMetadata implementation")
    
    title = Attribute(u"Node Title")

class IMetadata(IReadMapping):
    """Interface for providing metadata for application nodes.
    """
    
    def __getattr__(name):
        """Return metadata by attribute access.
        
        Never throws an AttributeError if attribute does not exists, return
        None instead.
        """
    
    def __setattr__(name, value):
        """Set metadata by attribute access.
        """