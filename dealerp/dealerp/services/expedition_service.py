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

    expedition.db_set("total_cost", purchase_total)
    expedition.db_set("invoiced_revenue", sales_total)

    margin = compute_margin(sales_total, purchase_total)
    profitability = compute_profitability_percent(margin, sales_total)

    expedition.db_set("actual_margin", margin)
    expedition.db_set("profitability_percent", profitability)

    return {
        "purchase_total": purchase_total,
        "sales_total": sales_total,
        "margin": margin,
        "profitability": profitability,
    }


@frappe.whitelist()
def get_financial_details(expedition_name):
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
            "status",
        ],
        order_by="posting_date desc",
    )

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
            "status",
        ],
        order_by="posting_date desc",
    )

    return {
        "purchase_invoices": purchase_invoices,
        "sales_invoices": sales_invoices,
    }


@frappe.whitelist()
def get_dossier_dashboard(dossier_name):
    dossier = frappe.get_doc("Dossier", dossier_name)

    expeditions = frappe.get_all(
        "Expedition",
        filters={
            "deal_dossier": dossier_name
        },
        fields=[
            "name",
            "custom_client",
            "custom_société",
            "custom_responsable",
            "transit_type",
            "operation_type",
            "mode_transport",
            "incoterm",
            "port_origin",
            "port_destination",
            "shipping_line",
            "agency",
            "etd",
            "eta",
            "estimated_revenue",
            "invoiced_revenue",
            "total_cost",
            "estimated_margin",
            "actual_margin",
            "profitability_percent",
        ],
        order_by="creation asc",
    )

    dashboard = {
        "dossier": {
            "name": dossier.name,
            "dossier_number": dossier.get("dossier_number"),
            "workflow_state": dossier.get("workflow_state"),
            "customer": dossier.get("customer"),
            "company": dossier.get("company"),
            "owner_user": dossier.get("owner_user"),
            "internal_reference": dossier.get("internal_reference"),
            "description": dossier.get("description"),
            "quotation": dossier.get("quotation"),
            "sales_order": dossier.get("sales_order"),
        },
        "expedition_count": len(expeditions),
        "invoiced_revenue": sum(
            flt(x.invoiced_revenue) for x in expeditions
        ),
        "total_cost": sum(
            flt(x.total_cost) for x in expeditions
        ),
        "actual_margin": sum(
            flt(x.actual_margin) for x in expeditions
        ),
        "expeditions": expeditions,
    }

    if dashboard["invoiced_revenue"]:
        dashboard["profitability_percent"] = round(
            dashboard["actual_margin"] * 100
            / dashboard["invoiced_revenue"],
            2,
        )
    else:
        dashboard["profitability_percent"] = 0

    return dashboard
