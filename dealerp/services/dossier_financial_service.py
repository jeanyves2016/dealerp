import frappe
from frappe.utils import flt


def _get_allocated_payments(dossier_name, reference_doctype):
    """
    Retourne le total réellement alloué aux factures du Dossier.

    Relation :

        Dossier
          ↓
        Invoice
          ↓
        Payment Entry Reference
          ↓
        Payment Entry
    """

    result = frappe.db.sql(
        """
        SELECT COALESCE(SUM(per.allocated_amount), 0)
        FROM `tabPayment Entry Reference` per
        INNER JOIN `tabPayment Entry` pe
            ON pe.name = per.parent
        INNER JOIN `tab{doctype}` inv
            ON inv.name = per.reference_name
        WHERE pe.docstatus = 1
        AND per.reference_doctype = %s
        AND inv.docstatus = 1
        AND inv.custom_dossier = %s
        """.format(
            doctype=(
                "Sales Invoice"
                if reference_doctype == "Sales Invoice"
                else "Purchase Invoice"
            )
        ),
        (reference_doctype, dossier_name),
    )

    return flt(result[0][0] if result else 0)


def recalculate_dossier(dossier_name: str):
    """
    Recalcule la situation financière complète d'un Dossier.

    Revenus :
        - CA facturé
        - CA encaissé
        - reste à encaisser

    Coûts :
        - coûts facturés
        - coûts payés
        - reste à payer

    Rentabilité :
        - marge réelle
        - taux de rentabilité

    Les paiements sont calculés uniquement à partir des
    Payment Entry Reference réellement allouées aux factures.
    """

    if not dossier_name:
        return {}

    if not frappe.db.exists("Dossier", dossier_name):
        return {}

    # ==================================================
    # FACTURES CLIENT
    # ==================================================

    sales = frappe.db.sql(
        """
        SELECT
            COUNT(*) AS invoice_count,
            COALESCE(SUM(grand_total), 0) AS invoiced_revenue,
            COALESCE(SUM(outstanding_amount), 0) AS outstanding_revenue
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        AND custom_dossier = %s
        """,
        dossier_name,
        as_dict=True,
    )[0]

    sales_invoice_count = int(
        sales.invoice_count or 0
    )

    invoiced_revenue = flt(
        sales.invoiced_revenue
    )

    # ==================================================
    # ENCAISSEMENTS CLIENTS
    # ==================================================

    collected_revenue = _get_allocated_payments(
        dossier_name,
        "Sales Invoice",
    )

    # On calcule le reste à encaisser à partir
    # des paiements réellement enregistrés.
    outstanding_revenue = max(
        invoiced_revenue - collected_revenue,
        0,
    )

    # ==================================================
    # FACTURES FOURNISSEURS
    # ==================================================

    purchases = frappe.db.sql(
        """
        SELECT
            COUNT(*) AS invoice_count,
            COALESCE(SUM(grand_total), 0) AS total_cost,
            COALESCE(SUM(outstanding_amount), 0) AS outstanding_cost
        FROM `tabPurchase Invoice`
        WHERE docstatus = 1
        AND custom_dossier = %s
        """,
        dossier_name,
        as_dict=True,
    )[0]

    purchase_invoice_count = int(
        purchases.invoice_count or 0
    )

    total_cost = flt(
        purchases.total_cost
    )

    # ==================================================
    # PAIEMENTS FOURNISSEURS
    # ==================================================

    paid_cost = _get_allocated_payments(
        dossier_name,
        "Purchase Invoice",
    )

    outstanding_cost = max(
        total_cost - paid_cost,
        0,
    )

    # ==================================================
    # MARGE
    # ==================================================

    actual_margin = (
        invoiced_revenue
        - total_cost
    )

    if invoiced_revenue:
        profitability_percent = round(
            actual_margin * 100 / invoiced_revenue,
            2,
        )
    else:
        profitability_percent = 0

    # ==================================================
    # TAUX D'ENCAISSEMENT
    # ==================================================

    if invoiced_revenue:
        collection_percent = round(
            collected_revenue * 100 / invoiced_revenue,
            2,
        )
    else:
        collection_percent = 0

    # ==================================================
    # MISE A JOUR DU DOSSIER
    # ==================================================

    updates = {
        "invoiced_revenue": invoiced_revenue,
        "collected_revenue": collected_revenue,
        "outstanding_revenue": outstanding_revenue,

        "total_cost": total_cost,
        "paid_cost": paid_cost,
        "outstanding_cost": outstanding_cost,

        "actual_margin": actual_margin,
        "profitability_percent": profitability_percent,

        "sales_invoice_count": sales_invoice_count,
        "purchase_invoice_count": purchase_invoice_count,
    }

    # collection_percent n'existe peut-être pas encore
    # sur Dossier : on ne l'écrit donc que s'il existe.
    if frappe.get_meta("Dossier").get_field("collection_percent"):
        updates["collection_percent"] = collection_percent

    for fieldname, value in updates.items():
        frappe.db.set_value(
            "Dossier",
            dossier_name,
            fieldname,
            value,
            update_modified=False,
        )

    return {
        "dossier": dossier_name,
        **updates,
    }


@frappe.whitelist()
def get_dossier_financial_details(dossier_name):
    """
    Retourne le détail financier complet d'un Dossier.

    Cette fonction servira ensuite au dashboard.
    """

    if not frappe.db.exists("Dossier", dossier_name):
        frappe.throw(
            f"Le Dossier {dossier_name} n'existe pas."
        )

    sales_invoices = frappe.get_all(
        "Sales Invoice",
        filters={
            "docstatus": 1,
            "custom_dossier": dossier_name,
        },
        fields=[
            "name",
            "customer",
            "posting_date",
            "due_date",
            "grand_total",
            "paid_amount",
            "outstanding_amount",
            "status",
            "custom_expedition_shipment",
            "custom_prestation",
        ],
        order_by="posting_date desc",
    )

    purchase_invoices = frappe.get_all(
        "Purchase Invoice",
        filters={
            "docstatus": 1,
            "custom_dossier": dossier_name,
        },
        fields=[
            "name",
            "supplier",
            "posting_date",
            "due_date",
            "grand_total",
            "paid_amount",
            "outstanding_amount",
            "status",
            "custom_expedition_shipment",
            "custom_prestation",
        ],
        order_by="posting_date desc",
    )

    sales_payments = frappe.db.sql(
        """
        SELECT
            pe.name AS payment_entry,
            pe.posting_date,
            pe.payment_type,
            pe.mode_of_payment,
            per.reference_name AS invoice,
            per.allocated_amount
        FROM `tabPayment Entry Reference` per
        INNER JOIN `tabPayment Entry` pe
            ON pe.name = per.parent
        INNER JOIN `tabSales Invoice` si
            ON si.name = per.reference_name
        WHERE pe.docstatus = 1
        AND per.reference_doctype = 'Sales Invoice'
        AND si.docstatus = 1
        AND si.custom_dossier = %s
        ORDER BY pe.posting_date DESC
        """,
        dossier_name,
        as_dict=True,
    )

    purchase_payments = frappe.db.sql(
        """
        SELECT
            pe.name AS payment_entry,
            pe.posting_date,
            pe.payment_type,
            pe.mode_of_payment,
            per.reference_name AS invoice,
            per.allocated_amount
        FROM `tabPayment Entry Reference` per
        INNER JOIN `tabPayment Entry` pe
            ON pe.name = per.parent
        INNER JOIN `tabPurchase Invoice` pi
            ON pi.name = per.reference_name
        WHERE pe.docstatus = 1
        AND per.reference_doctype = 'Purchase Invoice'
        AND pi.docstatus = 1
        AND pi.custom_dossier = %s
        ORDER BY pe.posting_date DESC
        """,
        dossier_name,
        as_dict=True,
    )

    dossier = frappe.get_doc(
        "Dossier",
        dossier_name,
    )

    return {
        "sales_invoices": sales_invoices,
        "purchase_invoices": purchase_invoices,
        "sales_payments": sales_payments,
        "purchase_payments": purchase_payments,

        "invoiced_revenue": dossier.invoiced_revenue or 0,
        "collected_revenue": dossier.collected_revenue or 0,
        "outstanding_revenue": dossier.outstanding_revenue or 0,

        "total_cost": dossier.total_cost or 0,
        "paid_cost": dossier.paid_cost or 0,
        "outstanding_cost": dossier.outstanding_cost or 0,

        "actual_margin": dossier.actual_margin or 0,
        "profitability_percent": (
            dossier.profitability_percent or 0
        ),
    }
