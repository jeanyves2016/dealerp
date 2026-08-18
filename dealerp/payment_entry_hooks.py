import frappe

from dealerp.financial import (
    recalculate_expedition,
    recalculate_prestation,
    recalculate_dossier,
)


def validate_payment_references(doc):
    """
    Vérifie les factures Dealerp référencées par le paiement.

    Relation :

        Payment Entry
            ↓
        Facture
            ↓
        Dossier
    """

    for reference in doc.references or []:

        if reference.reference_doctype not in (
            "Sales Invoice",
            "Purchase Invoice",
        ):
            continue

        invoice = frappe.db.get_value(
            reference.reference_doctype,
            reference.reference_name,
            [
                "name",
                "custom_dossier",
            ],
            as_dict=True,
        )

        if not invoice:
            frappe.throw(
                f"La facture {reference.reference_name} "
                f"n'existe pas."
            )

        if not invoice.custom_dossier:
            frappe.throw(
                f"La facture {reference.reference_name} "
                "n'est rattachée à aucun Dossier. "
                "Elle ne peut pas être réglée par Dealerp."
            )


def _get_financial_links(doc):
    """
    Récupère toutes les entités métier impactées par le paiement.

    Retourne :
        dossiers
        expeditions
        prestations
    """

    dossiers = set()
    expeditions = set()
    prestations = set()

    for reference in doc.references or []:

        if reference.reference_doctype not in (
            "Sales Invoice",
            "Purchase Invoice",
        ):
            continue

        invoice = frappe.db.get_value(
            reference.reference_doctype,
            reference.reference_name,
            [
                "custom_dossier",
                "custom_expedition_shipment",
                "custom_prestation",
            ],
            as_dict=True,
        )

        if not invoice:
            continue

        if invoice.custom_dossier:
            dossiers.add(invoice.custom_dossier)

        if invoice.custom_expedition_shipment:
            expeditions.add(
                invoice.custom_expedition_shipment
            )

        if invoice.custom_prestation:
            prestations.add(
                invoice.custom_prestation
            )

    return dossiers, expeditions, prestations


def _recalculate(doc):
    """
    Recalcule toutes les données financières impactées
    par le Payment Entry.
    """

    (
        dossiers,
        expeditions,
        prestations,
    ) = _get_financial_links(doc)

    # --------------------------------------------------
    # EXPEDITIONS
    # --------------------------------------------------

    for expedition in expeditions:
        recalculate_expedition(expedition)

    # --------------------------------------------------
    # PRESTATIONS
    # --------------------------------------------------

    for prestation in prestations:
        recalculate_prestation(prestation)

    # --------------------------------------------------
    # DOSSIERS
    # --------------------------------------------------

    for dossier in dossiers:
        recalculate_dossier(dossier)


def on_validate(doc, method):

    validate_payment_references(doc)


def on_submit(doc, method):

    validate_payment_references(doc)

    _recalculate(doc)


def on_cancel(doc, method):

    _recalculate(doc)


def on_update_after_submit(doc, method):

    _recalculate(doc)


def on_trash(doc, method):

    _recalculate(doc)
