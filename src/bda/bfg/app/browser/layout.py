from repoze.bfg.security import has_permission
from bda.bfg.tile import (
    tile,
    Tile,
    render_tile,
    render_template,
    registerTile,
)
from bda.bfg.app.browser.utils import (
    authenticated,
    nodepath,
    make_url,
    format_date,
)

class ProtectedContentTile(Tile):
    """A tile rendering the loginform instead default if user is not
    authenticated.
    """
    
    def __call__(self, model, request):
        if not authenticated(request):
            return render_tile(model, request, 'loginform')
        return Tile.__call__(self, model, request)

@tile('personaltools', 'templates/personaltools.pt', strict=False)
class PersonalTools(Tile):
    """Personal tool tile.
    """

@tile('mainmenu', 'templates/mainmenu.pt', strict=False)
class MainMenu(Tile):
    """Main Menu tile.
    """
    
    @property
    def menuitems(self):
        ret = list()
        count = 0
        path = nodepath(self.model)
        if path:
            curpath = path[0]
        else:
            curpath = ''
        # work with ``self.model.root.keys()``, ``values()`` propably not works
        # due to the use of factory node.
        for key in self.model.root.keys():
            if not has_permission('view', self.model.root[key], self.request):
                continue
            url = make_url(self.request, path=[key])
            item = dict()
            item['title'] = key
            item['url'] = url
            item['selected'] = curpath == key
            item['first'] = count == 0
            ret.append(item)
            count += 1
        return ret

@tile('pathbar', 'templates/pathbar.pt', strict=False)
class PathBar(Tile):
    
    @property
    def items(self):
        model = self.model
        ret = [{
            'title': model.metadata.title,
            'url': make_url(self.request, node=model),
            'selected': True,
        }]
        while model.__parent__ is not None:
            model = model.__parent__
            ret.append({
                'title': model.metadata.title,
                'url': make_url(self.request, node=model),
                'selected': False,
            })
        ret.pop()
        ret.reverse()
        return ret

@tile('navtree', 'templates/navtree.pt', strict=False)
class NavTree(Tile):
    """Navigation tree tile.
    """
    
    def navtreeitem(self, title, url, path):
        item = dict()
        item['title'] = title
        item['url'] = url
        item['selected'] = False
        item['path'] = path
        item['showchildren'] = False
        item['children'] = list()
        return item
    
    def fillchildren(self, model, path, tree):
        if path:
            curpath = path[0]
        else:
            curpath = None
        for key in model:
            node = model[key]
            if not has_permission('view', node, self.request):
                continue
            if not node.properties.get('in_navtree'):
                continue
            title = node.metadata.title
            url = make_url(self.request, node=node)
            curnode = curpath == key and True or False
            child = self.navtreeitem(title, url, nodepath(node))
            child['showchildren'] = curnode
            if curnode:
                self.fillchildren(node, path[1:], child)
            selected = False
            if nodepath(self.model) == nodepath(node):
                selected = True
            child['selected'] = selected
            child['showchildren'] = curnode
            tree['children'].append(child)
    
    def navtree(self):
        root = self.navtreeitem(None, None, '')
        model = self.model.root
        path = nodepath(self.model)
        self.fillchildren(model, path, root)
        return root
    
    def rendertree(self, children, level=1):
        return render_template('bda.bfg.app.browser:templates/navtree_recue.pt',
                               model=self.model,
                               request=self.request,
                               context=self,
                               children=children,
                               level=level)

@tile('byline', 'templates/byline.pt', strict=False)
class Byline(Tile):
    """Byline tile.
    """
    
    def format_date(self, dt):
        return format_date(dt)

registerTile('listing',
             'bda.bfg.app:browser/templates/listing.pt',
             class_=ProtectedContentTile,
             permission='login',
             strict=False)