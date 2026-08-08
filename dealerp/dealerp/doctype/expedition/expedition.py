import frappe
from frappe.model.document import Document

from dealerp.services.dossier_service import get_or_create_dossier


class Expedition(Document):

    def after_insert(self):
        """Crée ou récupère le dossier associé à l'expédition."""

        dossier = get_or_create_dossier(
            customer=self.custom_client,
            company=self.custom_société,
            owner_user=self.custom_responsable,
            expedition=self.name,
            description=self.goods_description,
        )

        if self.deal_dossier != dossier.name:
            self.db_set("deal_dossier", dossier.name)

    def on_update(self):
        """Synchronise les informations de l'expédition vers son dossier."""

        if not self.deal_dossier:
            return

        dossier = frappe.get_doc("Dossier", self.deal_dossier)

        dossier.dossier_number = dossier.name
        dossier.customer = self.custom_client
        dossier.company = self.custom_société
        dossier.owner_user = self.custom_responsable

        # Ne pas écraser une référence commerciale existante.
        if not dossier.internal_reference:
            dossier.internal_reference = self.name

        dossier.description = self.goods_description

        dossier.save(ignore_permissions=True)

    def on_cancel(self):
        pass

    def on_trash(self):
        pass
