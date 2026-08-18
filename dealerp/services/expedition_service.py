import frappe
from frappe.utils import flt

from dealerp.dealerp.kpi.calculation import (
    compute_margin,
    compute_profitability_percent,
)

def recalculate_expedition(expedition_name: str):

    expedition = frappe.get_doc("Expedition", expedition_name)

    purchase_total = flt(frappe.db.sql("""
        SELECT COALESCE(SUM(grand_total), 0)
        FROM `tabPurchase Invoice`
        WHERE docstatus = 1
        AND custom_expedition_shipment = %s
    """, expedition_name)[0][0])

    sales_total = flt(frappe.db.sql("""
        SELECT COALESCE(SUM(grand_total), 0)
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        AND custom_expedition_shipment = %s
    """, expedition_name)[0][0])

    collected_total = flt(frappe.db.sql("""
        SELECT COALESCE(SUM(per.allocated_amount), 0)
        FROM `tabPayment Entry` pe
        INNER JOIN `tabPayment Entry Reference` per
            ON per.parent = pe.name
        INNER JOIN `tabSales Invoice` si
            ON si.name = per.reference_name
        WHERE pe.docstatus = 1
        AND per.reference_doctype = 'Sales Invoice'
        AND si.docstatus = 1
        AND si.custom_expedition_shipment = %s
    """, expedition_name)[0][0])

    outstanding_total = max(sales_total - collected_total, 0)

    if sales_total:
        collection_percent = round(
            collected_total * 100 / sales_total,
            2,
        )
    else:
        collection_percent = 0

    expedition.db_set("total_cost", purchase_total)
    expedition.db_set("invoiced_revenue", sales_total)
    expedition.db_set("collected_revenue", collected_total)
    expedition.db_set("outstanding_revenue", outstanding_total)
    expedition.db_set("collection_percent", collection_percent)

    margin = compute_margin(sales_total, purchase_total)
    profitability = compute_profitability_percent(margin, sales_total)

    expedition.db_set("actual_margin", margin)
    expedition.db_set("profitability_percent", profitability)

    return {
        "purchase_total": purchase_total,
        "sales_total": sales_total,
        "collected_total": collected_total,
        "outstanding_total": outstanding_total,
        "collection_percent": collection_percent,
        "margin": margin,
        "profitability": profitability,
    }


@frappe.whitelist()
def get_financial_details(expedition_name):

    # --------------------------------------------------
    # FACTURES FOURNISSEURS
    # --------------------------------------------------

    purchase_invoices = frappe.get_all(
        "Purchase Invoice",
        filters={
            "docstatus": 1,
            "custom_expedition_shipment": expedition_name,
        },
        fields=[
            "name",
            "supplier",
            "posting_date",
            "due_date",
            "grand_total",
            "outstanding_amount",
            "status",
        ],
        order_by="posting_date desc",
    )

    # --------------------------------------------------
    # FACTURES CLIENTS
    # --------------------------------------------------

    sales_invoices = frappe.get_all(
        "Sales Invoice",
        filters={
            "docstatus": 1,
            "custom_expedition_shipment": expedition_name,
        },
        fields=[
            "name",
            "customer",
            "posting_date",
            "due_date",
            "grand_total",
            "outstanding_amount",
            "status",
        ],
        order_by="posting_date desc",
    )

    # --------------------------------------------------
    # REGLEMENTS
    # --------------------------------------------------
    #
    # Expedition
    #     ↓
    # Facture
    #     ↓
    # Payment Entry Reference
    #     ↓
    # Payment Entry
    #

    payments = frappe.db.sql(
        """
        SELECT
            pe.name,
            pe.posting_date,
            pe.payment_type,
            pe.party_type,
            pe.party,
            pe.paid_amount,
            pe.status,
            per.reference_doctype,
            per.reference_name,
            per.allocated_amount
        FROM `tabPayment Entry` pe
        INNER JOIN `tabPayment Entry Reference` per
            ON per.parent = pe.name
        INNER JOIN `tabSales Invoice` si
            ON si.name = per.reference_name
        WHERE
            pe.docstatus = 1
            AND per.reference_doctype = 'Sales Invoice'
            AND si.docstatus = 1
            AND si.custom_expedition_shipment = %s

        UNION ALL

        SELECT
            pe.name,
            pe.posting_date,
            pe.payment_type,
            pe.party_type,
            pe.party,
            pe.paid_amount,
            pe.status,
            per.reference_doctype,
            per.reference_name,
            per.allocated_amount
        FROM `tabPayment Entry` pe
        INNER JOIN `tabPayment Entry Reference` per
            ON per.parent = pe.name
        INNER JOIN `tabPurchase Invoice` pi
            ON pi.name = per.reference_name
        WHERE
            pe.docstatus = 1
            AND per.reference_doctype = 'Purchase Invoice'
            AND pi.docstatus = 1
            AND pi.custom_expedition_shipment = %s

        ORDER BY posting_date DESC, name DESC
        """,
        (expedition_name, expedition_name),
        as_dict=True,
    )

    expedition = frappe.get_doc(
        "Expedition",
        expedition_name
    )

    return {
        "purchase_invoices": purchase_invoices,
        "sales_invoices": sales_invoices,
        "payments": payments,
        "collected_revenue": expedition.collected_revenue or 0,
        "outstanding_revenue": expedition.outstanding_revenue or 0,
        "collection_percent": expedition.collection_percent or 0,
    }


@frappe.whitelist()
def get_dossier_dashboard(dossier_name):

    expeditions = frappe.get_all(
        "Expedition",
        filters={
            "deal_dossier": dossier_name
        },
        fields=[
            "name",
            "operation_type",
            "mode_transport",
            "invoiced_revenue",
            "total_cost",
            "actual_margin",
            "profitability_percent"
        ],
        order_by="creation asc"
    )

    dashboard = {
        "expedition_count": len(expeditions),
        "invoiced_revenue": sum(x.invoiced_revenue or 0 for x in expeditions),
        "total_cost": sum(x.total_cost or 0 for x in expeditions),
        "actual_margin": sum(x.actual_margin or 0 for x in expeditions),
        "expeditions": expeditions,
    }

    if dashboard["invoiced_revenue"]:
        dashboard["profitability_percent"] = round(
            dashboard["actual_margin"] * 100 / dashboard["invoiced_revenue"],
            2,
        )
    else:
        dashboard["profitability_percent"] = 0

    return dashboard
