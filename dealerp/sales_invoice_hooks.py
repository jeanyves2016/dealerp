import frappe
from dealerp.financial import recalculate_expedition


def on_submit(doc, method):
    frappe.log_error(
        f"SUBMIT - {doc.name} - {doc.custom_expédition__shipment}",
        "DEALERP SALES HOOK"
    )
    if doc.custom_expédition__shipment:
        recalculate_expedition(doc.custom_expédition__shipment)


def on_cancel(doc, method):
    frappe.log_error(
        f"CANCEL - {doc.name} - {doc.custom_expédition__shipment}",
        "DEALERP SALES HOOK"
    )
    if doc.custom_expédition__shipment:
        recalculate_expedition(doc.custom_expédition__shipment)


def on_update_after_submit(doc, method):
    frappe.log_error(
        f"UPDATE AFTER SUBMIT - {doc.name}",
        "DEALERP SALES HOOK"
    )


def on_trash(doc, method):
    frappe.log_error(
        f"TRASH - {doc.name}",
        "DEALERP SALES HOOK"
    )
