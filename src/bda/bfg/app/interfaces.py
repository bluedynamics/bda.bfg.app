from zope.interface import Attribute
from zope.interface.common.mapping import IReadMapping
from zodict.interfaces import IAttributedNode

class IApplicationNode(IAttributedNode):
    """Application Node interface.
    """
    
    __acl__ = Attribute(u"ACL")

    in_navtree = Attribute(u"Flag wether Node should be displayed in navtree. "
                           u"XXX: remove this from ApplicationNode interface. "
                           u"Its a navtree widget specific info and must be "
                           u"handled elsewhere.")

    title = Attribute(u"Node Title")
    
    metadata = Attribute(u"IMetadata implementation")

class IMetadata(IReadMapping):
    """Interface for providing metadata for application nodes.
    """
    
    def __getattr__(name):
        """Return metadata by attribute access.
        """
    
    def __setattr__(name, value):
        """Set metadata by attribute access.
        """