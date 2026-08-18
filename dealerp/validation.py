import frappe


def validate_same_company(invoice, expedition):

    if not expedition:
        return

    expedition_company = frappe.db.get_value(
        "Expedition",
        expedition,
        "custom_société"
    )

    if expedition_company and expedition_company != invoice.company:
        frappe.throw(
            f"""
La société de la facture ({invoice.company})
est différente de celle de l'expédition
({expedition_company}).

Veuillez corriger cette incohérence.
"""
        )


def validate_invoice_reference(invoice):
    """
    Une facture Dealerp doit être rattachée à exactement
    une source métier : Expédition OU Prestation.
    """

    expedition = invoice.get("custom_expedition_shipment")
    prestation = invoice.get("custom_prestation")

    if not expedition and not prestation:
        frappe.throw(
            "La facture doit être rattachée à une Expédition "
            "ou à une Prestation."
        )

    if expedition and prestation:
        frappe.throw(
            "Une facture ne peut pas être rattachée simultanément "
            "à une Expédition et à une Prestation."
        )
