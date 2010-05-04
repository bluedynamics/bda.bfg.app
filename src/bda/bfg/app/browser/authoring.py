from repoze.bfg.view import bfg_view
from bda.bfg.tile import (
    Tile,
    tile,
    registerTile,
    render_tile,
)
from bda.bfg.app.model import (
    getNodeInfo,
    Properties,
    BaseNode,
    AdapterNode,
)
from bda.bfg.app.browser import render_main_template
from bda.bfg.app.browser.layout import ProtectedContentTile
from bda.bfg.app.browser.utils import (
    make_url,
    make_query,
)

@bfg_view('add', permission='login')
def add(model, request):
    return render_main_template(model, request, contenttilename='add')

@tile('add', 'templates/add.pt', permission='login', strict=False)
class AddTile(ProtectedContentTile):
    
    @property
    def addform(self):
        factory = self.request.params.get('factory')
        allowed = self.model.properties.addables
        if not factory or not allowed or not factory in allowed:
            return u'Unknown factory'
        nodeinfo = getNodeInfo(factory)
        if AdapterNode in nodeinfo.node.__bases__:
            addmodel = nodeinfo.node(BaseNode(), None, None)
        else:
            addmodel = nodeinfo.node()
        addmodel.__parent__ = self.model
        return render_tile(addmodel, self.request, 'addform')

@bfg_view('edit', permission='login')
def edit(model, request):
    return render_main_template(model, request, contenttilename='edit')

registerTile('edit',
             'bda.bfg.app:browser/templates/edit.pt',
             class_=ProtectedContentTile,
             permission='login',
             strict=False)

@tile('add_dropdown', 'templates/add_dropdown.pt', strict=False)
class AddDropdown(Tile):
    
    @property
    def items(self):
        ret = list()
        addables = self.model.properties.addables
        if not addables:
            return ret
        for addable in addables:
            info = getNodeInfo(addable)
            if not info:
                continue
            query = make_query(factory=addable)
            url = make_url(self.request, node=self.model,
                           resource='add', query=query)
            target = make_url(self.request, node=self.model, query=query)
            props = Properties()
            props.url = url
            props.target = target
            props.title = info.title
            props.icon = info.icon
            ret.append(props)
        return ret

registerTile('contextmenu',
             'bda.bfg.app:browser/templates/contextmenu.pt',
             permission='login',
             strict=True)