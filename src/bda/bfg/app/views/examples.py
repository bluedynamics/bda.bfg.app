from repoze import formapi
from bda.bfg.tile import (
    tile, 
    Tile, 
    render_tile,
)
from bda.bfg.app.views.common import (
    Batch, 
    Form, 
)
from bda.bfg.app.views.ajax import (
    AjaxActions,
    registerAjaxActions,
)
from bda.bfg.app.views.utils import (
    nodepath, 
    make_query, 
    make_url,
)

###############################################################################
# form example
###############################################################################

class TestForm(formapi.Form):
    fields = {
        'unicodefield': unicode,
        'strfield': str,
        'intfield': int,
        'floatfield': float,
    }
    
    @formapi.validator('unicodefield')
    def check_unicodefield(self):
        if self.data['unicodefield'] != 'fillme':
            yield 'Unicodefield is invalid'
    
    @formapi.action
    def save(self, data):
        """do anything with data on save.
        """
    
    @formapi.action("cancel")
    def cancel(self, data):
        """do anything with data on cancel.
        """

@tile('testform', path='templates/testform.pt')
class TestFormTile(Form):
    
    @property
    def factory(self):
        return TestForm
    
    @property
    def formname(self):
        return 'testform'
    
    @property
    def actionnames(self):
        return {
            'default': 'Speichern',
            'cancel': 'Abbrechen',
        }
    
    @property
    def nexturl(self):
        return self.request.application_url
    
    @property
    def defaultvalues(self):
        return {
            'unicodefield': 'fillme',
            'intfield': 0,
            'floatfield': 0.0,
        }

###############################################################################
# batch example
###############################################################################

class TestBatchAjaxActions(AjaxActions):
    
    actions = [
        'testbatch',
    ]

registerAjaxActions('testbatch', TestBatchAjaxActions)

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