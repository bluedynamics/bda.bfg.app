from paste.httpexceptions import HTTPFound
from yafowil.controller import Controller
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
        self.prepare()
        if not self.show:
            return ''
        controller = Controller(self.form, request)
        if not controller.next:
            return controller.rendered
        if isinstance(controller.next, HTTPFound):
            self.redirect(controller.next.location())
            return
        return controller.next