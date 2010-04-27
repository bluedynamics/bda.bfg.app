from bda.bfg.tile import (
    tile, 
    Tile, 
    render_tile,
)
from bda.bfg.app.views.common import (
    Batch, 
    Form, 
)
from bda.bfg.app.views.utils import (
    nodepath, 
    make_query, 
    make_url,
)

###############################################################################
# form example
###############################################################################

# XXX:

###############################################################################
# batch example
###############################################################################

@tile('testbatch')
class TestBatch(Batch):
    
    @property
    def vocab(self):
        ret = list()
        path = nodepath(self.model)
        current = self.request.params.get('b_page', '0')
        for i in range(10):
            query = make_query(b_page=str(i))
            url = make_url(self.request, path=path, query=query)
            ret.append({
                'page': '%i' % i,
                'current': current == str(i),
                'visible': True,
                'url': url,
            })
        return ret