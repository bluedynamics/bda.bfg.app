from bda.bfg.tile import (
    tile,
    Tile,
    render_tile,
)

@tile('contents', 'templates/contents.pt', strict=False)
class Contents(Tile):
    """Contents tile.
    
    XXX: batching
    """
    
    @property
    def items(self):
        return [self.model[key] for key in self.model.keys()]