from yafowil.base import factory
from yafowil.controller import Controller
from paste.httpexceptions import HTTPFound
from bda.bfg.tile import Tile

class Form(Tile):
    
    @property
    def form(self):
        """Return yafowil compound.
        
        Not implemented in base class.
        """
        raise NotImplementedError(u"``form`` property must be provided "
                                  u"by deriving object.")
    
    def __call__(self, model, request):
        self.model = model
        self.request = request
        return self._process_form(self.form)
    
    def _process_form(self, form):
        self.prepare()
        if not self.show:
            return ''
        controller = Controller(form, self.request)
        if not controller.next:
            return controller.rendered
        if isinstance(controller.next, HTTPFound):
            self.redirect(controller.next.location())
            return
        return controller.next
        
class AddForm(Form):
    """form hooking the hidden value 'factory' to self.form on __call__
    """
    
    def __call__(self, model, request):
        self.model = model
        self.request = request
        form = self.form
        form['factory'] = factory('loop', value=request.params.get('factory'))
        return self._process_form(form)