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
