from bda.bfg.tile import (
    tile,
    Tile,
    render_tile,
)
from bda.bfg.app.browser.batch import Batch
from bda.bfg.app.browser.utils import (
    nodepath, 
    make_query, 
    make_url,
)

@tile('contents', 'templates/contents.pt', strict=False)
class ContentsTile(Tile):
    
    @property
    def contents(self):
        return Contents(self.model, self.request)
    
    @property
    def batch(self):
        return ContentsBatch(self.contents)(self.model, self.request)

class Contents(object):
    
    sortkeys = {
        'title': lambda x: x.metadata.title.lower(),
        'creator': lambda x: x.metadata.creator.lower(),
        'created': lambda x: x.metadata.created,
        'modified': lambda x: x.metadata.modified,
    }
    
    def __init__(self, model, request):
        self.model = model
        self.request = request
        self.slicesize = 10
    
    @property
    def sort(self):
        return self.request.params.get('sort')
    
    @property
    def sorted(self):
        items = [self.model[key] for key in self.model.keys()]
        if self.sort in self.sortkeys:
            items = sorted(items, key=self.sortkeys[self.sort])
        return items
    
    @property
    def slice(self):
        current = int(self.request.params.get('b_page', '0'))
        start = current * self.slicesize
        end = start + self.slicesize
        return start, end
    
    @property
    def items(self):
        start, end = self.slice
        if not self.sort:
            return [self.model[key] for key in self.model.keys()[start:end]]
        return self.sorted[start:end]

class ContentsBatch(Batch):
    
    def __init__(self, contents):
        self.name = 'contentsbatch'
        self.path = None
        self.attribute = 'render'
        self.contents = contents
    
    @property
    def display(self):
        return len(self.vocab) > 1
    
    @property
    def vocab(self):
        ret = list()
        path = nodepath(self.model)
        count = len(self.model.keys())
        pages = count / self.contents.slicesize
        if count % self.contents.slicesize != 0:
            pages += 1
        current = self.request.params.get('b_page', '0')
        for i in range(pages):
            query = make_query(b_page=str(i))
            url = make_url(self.request, path=path, query=query)
            ret.append({
                'page': '%i' % (i + 1),
                'current': current == str(i),
                'visible': True,
                'url': url,
            })
        return ret