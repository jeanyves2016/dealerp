from frappe.model.document import Document

from dealerp.services.prestation_service import create_prestation_tasks


class Prestation(Document):

    def after_insert(self):
        create_prestation_tasks(self.name)
