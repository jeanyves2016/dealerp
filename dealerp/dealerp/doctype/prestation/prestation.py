import frappe
from frappe.model.document import Document

from dealerp.services.prestation_service import create_prestation_tasks


class Prestation(Document):

    def validate(self):
        self.validate_dossier()
        self.sync_from_dossier()
        self.validate_expedition()

    def validate_dossier(self):
        """
        Une Prestation appartient obligatoirement à un Dossier.

        Le Dossier est le parent métier de l'activité.
        """

        if not self.dossier:
            frappe.throw(
                "Cette prestation doit obligatoirement être rattachée à un Dossier."
            )

        dossier = frappe.get_doc("Dossier", self.dossier)

        # Cohérence client
        if (
            self.custom_client
            and dossier.customer
            and self.custom_client != dossier.customer
        ):
            frappe.throw(
                f"Le client de la prestation ({self.custom_client}) "
                f"ne correspond pas au client du Dossier ({dossier.customer})."
            )

    def sync_from_dossier(self):
        """
        Le Dossier est la source de vérité pour les informations générales.
        """

        dossier = frappe.get_doc("Dossier", self.dossier)

        if dossier.customer:
            self.custom_client = dossier.customer

        if dossier.owner_user:
            self.responsable = dossier.owner_user

    def validate_expedition(self):
        """
        Si une prestation est rattachée à une expédition,
        celle-ci doit appartenir au même Dossier.
        """

        if not self.expedition:
            return

        expedition_dossier = frappe.db.get_value(
            "Expedition",
            self.expedition,
            "deal_dossier"
        )

        if not expedition_dossier:
            frappe.throw(
                "L'expédition sélectionnée n'est rattachée à aucun Dossier."
            )

        if expedition_dossier != self.dossier:
            frappe.throw(
                "L'expédition sélectionnée appartient à un autre Dossier."
            )

    def after_insert(self):
        create_prestation_tasks(self.name)
