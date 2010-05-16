from yafowil.base import (
    factory,
    UNSET,
    ExtractionError,
)
from yafowil.common import (
    _value,
    generic_extractor,
    generic_required_extractor,
    select_renderer,
    select_extractor,
)
from yafowil.utils import (
    tag,
    cssid,
    cssclasses,
)
from bda.bfg.tile import (
    tile,
    registerTile,
)
from bda.bfg.app.browser.layout import PathBar
from bda.bfg.app.browser.contents import (
    ContentsTile,
    ContentsBatch,
)

def reference_extractor(widget, data):
    if widget.attrs.get('multivalued'):
        return select_extractor(widget, data)
    return data.request.get('%s.uid' % widget.dottedpath)

def reference_renderer(widget, data):
    if widget.attrs.get('multivalued'):
        return select_renderer(widget, data)
    css = widget.attrs.get('css', list())
    if isinstance(css, basestring):
        css = [css]
    text_attrs = {
        'type': 'text',
        'value': _value(widget, data), # XXX get title for UID
        'name_': widget.dottedpath,
        'id': cssid(widget, 'input'),
        'class_': cssclasses(widget, data, *css),    
    }
    hidden_attrs = {
        'type': 'hidden',
        'value': _value(widget, data),
        'name_': '%s.uid' % widget.dottedpath,
    }
    return tag('input', **text_attrs) + tag('input', **hidden_attrs)

factory.defaults['reference.required_class'] = 'required'
factory.defaults['reference.default'] = ''
factory.defaults['reference.format'] = 'block'
factory.defaults['reference.css'] = 'referencebrowser'
factory.register(
    'reference', 
    [
        generic_extractor,
        generic_required_extractor,
        reference_extractor,
    ], 
    [
        reference_renderer,
    ],
)

registerTile('referencebrowser',
             'bda.bfg.app:browser/templates/referencebrowser.pt',
             permission='view',
             strict=False)

registerTile('referencebrowser_pathbar',
             'bda.bfg.app:browser/templates/referencebrowser_pathbar.pt',
             permission='view',
             class_=PathBar,
             strict=False)

@tile('referencelisting', 'templates/referencelisting.pt', strict=False)
class ReferenceListing(ContentsTile):
    
    @property
    def batch(self):
        batch = ContentsBatch(self.contents)
        batch.name = 'referencebatch'
        return batch(self.model, self.request)