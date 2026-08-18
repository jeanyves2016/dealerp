import frappe
from frappe.model.document import Document


class Expedition(Document):

    def validate(self):
        self.validate_dossier()
        self.sync_from_dossier()

    def validate_dossier(self):
        """
        Une Expédition appartient obligatoirement à un Dossier.

        Le Dossier est le parent métier de l'activité.
        Une Expédition ne doit jamais créer elle-même un Dossier.
        """

        if not self.deal_dossier:
            frappe.throw(
                "Cette expédition doit obligatoirement être rattachée à un Dossier."
            )

        dossier = frappe.get_doc("Dossier", self.deal_dossier)

        # Cohérence client
        if (
            self.custom_client
            and dossier.customer
            and self.custom_client != dossier.customer
        ):
            frappe.throw(
                f"Le client de l'expédition ({self.custom_client}) "
                f"ne correspond pas au client du Dossier ({dossier.customer})."
            )

        # Cohérence société
        if (
            self.custom_société
            and dossier.company
            and self.custom_société != dossier.company
        ):
            frappe.throw(
                f"La société de l'expédition ({self.custom_société}) "
                f"ne correspond pas à la société du Dossier ({dossier.company})."
            )

        # Cohérence commande client
        if self.custom_sales_order and dossier.sales_order:
            if self.custom_sales_order != dossier.sales_order:
                frappe.throw(
                    "La commande client de l'expédition "
                    "ne correspond pas à celle du Dossier."
                )

    def sync_from_dossier(self):
        """
        Le Dossier est la source de vérité pour les informations
        générales de l'Expédition.
        """

        dossier = frappe.get_doc("Dossier", self.deal_dossier)

        if dossier.customer:
            self.custom_client = dossier.customer

        if dossier.company:
            self.custom_société = dossier.company

        if dossier.owner_user:
            self.custom_responsable = dossier.owner_user

        if dossier.sales_order:
            self.custom_sales_order = dossier.sales_order

        if not self.goods_description and dossier.description:
            self.goods_description = dossier.description
