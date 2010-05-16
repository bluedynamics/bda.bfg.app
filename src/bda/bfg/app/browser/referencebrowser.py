from bda.bfg.tile import (
    tile,
    registerTile,
    Tile,
)
from bda.bfg.app.browser.layout import PathBar
from bda.bfg.app.browser.contents import (
    Contents,
    ContentsBatch,
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
class ReferenceListing(Tile):
    
    @property
    def contents(self):
        return Contents(self.model, self.request)
    
    @property
    def batch(self):
        batch = ContentsBatch(self.contents)
        batch.name = 'referencebatch'
        return batch(self.model, self.request)