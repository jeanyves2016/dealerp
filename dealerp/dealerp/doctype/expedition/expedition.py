import frappe
from frappe.model.document import Document


class Expedition(Document):

    def after_insert(self):
        """Création automatique du dossier"""

        if self.deal_dossier:
            return

        dossier = frappe.get_doc({
            "doctype": "Dossier"
        }).insert(ignore_permissions=True)

        self._sync_dossier(dossier)

        self.db_set("deal_dossier", dossier.name)


    def on_update(self):
        """Synchronisation du dossier"""

        if not self.deal_dossier:
            return

        dossier = frappe.get_doc("Dossier", self.deal_dossier)

        self._sync_dossier(dossier)


    def on_cancel(self):
        pass


    def on_trash(self):
        pass


    def _sync_dossier(self, dossier):
        """Synchronise les champs Expedition -> Dossier"""

        dossier.dossier_number = dossier.name

        dossier.customer = self.custom_client
        dossier.company = self.custom_société
        dossier.owner_user = self.custom_responsable

        dossier.internal_reference = self.name
        dossier.description = self.goods_description

        dossier.save(ignore_permissions=True)
