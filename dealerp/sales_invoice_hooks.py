import frappe

from dealerp.validation import (
    validate_same_company,
    validate_invoice_reference,
)
from dealerp.financial import (
    recalculate_expedition,
    recalculate_prestation,
)


def validate_invoice_dossier(doc):
    """
    Le Dossier est obligatoire pour toute facture client Dealerp.

    Le Dossier est le parent métier de l'activité.
    Toute Expédition ou Prestation éventuellement liée à la facture
    doit appartenir au même Dossier.
    """

    # --------------------------------------------------
    # DOSSIER OBLIGATOIRE
    # --------------------------------------------------

    if not doc.custom_dossier:
        frappe.throw(
            "Cette facture doit obligatoirement être rattachée à un Dossier."
        )

    dossier = frappe.db.get_value(
        "Dossier",
        doc.custom_dossier,
        [
            "name",
            "customer",
            "company",
        ],
        as_dict=True,
    )

    if not dossier:
        frappe.throw(
            f"Le Dossier {doc.custom_dossier} n'existe pas."
        )

    # --------------------------------------------------
    # COHERENCE CLIENT
    # --------------------------------------------------

    if (
        doc.customer
        and dossier.customer
        and doc.customer != dossier.customer
    ):
        frappe.throw(
            f"Le client de la facture ({doc.customer}) "
            f"ne correspond pas au client du Dossier "
            f"({dossier.customer})."
        )

    # --------------------------------------------------
    # COHERENCE EXPEDITION
    # --------------------------------------------------

    if doc.custom_expedition_shipment:

        expedition_dossier = frappe.db.get_value(
            "Expedition",
            doc.custom_expedition_shipment,
            "deal_dossier",
        )

        if not expedition_dossier:
            frappe.throw(
                "L'expédition sélectionnée n'est rattachée à aucun Dossier."
            )

        if expedition_dossier != doc.custom_dossier:
            frappe.throw(
                "L'expédition sélectionnée appartient à un autre Dossier."
            )

    # --------------------------------------------------
    # COHERENCE PRESTATION
    # --------------------------------------------------

    if doc.custom_prestation:

        prestation_dossier = frappe.db.get_value(
            "Prestation",
            doc.custom_prestation,
            "dossier",
        )

        if not prestation_dossier:
            frappe.throw(
                "La prestation sélectionnée n'est rattachée à aucun Dossier."
            )

        if prestation_dossier != doc.custom_dossier:
            frappe.throw(
                "La prestation sélectionnée appartient à un autre Dossier."
            )


def _recalculate(doc):
    """
    Recalcule les éléments financiers liés à la facture.

    Une facture Dealerp peut être rattachée à une Expédition,
    une Prestation et obligatoirement à un Dossier.
    """

    if doc.custom_expedition_shipment:
        recalculate_expedition(
            doc.custom_expedition_shipment
        )

    if doc.custom_prestation:
        recalculate_prestation(
            doc.custom_prestation
        )

    if doc.custom_dossier:
        from dealerp.financial import recalculate_dossier

        recalculate_dossier(
            doc.custom_dossier
        )


def on_validate(doc, method):
    # Le Dossier est désormais le rattachement métier obligatoire.
    validate_invoice_dossier(doc)

    # Conservation de la validation existante.
    validate_invoice_reference(doc)


def on_submit(doc, method):

    validate_invoice_dossier(doc)

    validate_same_company(
        doc,
        doc.custom_expedition_shipment
    )

    _recalculate(doc)


def on_cancel(doc, method):
    _recalculate(doc)


def on_update_after_submit(doc, method):
    _recalculate(doc)


def on_trash(doc, method):
    _recalculate(doc)
